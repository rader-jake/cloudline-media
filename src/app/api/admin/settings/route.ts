import { revalidatePath } from "next/cache";
import { z } from "zod";
import { guard } from "@/lib/admin-guard";
import { requireDb } from "@/lib/supabase/admin";
import { handleError, json } from "@/lib/request";
import { loadSettings } from "@/lib/settings-server";
import { configured } from "@/lib/env";

export const dynamic = "force-dynamic";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const service = z.object({
  name: z.string().min(2).max(80),
  priceCents: z.number().int().min(0).max(10_000_000).nullable(),
  durationMinutes: z.number().int().min(15).max(720),
  selfBookable: z.boolean(),
  active: z.boolean(),
  standardPriceCents: z.number().int().min(0).max(10_000_000).nullable().optional(),
  startingAt: z.boolean().optional(),
  turnaround: z.string().max(60).optional(),
  requiresLocationReview: z.boolean().optional(),
});
const quoteOnly = service.extend({ selfBookable: z.literal(false) });

const settingsSchema = z.object({
  onlineBookingEnabled: z.boolean(),
  timezone: z.literal("America/New_York"),
  depositCents: z.number().int().min(100).max(100_000),
  services: z.object({
    timelapse: service,
    realestate: service,
    fpv: quoteOnly,
    flythrough: service,
    experience: service,
    production: quoteOnly,
    wedding_fpv: quoteOnly,
  }),
  workingHours: z.record(z.enum(["0", "1", "2", "3", "4", "5", "6"]), z.object({ enabled: z.boolean(), start: hhmm, end: hhmm })),
  slotIntervalMinutes: z.number().int().min(15).max(240),
  minNoticeHours: z.number().int().min(0).max(24 * 30),
  maxAdvanceDays: z.number().int().min(1).max(365),
  prepBufferMinutes: z.number().int().min(0).max(240),
  travelBufferMinutes: z.number().int().min(0).max(480),
  holdMinutes: z.number().int().min(5).max(120),
  serviceArea: z.object({
    label: z.string().max(120),
    areas: z.array(z.string().max(60)).max(50),
    zipPrefixes: z.array(z.string().regex(/^\d{3}$/)).max(200),
    outsideAreaBehavior: z.enum(["warn", "block"]),
  }),
  policy: z.object({ text: z.string().min(20).max(4000), approved: z.boolean() }),
  contact: z.object({ email: z.string().email().or(z.literal("")), phone: z.string().max(30) }),
  launch: z.object({ enabled: z.boolean(), endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), label: z.string().min(2).max(40) }),
  display: z.object({ showTimelapse: z.boolean() }),
});

export async function GET() {
  const { deny } = await guard();
  if (deny) return deny;
  const { settings, hoursConfigured } = await loadSettings();
  return json({
    settings,
    hoursConfigured,
    integrations: {
      database: configured.database(),
      square: configured.square(),
      email: configured.email(),
      googleCalendar: configured.googleCalendar(),
      metaCapi: configured.metaCapi(),
    },
  });
}

export async function PUT(req: Request) {
  const { deny } = await guard();
  if (deny) return deny;
  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid settings: " + parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ") }, 400);
  for (const [day, wh] of Object.entries(parsed.data.workingHours)) {
    if (wh.enabled && wh.end <= wh.start) return json({ error: `Working hours for day ${day}: end must be after start.` }, 400);
  }
  try {
    const { error } = await requireDb().from("settings").upsert({ id: 1, data: parsed.data });
    if (error) throw new Error(error.message);
    revalidatePath("/");
    return json({ ok: true });
  } catch (e) {
    return handleError(e, "admin.settings.put");
  }
}
