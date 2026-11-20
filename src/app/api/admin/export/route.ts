import { guard } from "@/lib/admin-guard";
import { requireDb } from "@/lib/supabase/admin";
import { handleError } from "@/lib/request";
import type { BookingRow } from "@/lib/bookings";
import { fmt } from "@/lib/time";

export const dynamic = "force-dynamic";

const COLUMNS: [string, (b: BookingRow) => unknown][] = [
  ["Booking ID", (b) => b.id],
  ["Reference", (b) => b.reference],
  ["Status", (b) => b.status],
  ["Package", (b) => b.package_name],
  ["Customer name", (b) => b.customer_name],
  ["Email", (b) => b.email],
  ["Phone", (b) => b.phone],
  ["Business", (b) => b.business_name],
  ["Scheduled date (ET)", (b) => (b.scheduled_start ? fmt(b.scheduled_start, "yyyy-MM-dd") : "")],
  ["Scheduled time (ET)", (b) => (b.scheduled_start ? fmt(b.scheduled_start, "h:mm a") : "")],
  ["Shoot address", (b) => b.address_formatted],
  ["Outside service area", (b) => (b.outside_service_area ? "yes" : "no")],
  ["Quoted total ($)", (b) => (b.quoted_total_cents != null ? (b.quoted_total_cents / 100).toFixed(2) : "")],
  ["Deposit ($)", (b) => (b.deposit_cents / 100).toFixed(2)],
  ["Deposit status", (b) => b.deposit_status],
  ["Square payment ID", (b) => b.square_payment_id],
  ["Property type", (b) => b.property_type],
  ["Project notes", (b) => b.project_description],
  ["Filming requirements", (b) => b.filming_requirements],
  ["Special instructions", (b) => b.special_instructions],
  ["Access notes", (b) => b.access_notes],
  ["UTM source", (b) => b.utm?.utm_source],
  ["UTM campaign", (b) => b.utm?.utm_campaign],
  ["Admin notes", (b) => b.admin_notes],
  ["Created", (b) => b.created_at],
];

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // neutralise spreadsheet formula injection
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  const { deny } = await guard();
  if (deny) return deny;
  try {
    const { data, error } = await requireDb()
      .from("bookings")
      .select("*")
      .neq("status", "expired")
      .order("created_at", { ascending: false })
      .returns<BookingRow[]>();
    if (error) throw new Error(error.message);
    const csv = [COLUMNS.map(([h]) => cell(h)).join(","), ...(data ?? []).map((b) => COLUMNS.map(([, f]) => cell(f(b))).join(","))].join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cloudline-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return handleError(e, "admin.export");
  }
}
