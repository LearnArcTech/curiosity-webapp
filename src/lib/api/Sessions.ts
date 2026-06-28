/**
 * $lib/api/sessions.ts
 */

import { supabase } from "../supabaseClient";
import { durationMinutes } from "./utils";
import type { SessionRow, SessionDetail, SessionParticipant } from "./types";

export const sessions = {
  async list(courseId: string): Promise<SessionRow[]> {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, course_id, name, require_waiting_room, created_by, started_at, ended_at, is_active, session_participants(count)",
      )
      .eq("course_id", courseId)
      .order("started_at", { ascending: false });
    if (error) throw error;

    return data.map((s: any): SessionRow => ({
      id: s.id,
      course_id: s.course_id,
      name: s.name,
      require_waiting_room: s.require_waiting_room,
      created_by: s.created_by,
      started_at: s.started_at,
      ended_at: s.ended_at,
      is_active: s.is_active,
      duration_minutes: durationMinutes(s.started_at, s.ended_at),
      participant_count: s.session_participants[0]?.count ?? 0,
    }));
  },

  async create(
    courseId: string,
    name: string,
    password?: string,
    requireWaitingRoom: boolean = false,
  ): Promise<{ session_id: string; message: string }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("not authenticated");

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        course_id: courseId,
        name: name.trim(),
        password: password?.trim() || null,
        require_waiting_room: requireWaitingRoom,
        created_by: userData.user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { session_id: data.id, message: "session started" };
  },

  async get(sessionId: string): Promise<SessionDetail> {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `id, course_id, name, require_waiting_room, created_by, started_at, ended_at, is_active,
           session_participants(user_id, status, is_teacher, joined_at, left_at, is_hand_raised, profiles!inner(username))`,
      )
      .eq("id", sessionId)
      .single();

    if (error || !data) throw new Error("Sesión no encontrada.");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("No autenticado.");

    if (data.created_by !== userData.user.id) {
      const { data: enrollment, error: enrollError } = await supabase
        .from("course_students")
        .select("enrolled_at")
        .eq("course_id", data.course_id)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (enrollError || !enrollment) {
        throw new Error(
          "No tienes permisos para acceder a esta sesión o no estás inscrito en el curso.",
        );
      }
    }

    const participants: SessionParticipant[] = (
      data as any
    ).session_participants.map((p: any): SessionParticipant => ({
      id: p.user_id,
      username: p.profiles.username,
      status: p.status,
      is_teacher: p.is_teacher,
      joined_at: p.joined_at,
      left_at: p.left_at,
      hand_raised: p.is_hand_raised,
    }));

    return {
      id: data.id,
      course_id: data.course_id,
      name: data.name,
      require_waiting_room: data.require_waiting_room,
      created_by: data.created_by,
      started_at: data.started_at,
      ended_at: data.ended_at,
      is_active: data.is_active,
      duration_minutes: durationMinutes(data.started_at, data.ended_at),
      participant_count: participants.filter((p) => p.status === "approved")
        .length,
      waiting_count: participants.filter((p) => p.status === "waiting").length,
      participants,
    };
  },

  async join(
    sessionId: string,
    password?: string,
  ): Promise<{ status: "waiting" | "approved"; message: string }> {
    const { data, error } = await supabase.rpc("join_session", {
      p_session_id: sessionId,
      p_password: password?.trim() || null,
    });

    if (error) throw error;
    return data as { status: "waiting" | "approved"; message: string };
  },

  async approveParticipant(sessionId: string, studentId: string): Promise<any> {
    const { data, error } = await supabase.rpc("approve_participant", {
      p_session_id: sessionId,
      p_student_id: studentId,
    });

    if (error) throw error;
    return data;
  },

  async rejectParticipant(sessionId: string, studentId: string) {
    const { error } = await supabase
      .from("session_participants")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", studentId);

    if (error) throw error;
    return { message: "Participant removed from session" };
  },

  async leave(
    sessionId: string,
    endSession: boolean = false,
  ): Promise<{ message: string; session_ended: boolean }> {
    const { data, error } = await supabase.rpc("leave_session", {
      p_session_id: sessionId,
      p_end_session: endSession,
    });
    if (error) throw error;
    return data as { message: string; session_ended: boolean };
  },

  async end(sessionId: string): Promise<{ message: string }> {
    const { data, error } = await supabase.rpc("end_session", {
      p_session_id: sessionId,
    });
    if (error) throw error;
    return data as { message: string };
  },

  async remove(sessionId: string): Promise<{ message: string }> {
    await this.end(sessionId).catch(() => {});
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);
    if (error) throw error;
    return { message: "session deleted" };
  },

  async toggleHand(sessionId: string, isRaised: boolean): Promise<void> {
    const { error } = await supabase.rpc("toggle_hand", {
      p_session_id: sessionId,
      p_is_raised: isRaised,
    });
    if (error) throw error;
  },

  subscribe(sessionId: string, onChange: () => void) {
    const channel = supabase
      .channel(`session_room_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async heartbeat(sessionId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("session_participants")
      .update({ last_seen: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("user_id", userData.user.id);
    if (error) throw error;
  },

  subscribeToCourse(courseId: string, onChange: () => void) {
    const channel = supabase
      .channel(`course_sessions_channel_${courseId}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToParticipant(
    sessionId: string,
    userId: string,
    onStatusChange: (status: "waiting" | "approved" | "left") => void,
  ) {
    const channel = supabase
      .channel(`participant-status-${sessionId}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "session_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("[RT] UPDATE payload:", payload);
          if (payload.new?.user_id === userId) {
            console.log(
              "[RT] status match, calling onStatusChange:",
              payload.new.status,
            );
            onStatusChange(payload.new.status);
          } else {
            console.log("[RT] UPDATE received but user_id mismatch", {
              expected: userId,
              got: payload.new?.user_id,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "session_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("[RT] DELETE payload:", payload);
          if (payload.old?.user_id === userId) {
            onStatusChange("left");
          }
        },
      )
      .subscribe((status, err) => {
        console.log("[RT] channel subscription status:", status, err ?? "");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async shareExample(sessionId: string, spec: object): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("not authenticated");

    // Deactivate any currently active example first
    await supabase
      .from("session_examples")
      .update({ is_active: false })
      .eq("session_id", sessionId)
      .eq("is_active", true);

    const { error } = await supabase.from("session_examples").insert({
      session_id: sessionId,
      example_spec: spec,
      shared_by: userData.user.id,
    });
    if (error) throw error;
  },

  async getActiveExample(sessionId: string): Promise<object | null> {
    const { data, error } = await supabase
      .from("session_examples")
      .select("example_spec")
      .eq("session_id", sessionId)
      .eq("is_active", true)
      .order("shared_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.example_spec ?? null;
  },

  async clearSharedExample(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from("session_examples")
      .update({ is_active: false })
      .eq("session_id", sessionId)
      .eq("is_active", true);
    if (error) throw error;
  },

  subscribeToExamples(
    sessionId: string,
    onChange: (spec: object | null) => void,
  ) {
    const channel = supabase
      .channel(`session_examples_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_examples",
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          const spec = await sessions
            .getActiveExample(sessionId)
            .catch(() => null);
          onChange(spec);
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};
