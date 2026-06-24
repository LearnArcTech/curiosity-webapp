import { profile } from "$lib/api";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async () => {
  const me = await profile.me();
  return {
    profile: me,
    avatarUrl: null as string | null,
  };
};
