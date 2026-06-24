import { redirect } from "@sveltejs/kit";

export function load({ params }) {
    redirect(307, `/courses/${params.courseId}/progreso/resumen`);
}