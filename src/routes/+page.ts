import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { onboarding } from "$lib/api";
import { supabase } from "$lib/supabaseClient";

export const ssr = false;

export const load: PageLoad = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    try {
      const status = await onboarding.status();
      if (status) {
        redirect(302, status.complete ? "/courses" : "/onboarding");
      }
    } catch {
      return;
    }
  }
};
