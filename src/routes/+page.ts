import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { onboarding } from "$lib/api";
import { supabase } from "$lib/supabaseClient";

export const ssr = false;

export const load: PageLoad = async () => {
  const session = await new Promise<any>((resolve) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        subscription.unsubscribe();
        resolve(session);
      }
    });
    setTimeout(() => resolve(null), 2000);
  });

  if (session) {
    try {
      const status = await onboarding.status();
      if (status) {
        throw redirect(302, status.complete ? "/courses" : "/onboarding");
      }
    } catch (err: any) {
      if (err?.status === 302) throw err;
      return;
    }
  }
};
