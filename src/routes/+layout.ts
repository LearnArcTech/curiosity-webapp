// src/routes/+layout.ts
import { profile } from "$lib/api";

export const ssr = false;

export async function load() {
  try {
    const me = await profile.me();
    return { user: me };
  } catch {
    return { user: null };
  }
}
