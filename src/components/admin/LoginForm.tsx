"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <input id="email" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
          Password
        </label>
        <input id="password" type="password" autoComplete="current-password" required className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />} Sign in
      </button>
    </form>
  );
}
