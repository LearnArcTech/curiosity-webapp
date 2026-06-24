import { supabase } from "$lib/supabaseClient";
import { profile } from "$lib/api";
import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw redirect(302, "/");
  }

  try {
    const user = await profile.me();
    return {
      isAuthenticated: true,
      user,
    };
  } catch (error) {
    console.error("Failed to load profile for help layout:", error);
    throw error;
  }
};
