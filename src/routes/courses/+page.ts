// routes/courses/+layout.ts
import { redirect } from "@sveltejs/kit";
import { dashboard, courses } from "$lib/api";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async () => {
  try {
    const globalDashboardData = await dashboard.global();
    return globalDashboardData;
  } catch (error) {
    console.error("Failed to load global dashboard data:", error);
    redirect(302, "/");
  }
};
