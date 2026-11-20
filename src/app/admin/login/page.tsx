import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";
import { configured } from "@/lib/env";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLogin() {
  const ready = configured.adminAuth();
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,_#10273a_0%,_#06111B_60%)] p-5">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-8 w-44">
          <Logo />
        </div>
        <div className="card p-6">
          <h1 className="text-xl font-bold">Admin sign in</h1>
          {ready ? (
            <LoginForm />
          ) : (
            <p className="mt-3 text-sm text-warn">
              Admin login isn&apos;t configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
              <code>ADMIN_EMAILS</code> — see the README.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
