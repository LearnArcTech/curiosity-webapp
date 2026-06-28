// routes/courses/+page.ts
import type { PageLoad } from "./$types";
import { dashboard } from "$lib/api";

export const load: PageLoad = async () => {
  const summaryData = await dashboard.global();
  return { summaryData };
};
