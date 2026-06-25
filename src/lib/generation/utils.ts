import type { ExampleSpec, ExampleBlock } from "./sharedTypes";
import { KNOWN_BLOCK_TYPES } from "./sharedTypes";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Narrow, defensive validation. We don't need a full schema validator here:
 * the goal is just to decide "does this look like an ExampleSpec we can
 * safely render", filtering out anything the model hallucinated.
 */
export function isExampleSpec(value: unknown): value is ExampleSpec {
  if (!isPlainObject(value)) return false;
  if (value.kind !== "interactive-example") return false;
  if (typeof value.title !== "string" || value.title.trim() === "")
    return false;
  if (!Array.isArray(value.blocks)) return false;
  return true;
}

/**
 * Drops any block whose `type` isn't one we actually have a component for,
 * instead of failing the whole example. Keeps the renderer simple and
 * tolerant of small model mistakes.
 */
function sanitizeBlocks(blocks: unknown[]): ExampleBlock[] {
  const known = new Set<string>(KNOWN_BLOCK_TYPES);
  return blocks.filter(
    (b): b is ExampleBlock =>
      isPlainObject(b) && typeof b.type === "string" && known.has(b.type),
  );
}

export function tryParseExampleSpec(raw: string): ExampleSpec | null {
  if (!raw) return null;
  let candidate = raw.trim();

  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) candidate = fenced[1].trim();

  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  candidate = candidate.slice(first, last + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }

  if (!isExampleSpec(parsed)) return null;

  return {
    kind: "interactive-example",
    title: parsed.title,
    description:
      typeof parsed.description === "string" ? parsed.description : undefined,
    blocks: sanitizeBlocks(parsed.blocks as unknown[]),
  };
}
