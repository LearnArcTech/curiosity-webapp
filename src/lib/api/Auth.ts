/**
 * $lib/api/auth.ts
 */

import { supabase, currentSessionId } from "../supabaseClient";
import { assert, getDeviceName, generateGuestUsername } from "./utils";
import { onboarding } from "./Onboarding";
import { courses } from "./Courses";

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

    await supabase.rpc("mark_password_set");

    return { message: "password changed" };
  },

  async loginAsGuest() {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;

    await supabase.rpc("register_device", {
      p_device_name: getDeviceName(),
    });

    const username = generateGuestUsername();
    await onboarding.setRole("student");
    await onboarding.setUsername(username);

    return {
      access_token: data.session?.access_token ?? null,
      token_type: "bearer",
      onboarding_required: false,
      role: "student",
      username,
    };
  },

  async loginWithCourseCode(courseCode: string) {
    const exists = await courses.exists(courseCode);
    if (!exists) {
      throw new Error("Código de curso inválido");
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;

    await supabase.rpc("register_device", {
      p_device_name: getDeviceName(),
    });

    const username = generateGuestUsername();
    await onboarding.setRole("student");
    await onboarding.setUsername(username);

    let course;
    try {
      await courses.enroll(courseCode);
      course = await courses.get(courseCode);
    } catch (err) {
      await supabase.auth.signOut();
      throw err;
    }

    return {
      access_token: data.session?.access_token ?? null,
      token_type: "bearer",
      onboarding_required: false,
      role: "student",
      username,
      course,
    };
  },

  async setEmail(email: string) {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    assert(userData.user, "not authenticated");
    assert(!userData.user.email, "ya tienes un e-mail configurado");

    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
    return { message: "Tu correo ha sido correctamente configurado" };
  },

  async setInitialPassword(newPassword: string) {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    assert(userData.user, "not authenticated");

    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("has_password")
      .eq("id", userData.user.id)
      .single();
    if (profileErr) throw profileErr;
    assert(
      !profileData.has_password,
      "ya tienes una contraseña configurada; usa cambiar contraseña en su lugar",
    );

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    const { error: markErr } = await supabase.rpc("mark_password_set");
    if (markErr) throw markErr;

    return { message: "contraseña configurada" };
  },
};
