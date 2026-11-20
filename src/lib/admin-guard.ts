import "server-only";
import { getAdmin } from "@/lib/supabase/server";
import { json } from "@/lib/request";

/** Use at the top of every /api/admin route. Returns a 401 response when not an admin. */
export async function guard() {
  const admin = await getAdmin();
  if (!admin) return { admin: null, deny: json({ error: "Unauthorized" }, 401) };
  return { admin, deny: null };
}
