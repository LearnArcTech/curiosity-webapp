/**
 * $lib/api/dashboard.ts
 */

import { supabase } from "../supabaseClient";
import { average, countedParticipants, durationMinutes } from "./utils";
import type {
  DashboardData,
  CourseSummaryData,
  PodiumEntry,
  DashboardStudentEntry,
  CourseSummaryStudentEntry,
} from "./types";

type RawStudentRow = {
  course_id: string;
  user_id: string;
  quiz_score: number;
  participation_value: number;
  profiles: { username: string } | { username: string }[];
};

type RawSessionRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  session_participants: { status: string }[];
};

function usernameOf(row: RawStudentRow): string {
  return Array.isArray(row.profiles)
    ? row.profiles[0]?.username
    : row.profiles.username;
}

async function fetchCourseStudents(
  courseIds: string[],
): Promise<RawStudentRow[]> {
  if (courseIds.length === 0) return [];
  const { data, error } = await supabase
    .from("course_students")
    .select(
      "course_id, user_id, quiz_score, participation_value, profiles!inner(username)",
    )
    .in("course_id", courseIds);
  if (error) throw error;
  return data as any[];
}

async function fetchSessionsWithAttendance(
  courseIds: string[],
): Promise<RawSessionRow[]> {
  if (courseIds.length === 0) return [];
  const { data, error } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at, session_participants(status)")
    .in("course_id", courseIds);
  if (error) throw error;
  return data as any[];
}

function buildPodium(rows: RawStudentRow[]): PodiumEntry[] {
  const bestByUser = new Map<string, PodiumEntry>();
  for (const row of rows) {
    const existing = bestByUser.get(row.user_id);
    if (!existing || row.quiz_score > existing.quiz_score) {
      bestByUser.set(row.user_id, {
        username: usernameOf(row),
        quiz_score: row.quiz_score,
      });
    }
  }
  return [...bestByUser.values()]
    .sort((a, b) => b.quiz_score - a.quiz_score)
    .slice(0, 3);
}

function buildSessionMetrics(sessions: RawSessionRow[]) {
  return {
    assistance_average: average(
      sessions.map((s) => countedParticipants(s.session_participants)),
    ),
    session_length_average: average(
      sessions.map((s) => durationMinutes(s.started_at, s.ended_at)),
    ),
  };
}

export const dashboard = {
  async global(): Promise<DashboardData> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("not authenticated");

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (pErr) throw pErr;

    const courseIdsQuery =
      profile.role === "teacher"
        ? supabase
            .from("course_teachers")
            .select("course_id")
            .eq("user_id", userData.user.id)
        : supabase
            .from("course_students")
            .select("course_id")
            .eq("user_id", userData.user.id);

    const { data: courseLinks, error: cErr } = await courseIdsQuery;
    if (cErr) throw cErr;
    const courseIds = (courseLinks ?? []).map((c: any) => c.course_id);

    const [studentRows, sessionRows] = await Promise.all([
      fetchCourseStudents(courseIds),
      fetchSessionsWithAttendance(courseIds),
    ]);

    const students: DashboardStudentEntry[] = studentRows.map((row) => ({
      id: row.user_id,
      username: usernameOf(row),
      course_id: row.course_id,
      participation_value: row.participation_value,
      quiz_score: row.quiz_score,
    }));

    return {
      participation_average: average(
        studentRows.map((r) => r.participation_value),
      ),
      podium: buildPodium(studentRows),
      students,
      ...buildSessionMetrics(sessionRows),
    };
  },

  async courseSummary(courseId: string): Promise<CourseSummaryData> {
    const [studentRows, sessionRows] = await Promise.all([
      fetchCourseStudents([courseId]),
      fetchSessionsWithAttendance([courseId]),
    ]);

    const students: CourseSummaryStudentEntry[] = studentRows.map((row) => ({
      id: row.user_id,
      username: usernameOf(row),
      participation_value: row.participation_value,
      quiz_score: row.quiz_score,
    }));

    return {
      participation_average: average(
        studentRows.map((r) => r.participation_value),
      ),
      podium: buildPodium(studentRows),
      students,
      ...buildSessionMetrics(sessionRows),
    };
  },

  subscribeToCourse(courseId: string, onChange: () => void) {
    const channel = supabase
      .channel(`course_dashboard_metrics_${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `course_id=eq.${courseId}`,
        },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_students",
          filter: `course_id=eq.${courseId}`,
        },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "files",
          filter: `course_id=eq.${courseId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
