/**
 * $lib/api/utils.ts
 */

export function durationMinutes(started_at: string, ended_at: string | null) {
  const end = ended_at ? new Date(ended_at) : new Date();
  return Math.round((end.getTime() - new Date(started_at).getTime()) / 60000);
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function countedParticipants<T extends { status: string }>(
  participants: T[],
): number {
  return participants.filter(
    (p) => p.status === "approved" || p.status === "left",
  ).length;
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown Device";
}
