/**
 * $lib/api/scores.ts
 */

import { supabase } from "../supabaseClient";

export const scores = {
  async setQuizScore(courseId: string, studentId: string, score: number) {
    const { data, error } = await supabase.rpc("set_quiz_score", {
      p_course_id: courseId,
      p_student_id: studentId,
      p_score: score,
    });
    if (error) throw error;
    return data as { message: string };
  },

  async setParticipation(courseId: string, studentId: string, value: number) {
    const { data, error } = await supabase.rpc("set_participation_manual", {
      p_course_id: courseId,
      p_student_id: studentId,
      p_value: value,
    });
    if (error) throw error;
    return data as { message: string };
  },

  async clearParticipationOverride(courseId: string, studentId: string) {
    const { data, error } = await supabase.rpc("clear_participation_manual", {
      p_course_id: courseId,
      p_student_id: studentId,
    });
    if (error) throw error;
    return data as { message: string };
  },
};
