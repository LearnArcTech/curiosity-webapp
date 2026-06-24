// routes/courses/+layout.ts
import { redirect } from "@sveltejs/kit";
import { profile, courses } from "$lib/api";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async () => {
  try {
    const [user, coursesList] = await Promise.all([
      profile.me(),
      courses.list(),
    ]);

    return {
      user,
      coursesList,
    };
  } catch (error) {
    console.error("Failed to load courses layout data:", error);
    redirect(302, "/");
  }
};
