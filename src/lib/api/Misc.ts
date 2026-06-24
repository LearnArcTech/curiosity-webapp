/**
 * $lib/api/misc.ts
 */

import { supabase } from "../supabaseClient";

export const misc = {
  async health() {
    const { error } = await supabase.from("courses").select("id").limit(1);
    return {
      status: error ? "error" : "ok",
      database: error ? "unreachable" : "reachable",
    };
  },
};
