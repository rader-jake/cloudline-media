"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { CalendarDays, ClipboardList, LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/admin", label: "Bookings", Icon: ClipboardList },
  { href: "/admin/availability", label: "Availability", Icon: CalendarDays },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  async function signOut() {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await sb.auth.signOut();
    router.replace("/admin/login");
  }
  return (
    <div className="min-h-dvh bg-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <div className="w-28 shrink-0">
            <Logo href="/admin" />
          </div>
          <nav className="flex flex-1 gap-1 overflow-x-auto" aria-label="Admin">
            {NAV.map(({ href, label, Icon }) => {
              const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${active ? "bg-accent/15 text-accent" : "text-white/70 hover:text-white"}`}
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </Link>
              );
            })}
          </nav>
          <span className="hidden text-xs text-mist md:block">{email}</span>
          <button onClick={signOut} className="grid size-9 place-items-center rounded-lg border border-line text-mist hover:text-white" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
