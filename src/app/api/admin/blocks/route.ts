import { NextRequest } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/admin-guard";
import { requireDb } from "@/lib/supabase/admin";
import { handleError, json } from "@/lib/request";
import { addMinutes, zonedToUtc } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const { deny } = await guard();
  if (deny) return deny;
  try {
    const { data, error } = await requireDb()
      .from("availability_blocks")
      .select("*")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at");
    if (error) throw new Error(error.message);
    return json({ blocks: data });
  } catch (e) {
    return handleError(e, "admin.blocks.get");
  }
}

const createSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allDay: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const { deny } = await guard();
  if (deny) return deny;
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid block" }, 400);
  const b = parsed.data;
  const startsAt = zonedToUtc(b.startDate, b.allDay ? "00:00" : b.startTime ?? "00:00");
  const endsAt = b.allDay ? addMinutes(zonedToUtc(b.endDate, "23:59"), 1) : zonedToUtc(b.endDate, b.endTime ?? "23:59");
  if (endsAt <= startsAt) return json({ error: "End must be after start" }, 400);
  try {
    const { data, error } = await requireDb()
      .from("availability_blocks")
      .insert({ starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), all_day: b.allDay, reason: b.reason ?? null })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return json({ block: data });
  } catch (e) {
    return handleError(e, "admin.blocks.post");
  }
}

export async function DELETE(req: NextRequest) {
  const { deny } = await guard();
  if (deny) return deny;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  try {
    const { error } = await requireDb().from("availability_blocks").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return json({ ok: true });
  } catch (e) {
    return handleError(e, "admin.blocks.delete");
  }
}
