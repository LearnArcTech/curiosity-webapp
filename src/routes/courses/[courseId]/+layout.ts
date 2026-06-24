// routes/courses/[courseId]/+layout.ts
import { courses } from "$lib/api";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ params }) => {
  const courseDetail = courses.get(params.courseId);
  return { courseDetail };
};
