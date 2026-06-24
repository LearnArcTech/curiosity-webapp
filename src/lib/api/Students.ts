/**
 * $lib/api/students.ts
 */

import { supabase } from "../supabaseClient";
import type { StudentRow } from "./types";

export const students = {
  async list(courseId: string): Promise<StudentRow[]> {
    const { data, error } = await supabase
      .from("course_students")
      .select(
        "enrolled_at, quiz_score, participation_value, participation_is_manual, profiles!inner(id, username, email)",
      )
      .eq("course_id", courseId);
    if (error) throw error;

    return (data as any[]).map(
      (row: any): StudentRow => ({
        id: row.profiles.id,
        username: row.profiles.username,
        email: row.profiles.email,
        enrolled_at: row.enrolled_at,
        quiz_score: row.quiz_score,
        participation_value: row.participation_value,
        participation_is_manual: row.participation_is_manual,
      }),
    );
  },

  subscribe(courseId: string, onChange: () => void) {
    const channel = supabase
      .channel(`course_academics_${courseId}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
