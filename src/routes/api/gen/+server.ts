import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { buildExampleSystemPrompt } from "$lib/generation/guide";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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

  const apiKey = env.OPENROUTER_API_KEY;
  const model = env.OPENROUTER_MODEL;

  if (!apiKey || !model) {
    console.error(
      "ai-chat: faltan variables de entorno OPENROUTER_API_KEY y/o OPENROUTER_MODEL",
    );
    return json({ error: "server_misconfigured" }, { status: 500 });
  }

  const systemPrompt = buildExampleSystemPrompt(
    typeof sessionContext === "string" && sessionContext.trim()
      ? sessionContext
      : "la sesión",
  );

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [{ role: "system", content: systemPrompt }, ...cleanMessages],
      }),
    });
  } catch (err) {
    console.error("ai-chat: error de red al llamar a OpenRouter", err);
    return json({ error: "upstream_unreachable" }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error(
      "ai-chat: OpenRouter respondió con error",
      upstream.status,
      errText,
    );
    return json({ error: "upstream_error" }, { status: 502 });
  }

  const data = await upstream.json();
  const message: string = data?.choices?.[0]?.message?.content ?? "";

  if (!message) {
    console.error(
      "ai-chat: respuesta de OpenRouter sin contenido",
      JSON.stringify(data),
    );
    return json({ error: "empty_completion" }, { status: 502 });
  }

  return json({ message });
};
