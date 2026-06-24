/**
 * $lib/api/repository.ts
 */

import { supabase } from "../supabaseClient";
import { assert } from "./utils";
import type { FileRow, RepositorySummary } from "./types";

export const repository = {
  async list(courseId: string): Promise<RepositorySummary> {
    const [{ data: files, error: fErr }, { data: course, error: cErr }] =
      await Promise.all([
        supabase
          .from("files")
          .select(
            "id, filename, file_size, file_type, uploaded_at, uploaded_by, storage_path",
          )
          .eq("course_id", courseId)
          .eq("category", "repository")
          .order("uploaded_at", { ascending: false }),
        supabase
          .from("courses")
          .select("repo_used, quota_total")
          .eq("id", courseId)
          .single(),
      ]);
    if (fErr) throw fErr;
    if (cErr) throw cErr;

    return {
      files: files as FileRow[],
      quota_used: course.repo_used,
      quota_total: course.quota_total,
      quota_remaining: course.quota_total - course.repo_used,
    };
  },

  async add(courseId: string, file: File) {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const { data: row, error: insertErr } = await supabase
      .from("files")
      .insert({
        course_id: courseId,
        uploaded_by: userData.user.id,
        filename: file.name,
        file_size: file.size,
        file_type: file.type || null,
        category: "repository",
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    const path = `${courseId}/${row.id}-${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("course-files")
      .upload(path, file, { contentType: file.type || undefined });

    if (uploadErr) {
      await supabase.from("files").delete().eq("id", row.id);
      throw uploadErr;
    }

    await supabase
      .from("files")
      .update({ storage_path: path })
      .eq("id", row.id);

    return { file_id: row.id, message: "file uploaded" };
  },

  async remove(fileId: string) {
    const { data: row, error: fetchErr } = await supabase
      .from("files")
      .select("storage_path")
      .eq("id", fileId)
      .single();
    if (fetchErr) throw fetchErr;

    if (row.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from("course-files")
        .remove([row.storage_path]);
      if (storageErr) throw storageErr;
    }

    const { error } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId)
      .eq("category", "repository");
    if (error) throw error;
    return { message: "file deleted" };
  },

  async getFileUrl(storagePath: string, download = false) {
    const { data, error } = await supabase.storage
      .from("course-files")
      .createSignedUrl(
        storagePath,
        60 * 5,
        download ? { download: true } : undefined,
      );
    if (error) throw error;
    return data.signedUrl;
  },

  subscribe(courseId: string, onChange: () => void) {
    const channel = supabase
      .channel(`course_repository_${courseId}`)
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "courses",
          filter: `id=eq.${courseId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
