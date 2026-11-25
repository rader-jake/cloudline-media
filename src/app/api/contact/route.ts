import { configured } from "@/lib/env";
import { db } from "@/lib/supabase/admin";
import { clientIp, handleError, hashIp, json, rateLimit, verifyTurnstile } from "@/lib/request";
import { contactFormSchema, fieldErrors } from "@/lib/validation";
import { contactNotificationEmail, sendEmail } from "@/lib/email";
import { inquiry } from "@/content/site";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  if (!rateLimit(`contact:${ip}`, 4, 10 * 60_000)) return json({ error: "Too many messages. Please try again later." }, 429);

  const parsed = contactFormSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    // Honeypot filled → pretend success so bots don't learn
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return json({ ok: true });
    return json({ error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) }, 422);
  }
  const m = parsed.data;
  // Human-readable summary of what they picked: "The Experience · Wedding venue · Wedding videographer"
  const label = (list: { value: string; label: string }[], v?: string) => list.find((o) => o.value === v)?.label;
  const service = [label(inquiry.packages, m.package), label(inquiry.filming, m.industry), m.isVideographer ? "Wedding videographer" : null, m.service].filter(Boolean).join(" · ") || null;
  // Submitted implausibly fast → likely a bot
  if (m.startedAt && Date.now() - m.startedAt < 2500) return json({ ok: true });
  if (!(await verifyTurnstile(m.turnstileToken, ip))) return json({ error: "Spam check failed. Please try again." }, 400);

  if (!configured.database() && !configured.email()) {
    return json({ error: "Our contact form is being set up. Please email or call us directly.", code: "setup_required" }, 503);
  }

  try {
    const client = db();
    if (client) {
      const since = new Date(Date.now() - 60 * 60_000).toISOString();
      const { count } = await client.from("contact_messages").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
      if ((count ?? 0) >= 5) return json({ error: "Too many messages. Please try again later." }, 429);
      const { error } = await client.from("contact_messages").insert({
        name: m.name,
        email: m.email,
        phone: m.phone || null,
        service: service?.slice(0, 200) ?? null,
        message: m.message,
        ip_hash: ipHash,
      });
      if (error) throw new Error(error.message);
    }
    const sent = await sendEmail(contactNotificationEmail({ ...m, service }));
    if (!client && !sent.sent) return json({ error: "We couldn't send your message. Please email us directly." }, 502);
    return json({ ok: true });
  } catch (e) {
    return handleError(e, "contact");
  }
}
