import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { onboarding } from "$lib/api";
import { supabase } from "$lib/supabaseClient";

export const ssr = false;

export const load: PageLoad = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(302, "/");
  }

  try {
    const status = await onboarding.status();
    if (status?.complete) {
      redirect(302, "/courses");
    }
  } catch {
    redirect(302, "/");
  }
};
