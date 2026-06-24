/**
 * $lib/api/reports.ts
 */

import { supabase } from "../supabaseClient";
import { assert } from "./utils";
import type { FileRow } from "./types";

export const reports = {
  async list(courseId: string): Promise<FileRow[]> {
    const { data, error } = await supabase
      .from("files")
      .select(
        "id, filename, file_size, file_type, ocr_processed, uploaded_at, uploaded_by, storage_path",
      )
      .eq("course_id", courseId)
      .eq("category", "report")
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    return data as FileRow[];
  },

  async upload(
    courseId: string,
    file: File | Blob,
    filename: string,
    ocrProcessed: boolean = false,
  ) {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const { data: row, error: insertErr } = await supabase
      .from("files")
      .insert({
        course_id: courseId,
        uploaded_by: userData.user.id,
        filename: filename,
        file_size: file.size,
        file_type: file.type || null,
        category: "report",
        ocr_processed: ocrProcessed,
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    const path = `${courseId}/reports/${row.id}-${filename}`;

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

    return { file_id: row.id, message: "Report file uploaded" };
  },

  async markAsProcessed(fileId: string) {
    const { error } = await supabase
      .from("files")
      .update({ ocr_processed: true })
      .eq("id", fileId);
    if (error) throw error;
    return { message: "Report marked as OCR processed" };
  },

  async remove(fileId: string) {
    const { data: row, error: fetchErr } = await supabase
      .from("files")
      .select("storage_path")
      .eq("id", fileId)
      .single();
    if (fetchErr) throw fetchErr;

    if (row?.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from("course-files")
        .remove([row.storage_path]);
      if (storageErr) throw storageErr;
    }

    const { error } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId)
      .eq("category", "report");
    if (error) throw error;

    return { message: "Report deleted" };
  },

  subscribe(courseId: string, onChange: () => void) {
    const channel = supabase
      .channel(`course_reports_${courseId}`)
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
