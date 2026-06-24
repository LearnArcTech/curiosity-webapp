/**
 * $lib/api/profile.ts
 */

import { supabase } from "../supabaseClient";
import { assert } from "./utils";
import type { Profile } from "./types";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

export const profile = {
  async me(): Promise<Profile> {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, role, avatar_path, created_at")
      .eq("id", userData.user.id)
      .single();
    if (error) throw error;
    return data;
  },

  async update(username: string) {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", userData.user.id);
    if (error) throw error;
    return { message: "profile updated" };
  },

  async uploadAvatar(file: File) {
    if (file.size > MAX_AVATAR_BYTES) {
      throw new Error("Avatar must be 3MB or smaller");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Avatar must be an image");
    }

    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const path = `${userData.user.id}/avatar.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadErr) throw uploadErr;

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_path: path })
      .eq("id", userData.user.id);
    if (updateErr) throw updateErr;

    return { avatar_path: path, message: "avatar updated" };
  },

  async removeAvatar() {
    const { data: userData } = await supabase.auth.getUser();
    assert(userData.user, "not authenticated");

    const { data: row, error: fetchErr } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", userData.user.id)
      .single();
    if (fetchErr) throw fetchErr;

    if (row.avatar_path) {
      await supabase.storage.from(AVATAR_BUCKET).remove([row.avatar_path]);
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_path: null })
      .eq("id", userData.user.id);
    if (error) throw error;

    return { message: "avatar removed" };
  },

  getAvatarUrlByUserId(userId: string): string {
    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(`${userId}/avatar.jpg`);
    return data.publicUrl;
  },

  getAvatarUrl(avatarPath: string | null): string | null {
    if (!avatarPath) return null;
    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(avatarPath);
    return data.publicUrl;
  },

  subscribe(userId: string, onChange: () => void) {
    const channel = supabase
      .channel(`my_profile_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
