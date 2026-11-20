import { env, configured } from "@/lib/env";
import { requireDb } from "@/lib/supabase/admin";
import { releaseExpiredHolds, type BookingRow } from "@/lib/bookings";
import { reminderEmail, sendEmail } from "@/lib/email";
import { json } from "@/lib/request";
import { localDate, zonedToUtc } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Daily at 13:00 UTC = 8 AM EST / 9 AM EDT (see vercel.json; Vercel Hobby allows one run per day).
 * Sends a "your shoot is tomorrow" reminder for every confirmed booking up to the end of
 * tomorrow (ET), and tidies abandoned holds. Holds don't depend on this job: availability
 * ignores expired holds, payments reject them, and new holds clear them.
 * Protected by CRON_SECRET (Vercel sends "Authorization: Bearer <CRON_SECRET>").
 */
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) return json({ error: "unauthorized" }, 401);
  if (!configured.database()) return json({ skipped: "database not configured" });

  const released = await releaseExpiredHolds();
  const sb = requireDb();
  const now = new Date();
  // End of tomorrow in New York = start of the day after tomorrow.
  const dayAfterTomorrow = localDate(new Date(now.getTime() + 48 * 3600_000));
  const until = zonedToUtc(dayAfterTomorrow, "00:00");
  const { data: due } = await sb
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gt("scheduled_start", now.toISOString())
    .lt("scheduled_start", until.toISOString())
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
