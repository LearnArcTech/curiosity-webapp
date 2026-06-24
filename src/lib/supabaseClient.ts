import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} from "$env/static/public";

export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

export function currentSessionId(
  accessToken: string | undefined | null,
): string | null {
  if (!accessToken) return null;
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    return payload.session_id ?? null;
  } catch {
    return null;
  }
}
