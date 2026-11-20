import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, configured } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Service-role client. Server only — bypasses RLS. Returns null when Supabase isn't configured. */
export function db(): SupabaseClient | null {
  if (!configured.database()) return null;
  if (!client) {
    client = createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function requireDb(): SupabaseClient {
  const c = db();
  if (!c) throw new SetupError("Database is not configured. Add the Supabase environment variables.");
  return c;
}

export class SetupError extends Error {
  code = "setup_required" as const;
}
