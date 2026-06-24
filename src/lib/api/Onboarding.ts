/**
 * $lib/api/onboarding.ts
 */

import { supabase } from "../supabaseClient";
import { assert } from "./utils";
import type { OnboardingStatus, Role } from "./types";

export const onboarding = {
  async status(): Promise<OnboardingStatus> {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .select("role, username")
      .eq("id", userData.user.id)
      .single();
    if (error) throw error;

    return {
      role: data.role,
      username: data.username,
      complete: Boolean(data.role && data.username),
    };
  },

  async setRole(role: Role) {
    const { data, error } = await supabase.rpc("onboarding_set_role", {
      p_role: role,
    });
    if (error) throw error;
    return data as { role: Role };
  },

  async setUsername(username: string) {
    const { data, error } = await supabase.rpc("onboarding_set_username", {
      p_username: username,
    });
    if (error) throw error;
    return data as { username: string };
  },

  async createCourse(name: string) {
    const { data, error } = await supabase.rpc("onboarding_create_course", {
      p_name: name,
    });
    if (error) throw error;
    return data as { course_id: string; name: string };
  },
};
