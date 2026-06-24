/**
 * $lib/api/quizzes.ts
 */

import { supabase } from "../supabaseClient";
import type { QuizOption, SessionQuiz, QuizResponseRow } from "./types";

export const quizzes = {
  async create(
    sessionId: string,
    title: string,
    description: string | null,
    questionType: "single" | "multiple" | "input",
    options: QuizOption[],
    correctAnswer: string | string[],
    timeLimitSeconds: number | null,
  ): Promise<{ quiz_id: string }> {
    const { data, error } = await supabase.rpc("create_session_quiz", {
      p_session_id: sessionId,
      p_title: title,
      p_description: description,
      p_question_type: questionType,
      p_options: options,
      p_correct_answer: correctAnswer,
      p_time_limit_seconds: timeLimitSeconds,
    });
    if (error) throw error;
    return data as { quiz_id: string };
  },

  async getActive(sessionId: string): Promise<SessionQuiz | null> {
    const { data, error } = await supabase
      .from("session_quizzes")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async endActive(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from("session_quizzes")
      .update({ is_active: false })
      .eq("session_id", sessionId)
      .eq("is_active", true);
    if (error) throw error;
  },

  async submitAnswer(
    quizId: string,
    answer: string | string[],
  ): Promise<{ is_correct: boolean }> {
    const { data, error } = await supabase.rpc("submit_quiz_answer", {
      p_quiz_id: quizId,
      p_answer: answer,
    });
    if (error) throw error;
    return data as { is_correct: boolean };
  },

  subscribeToQuizzes(sessionId: string, onChange: () => void) {
    const channel = supabase
      .channel(`session_quizzes_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_quizzes",
          filter: `session_id=eq.${sessionId}`,
        },
        () => onChange(),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  subscribeToResponses(
    sessionId: string,
    onResponse: (row: QuizResponseRow) => void,
  ) {
    const channel = supabase
      .channel(`quiz_responses_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "quiz_responses",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => onResponse(payload.new as QuizResponseRow),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};
