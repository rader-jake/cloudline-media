import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login?denied=1");
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
