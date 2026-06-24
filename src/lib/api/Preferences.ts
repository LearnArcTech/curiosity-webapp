/**
 * $lib/api/preferences.ts
 */

import { supabase } from "../supabaseClient";
import { assert } from "./utils";
import type { UserPreferences, FontSize, Contrast } from "./types";

export const preferences = {
  async get(): Promise<UserPreferences> {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();
    if (error) throw error;
    return data;
  },

  async setAccessibility(opts: {
    font_size?: FontSize;
    contrast?: Contrast;
    simple_mode?: boolean;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const { error } = await supabase
      .from("user_preferences")
      .update({ ...opts, updated_at: new Date().toISOString() })
      .eq("user_id", userData.user.id);
    if (error) throw error;
    return { message: "preferences updated" };
  },
};
