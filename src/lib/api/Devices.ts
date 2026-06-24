/**
 * $lib/api/devices.ts
 */

import { supabase, currentSessionId } from "../supabaseClient";
import type { DeviceRow } from "./types";

export const devices = {
  async list(): Promise<DeviceRow[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const mySessionId = currentSessionId(sessionData.session?.access_token);

    const { data, error } = await supabase
      .from("devices")
      .select("id, device_name, created_at, last_seen, session_id")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return data.map((d) => ({
      id: d.id,
      device_name: d.device_name,
      created_at: d.created_at,
      last_seen: d.last_seen,
      is_current: d.session_id === mySessionId,
    }));
  },

  async revoke(deviceId: string) {
    const { data, error } = await supabase.rpc("revoke_device", {
      p_device_id: deviceId,
    });
    if (error) throw error;
    return data as { message: string };
  },
};
