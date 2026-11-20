import "server-only";
import { db } from "@/lib/supabase/admin";
import { mergeSettings, type Settings } from "@/lib/settings";

/**
 * Loads settings from the database.
 * `source: "database"` means the admin-configured row exists; "defaults" means it doesn't,
 * in which case booking availability must show a setup-required state.
 */
export async function loadSettings(): Promise<{
  settings: Settings;
  source: "database" | "defaults";
  /** True once an admin has reviewed hours and switched online booking on in /admin/availability. */
  hoursConfigured: boolean;
}> {
  const client = db();
  if (!client) return { settings: mergeSettings(null), source: "defaults", hoursConfigured: false };
  const { data, error } = await client.from("settings").select("data").eq("id", 1).maybeSingle();
  if (error || !data) {
    if (error) console.error("[settings] load failed", error.message);
    return { settings: mergeSettings(null), source: "defaults", hoursConfigured: false };
  }
  const saved = data.data as Partial<Settings>;
  return { settings: mergeSettings(saved), source: "database", hoursConfigured: saved?.onlineBookingEnabled === true };
}
