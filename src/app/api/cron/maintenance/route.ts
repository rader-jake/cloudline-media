import { env, configured } from "@/lib/env";
import { requireDb } from "@/lib/supabase/admin";
import { releaseExpiredHolds, type BookingRow } from "@/lib/bookings";
import { reminderEmail, sendEmail } from "@/lib/email";
import { json } from "@/lib/request";

export const dynamic = "force-dynamic";

/**
 * Hourly (see vercel.json): releases abandoned holds and sends 24-hour reminders.
 * Protected by CRON_SECRET (Vercel sends "Authorization: Bearer <CRON_SECRET>").
 */
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) return json({ error: "unauthorized" }, 401);
  if (!configured.database()) return json({ skipped: "database not configured" });

  const released = await releaseExpiredHolds();
  const sb = requireDb();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600_000);
  const { data: due } = await sb
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gt("scheduled_start", now.toISOString())
    .lte("scheduled_start", in24h.toISOString())
    .returns<BookingRow[]>();

  let reminded = 0;
  for (const b of due ?? []) {
    const r = await sendEmail(reminderEmail(b));
    if (r.sent) {
      await sb.from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", b.id);
      reminded++;
    }
  }
  return json({ released, reminded });
}
