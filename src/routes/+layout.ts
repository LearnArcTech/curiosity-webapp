// src/routes/+layout.ts
import { profile, preferences } from "$lib/api";

export const ssr = false;

export async function load({ depends }) {
  depends("app:preferences");

  try {
    const me = await profile.me();
    const prefs = await preferences.get();
    return { user: me, prefs: prefs };
  } catch {
    return { user: null };
  }
}
