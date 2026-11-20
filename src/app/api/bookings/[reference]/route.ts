import { NextRequest } from "next/server";
import { db } from "@/lib/supabase/admin";
import { publicBookingView, type BookingRow } from "@/lib/bookings";
import { json } from "@/lib/request";
import { safeEqual } from "@/lib/tokens";

export const dynamic = "force-dynamic";

/** GET /api/bookings/CL-XXXX?t=token — customer view of their own booking (polling + quote links). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
  const { reference } = await ctx.params;
  const token = req.nextUrl.searchParams.get("t");
  const client = db();
  if (!client) return json({ error: "Not available" }, 503);
  const { data } = await client.from("bookings").select("*").eq("reference", reference).maybeSingle<BookingRow>();
  if (!data || !safeEqual(data.access_token, token)) return json({ error: "Booking not found" }, 404);
  return json({
    booking: publicBookingView(data),
    // prefill for quote → booking links
    prefill:
      data.package === "fpv" && ["quote_sent", "pending_payment"].includes(data.status) && data.deposit_status !== "paid"
        ? {
            contact: { name: data.customer_name, email: data.email, phone: data.phone, businessName: data.business_name ?? "" },
            address: { line1: data.address_line1 ?? "", line2: data.address_line2 ?? "", city: data.city ?? "", state: data.state ?? "NY", zip: data.zip ?? "" },
            project: {
              propertyType: data.property_type ?? "",
              description: data.project_description ?? "",
              filmingRequirements: data.filming_requirements ?? "",
              specialInstructions: data.special_instructions ?? "",
              accessNotes: data.access_notes ?? "",
            },
          }
        : undefined,
  });
}
