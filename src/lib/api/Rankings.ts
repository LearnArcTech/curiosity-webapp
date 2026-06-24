/**
 * $lib/api/rankings.ts
 */

import { supabase } from "../supabaseClient";

type RankingRow = {
  user_id: string;
  username: string;
  quiz_score: number;
  participation_value: number;
  participation_is_manual: boolean;
};

async function fetchCourseStudents(courseId: string): Promise<RankingRow[]> {
  const { data, error } = await supabase
    .from("course_students")
    .select(
      "user_id, quiz_score, participation_value, participation_is_manual, profiles!inner(username)",
    )
    .eq("course_id", courseId);
  if (error) throw error;

  return (data as any[]).map((row) => ({
    user_id: row.user_id,
    username: row.profiles.username,
    quiz_score: row.quiz_score,
    participation_value: row.participation_value,
    participation_is_manual: row.participation_is_manual,
  }));
}

export const rankings = {
  async quiz(courseId: string) {
    const rows = await fetchCourseStudents(courseId);
    return rows
      .map(({ user_id, username, quiz_score }) => ({
        user_id,
        username,
        quiz_score,
      }))
      .sort((a, b) => b.quiz_score - a.quiz_score);
  },

  async participation(courseId: string) {
    const rows = await fetchCourseStudents(courseId);
    return rows
      .map(
        ({
          user_id,
          username,
          participation_value,
          participation_is_manual,
        }) => ({
          user_id,
          username,
          participation_value,
          participation_is_manual,
        }),
      )
      .sort((a, b) => b.participation_value - a.participation_value);
  },
};
