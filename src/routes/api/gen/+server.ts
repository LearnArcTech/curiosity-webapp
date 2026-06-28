import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MISTRAL_URL = "https://api.mistral.ai/v1/agents/completions";
const TIMEOUT_MS = 25_000;

export const POST: RequestHandler = async ({ request }) => {
  let body: { messages?: unknown; sessionContext?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json_body" }, { status: 400 });
  }

  const { messages, sessionContext } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "messages_required" }, { status: 400 });
  }

  const cleanMessages: ChatMessage[] = messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content }));

  if (cleanMessages.length === 0) {
    return json({ error: "messages_required" }, { status: 400 });
  }

  const apiKey = env.MISTRAL_API_KEY;
  const agentId = env.MISTRAL_AGENT_ID;

  if (!apiKey || !agentId) {
    console.error(
      "ai-chat: faltan variables de entorno MISTRAL_API_KEY y/o MISTRAL_AGENT_ID",
    );
    return json({ error: "server_misconfigured" }, { status: 500 });
  }

  const messagesWithContext: ChatMessage[] =
    typeof sessionContext === "string" && sessionContext.trim()
      ? [
          {
            role: "user",
            content: `[Contexto de sesión: "${sessionContext.trim()}"]`,
          },
          ...cleanMessages,
        ]
      : cleanMessages;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        agent_id: agentId,
        messages: messagesWithContext,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`ai-chat: request timed out after ${TIMEOUT_MS}ms`);
      return json({ error: "timeout" }, { status: 504 });
    }
    console.error("ai-chat: error de red al llamar a Mistral", err);
    return json({ error: "upstream_unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error(
      "ai-chat: Mistral respondió con error",
      upstream.status,
      errText,
    );
    return json({ error: "upstream_error" }, { status: 502 });
  }

  const data = await upstream.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "";

  if (!raw) {
    console.error(
      "ai-chat: respuesta de Mistral sin contenido",
      JSON.stringify(data),
    );
    return json({ error: "empty_completion" }, { status: 502 });
  }

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.warn(
      "ai-chat: respuesta no es JSON válido, wrapping como chat",
      raw,
    );
    parsed = { type: "chat", message: raw };
  }

  return json({ response: parsed });
};
