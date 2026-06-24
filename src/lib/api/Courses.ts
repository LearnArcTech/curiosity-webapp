/**
 * $lib/api/courses.ts
 */

import { supabase } from "../supabaseClient";
import { assert } from "./utils";
import type { CourseRow, TeacherRow } from "./types";

export const courses = {
  async list(): Promise<CourseRow[]> {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, repo_used, quota_total, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(name: string) {
    const { data, error } = await supabase.rpc("onboarding_create_course", {
      p_name: name,
    });
    if (error) throw error;
    return data as { course_id: string; name: string };
  },

  async get(courseId: string): Promise<CourseRow> {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, repo_used, quota_total, created_at")
      .eq("id", courseId)
      .single();
    if (error) throw error;
    return data;
  },

  async rename(courseId: string, name: string) {
    const { error } = await supabase
      .from("courses")
      .update({ name })
      .eq("id", courseId);
    if (error) throw error;
    return { message: "course renamed" };
  },

  async remove(courseId: string) {
    const { data: files, error: fetchErr } = await supabase
      .from("files")
      .select("storage_path")
      .eq("course_id", courseId);

    if (fetchErr) throw fetchErr;

    if (files && files.length > 0) {
      const paths = files
        .filter((f) => f.storage_path)
        .map((f) => f.storage_path as string);

      if (paths.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from("course-files")
          .remove(paths);

        if (storageErr) throw storageErr;
      }
    }

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) throw error;

    return { message: "course and associated files deleted" };
  },

  async listTeachers(courseId: string): Promise<TeacherRow[]> {
    const { data, error } = await supabase
      .from("course_teachers")
      .select("added_at, profiles!inner(id, username, email)")
      .eq("course_id", courseId);
    if (error) throw error;

    return data.map(
      (row: any): TeacherRow => ({
        id: row.profiles.id,
        username: row.profiles.username,
        email: row.profiles.email,
        added_at: row.added_at,
      }),
    );
  },

  async addTeacher(courseId: string, email: string) {
    const { data, error } = await supabase.rpc("add_course_teacher", {
      p_course_id: courseId,
      p_email: email,
    });
    if (error) throw error;
    return data as { message: string };
  },

  async enroll(courseId: string) {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");
    const { error } = await supabase
      .from("course_students")
      .insert({ course_id: courseId, user_id: userData.user.id });
    if (error) throw error;
    return { message: "enrolled" };
  },

  async leave(courseId: string) {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");
    const { error } = await supabase
      .from("course_students")
      .delete()
      .eq("course_id", courseId)
      .eq("user_id", userData.user.id);
    if (error) throw error;
    return { message: "left course" };
  },

  async removeStudent(courseId: string, userId: string) {
    const { error } = await supabase
      .from("course_students")
      .delete()
      .eq("course_id", courseId)
      .eq("user_id", userId);
    if (error) throw error;
    return { message: "student removed" };
  },

  subscribe(courseId: string, onChange: () => void) {
    const channel = supabase
      .channel(`course_room_${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courses",
          filter: `id=eq.${courseId}`,
        },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_teachers",
          filter: `course_id=eq.${courseId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
  subscribeAll(onChange: () => void) {
    const channel = supabase
      .channel("courses_global_watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_students" },
        () => onChange(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_teachers" },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
