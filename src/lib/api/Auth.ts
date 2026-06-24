/**
 * $lib/api/auth.ts
 */

import { supabase, currentSessionId } from "../supabaseClient";
import { assert, getDeviceName } from "./utils";

export const auth = {
  async register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.session) {
      await supabase.rpc("register_device", {
        p_device_name: getDeviceName(),
      });
    }

    return {
      access_token: data.session?.access_token ?? null,
      token_type: "bearer",
      onboarding_required: true,
    };
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    await supabase.rpc("register_device", {
      p_device_name: getDeviceName(),
    });

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("role, username")
      .eq("id", data.user.id)
      .single();
    if (pErr) throw pErr;

    return {
      access_token: data.session.access_token,
      token_type: "bearer",
      onboarding_required: !profile.role || !profile.username,
      role: profile.role,
      username: profile.username,
    };
  },

  async logout() {
    const { data } = await supabase.auth.getSession();
    const sid = currentSessionId(data.session?.access_token);
    if (sid) {
      await supabase.from("devices").delete().eq("session_id", sid);
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { message: "logged out" };
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const email = userData.user?.email;
    assert(email, "no active session");

    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthErr) throw new Error("current password is incorrect");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { message: "password changed" };
  },
};
