import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, configured } from "@/lib/env";

/** Cookie-bound Supabase client for reading the signed-in admin's session. */
export async function authClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component — middleware refreshes the session instead
        }
      },
    },
  });
}

/** Returns the admin's email if the request is from a signed-in, allow-listed admin. */
export async function getAdmin(): Promise<{ email: string } | null> {
  if (!configured.adminAuth()) return null;
  const sb = await authClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email || !env.adminEmails.includes(email)) return null;
  return { email };
}
