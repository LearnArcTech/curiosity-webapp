// /routes/session/[sessionId]/+page.ts
import { redirect } from "@sveltejs/kit";
import { sessions, profile, courses } from "$lib/api";

export const ssr = false;

export async function load({ params }) {
  const { sessionId } = params;

  let me;
  try {
    me = await profile.me();
  } catch {
    throw redirect(302, "/");
  }

  let session;
  try {
    session = await sessions.get(sessionId);
  } catch {
    throw redirect(302, "/courses");
  }

  if (session.created_by === me.id) {
    return { sessionId };
  }

  const teachers = await courses.listTeachers(session.course_id);
  if (teachers.some((t) => t.id === me.id)) {
    return { sessionId };
  }

  const myParticipant = session.participants.find((p) => p.id === me.id);
  if (myParticipant?.status === "approved") {
    return { sessionId };
  }

  throw redirect(302, `/join/${sessionId}`);
}
