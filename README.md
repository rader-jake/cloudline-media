# Cloudline Media — Website & Booking System

A mobile-first marketing site and booking flow for Cloudline Media's drone videography business. Built for paid traffic from Facebook and Instagram ads:

**Ad → Landing page → Choose package → Pick date & time → Enter shoot address → Pay $20 deposit (Square) → Booking confirmed**

| Layer                 | Tech                                                |
| --------------------- | --------------------------------------------------- |
| Framework             | Next.js 15 (App Router), TypeScript, Tailwind CSS 4 |
| Database & admin auth | Supabase (Postgres + Auth)                          |
| Payments              | Square Web Payments SDK + Payments API + webhooks   |
| Email                 | Resend                                              |
| Address autocomplete  | Google Places API (New), optional                   |
| Calendar sync         | Google Calendar (service account), optional         |
| Ads tracking          | Meta Pixel + Conversions API, consent-gated         |
| Hosting               | Vercel (Hobby works; the cron runs once a day)       |

---

## 1. Quick start (local)

```bash
npm install
cp .env.example .env.local     # then fill in values (see below)
npm run dev                    # http://localhost:3000
```

With no environment variables set, the site still runs. Booking shows an honest **"Online scheduling is being set up"** state instead of fake time slots, and payment is disabled.

Useful scripts:

| Command                     | What it does                                                                |
| --------------------------- | --------------------------------------------------------------------------- |
| `npm run build`             | Production build (also type-checks)                                         |
| `npm run typecheck`         | TypeScript only                                                             |
| `npm run test:availability` | Tests the slot engine: EST/EDT, buffers, holds, blocks, notice              |
| `npm run images`            | Regenerates logo variants, favicon and placeholder media from `/assets-src` |

> Requires Node 20+. Tailwind is pinned to 4.1.x because newer 4.x builds need Node ≥ 22.12.

---

## 2. Set up the integrations

### 2.1 Supabase: database and admin login (required) pushing to vercel

1. Create a project at supabase.com.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It's safe to re-run.
3. In **Project Settings → API**, copy these values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (**server only**, never expose it)
4. In **Authentication → Users**, click **Add user** and create a login for each admin with email and password.
5. Put those emails in `ADMIN_EMAILS` as a comma-separated list. Only these accounts can open `/admin`.
6. In **Authentication → Providers → Email**, turn **off** "Allow new users to sign up" so no one else can create an account.

**Security model:** Row Level Security is enabled on every table and no policies are defined. The public anon key can't read or write anything. All data access goes through server routes that use the service-role key. Admin routes also check the signed-in user against `ADMIN_EMAILS`.

### 2.2 Turn on online booking

1. Sign in at `/admin/login`.
2. Open **Availability** and review your working hours, buffers, minimum notice and hold time.
3. Switch on **Accept online bookings** and save. Until you do, customers see the setup-required message.
4. Open **Settings** and review prices, shoot durations, service area, contact details and the **deposit and cancellation policy**.

> ⚠️ **The deposit policy ships as DRAFT wording.** Customers must tick a box agreeing to it before they pay. Edit it to match your real terms, then tick "approved". The draft does **not** declare the deposit non-refundable.

### 2.3 Square: $20 deposits (required for booking)

1. Create an app at developer.squareup.com.
2. Start in **Sandbox**. In the sandbox tab, copy:
   - the Application ID → `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
   - the Access token → `SQUARE_ACCESS_TOKEN`
   - the Location ID (under **Locations**) → `NEXT_PUBLIC_SQUARE_LOCATION_ID`
   - `SQUARE_ENVIRONMENT=sandbox`
3. Set up the **webhook**. Go to Webhooks → Subscriptions → Add:
   - URL: `https://YOUR-DOMAIN/api/webhooks/square`
   - Events: `payment.created` and `payment.updated`
   - Copy the **Signature key** → `SQUARE_WEBHOOK_SIGNATURE_KEY`
   - Set `SQUARE_WEBHOOK_URL` to the **exact** URL you registered. The signature check depends on it.
4. Test with Square's sandbox card `4111 1111 1111 1111`, any future expiry, any CVV and any ZIP. Square's docs list cards that simulate declines.
5. **Going live:** swap in the production credentials and set `SQUARE_ENVIRONMENT=production`. Create a production webhook subscription too, which has its own signature key.

How payment confirmation works:

- Card details are typed into Square-hosted iframes. Raw card data never touches this site's code or servers.
- The server charges the single-use token with an **idempotency key** and an atomic `processing` lock, so a double-click or retry can't double-charge.
- A booking becomes **Confirmed only when Square returns `COMPLETED`**, either in the payment response or from the webhook. The webhook re-fetches the payment from Square's API before acting. Reaching the success page proves nothing by itself; that page reads the server-verified status.
- The server checks that the amount charged equals the booking's deposit.
- Unpaid holds expire after `holdMinutes` (default 15) and the slot is released.
- Refunds are issued from the Square Dashboard.

### 2.4 Resend: emails (strongly recommended)

1. Verify your sending domain in Resend.
2. Set these variables:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` (for example `Cloudline Media <bookings@yourdomain.com>`)
   - `TEAM_NOTIFICATION_EMAILS` (comma-separated)
   - optionally `EMAIL_REPLY_TO`

Emails the system sends:

- **Booking confirmation** to the customer: package, date, address, deposit, balance and an add-to-calendar link.
- **Team notification** for each new booking and each FPV quote request.
- **Day-before reminder**, sent each morning by the cron.
- **Rescheduled**, **needs rescheduling** and **cancelled** notices, sent from admin actions.
- **FPV quote ready**, which includes a private booking link.
- **Contact form** messages, sent to the team.

If Resend isn't configured, emails are **not** sent and nothing pretends otherwise. The admin dashboard tells you when an email didn't go out.

### 2.5 Cron: reminders and releasing abandoned holds

`vercel.json` runs `/api/cron/maintenance` once a day at 13:00 UTC (8–9 AM ET), which fits the free Hobby plan. Set `CRON_SECRET` to a long random string; Vercel sends it automatically. On other hosts, call the route daily with the header `Authorization: Bearer <CRON_SECRET>`.

### 2.6 Google Places address autocomplete (optional)

1. In Google Cloud, enable **Maps JavaScript API** and **Places API (New)**.
2. Create a browser key restricted to your domains.
3. Set it as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

Without the key, customers type the address manually. It's still validated for street number, city, state and ZIP.

### 2.7 Google Calendar sync (optional)

When configured:

- Busy times on your Google Calendar block slots on the website.
- Confirmed shoots are added to the calendar automatically.

To set it up:

1. Create a service account in Google Cloud and enable the **Google Calendar API**.
2. Create a JSON key for the service account.
3. In Google Calendar → _Settings and sharing_, share your calendar with the service account email and give it "Make changes to events".
4. Set these variables:
   - `GOOGLE_CALENDAR_ID` (your calendar's ID)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (paste the key with `\n` line breaks)

If Google can't be reached, booking **fails closed**: the site shows "temporarily unavailable" rather than offering slots that might conflict.

### 2.8 Meta Pixel and Conversions API (for FB/IG ads)

Set `NEXT_PUBLIC_META_PIXEL_ID`. Optionally set `META_CAPI_ACCESS_TOKEN` for server-side events. `META_CAPI_TEST_EVENT_CODE` is for testing in Events Manager; remove it when you're done.

| Event              | When it fires                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `PageView`         | Page load, after the visitor gives consent                                                                                |
| `ViewContent`      | A package card is at least 50% visible                                                                                    |
| `InitiateCheckout` | The booking flow starts with a package                                                                                    |
| `AddPaymentInfo`   | The Square payment step opens                                                                                             |
| `Purchase`         | **Only after the server verifies the deposit.** Value is **$20 USD**, the money actually collected, not the service price |
| `Lead` / `Contact` | An FPV quote request or a contact form is submitted                                                                       |

How tracking handles consent, attribution and deduplication:

- **Consent:** the Pixel loads only after the visitor clicks **Accept** on the cookie banner. They can change their choice anytime via "Cookie Settings" in the footer. Conversions API events are sent only for bookings where consent was given.
- **Deduplication:** the browser and server send the same `Purchase` event ID (`purchase_<bookingId>`), so Meta counts it once.
- **Attribution:** first-touch UTM parameters, `fbclid`, `_fbp` and `_fbc` are captured and stored on each booking. They appear in the admin dashboard and the CSV export.

Tip: tag your ad URLs, for example `https://yourdomain.com/?utm_source=facebook&utm_medium=paid&utm_campaign=roofing_timelapse`. For one-click booking, point ads straight at `/book?package=timelapse` or `/book?package=realestate`.

### 2.9 Spam protection (contact form)

The contact form always uses three layers:

- a honeypot field
- a minimum time-to-submit check
- per-IP rate limits (in memory, plus a database check of 5 messages per hour)

For stronger protection, add Cloudflare Turnstile with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

---

## 3. Deploy to Vercel

1. Push this folder to GitHub, then import it in Vercel.
2. Add every variable from `.env.example` in **Settings → Environment Variables**.
3. Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`.
4. Deploy, then update the Square webhook URL and `SQUARE_WEBHOOK_URL` to the production domain.

### Go-live checklist

- [ ] Schema run; admin users created; sign-ups disabled
- [ ] Working hours reviewed and **Accept online bookings** turned on
- [ ] Prices, durations and service area reviewed
- [ ] Deposit and cancellation policy rewritten and **approved**
- [ ] Contact email and phone set in Settings
- [ ] A full booking tested in Square **sandbox** (confirmation page, emails, admin record, webhook)
- [ ] Switched to Square **production** credentials and webhook
- [ ] Resend domain verified; test email received
- [ ] `CRON_SECRET` set; cron visible in Vercel → Cron Jobs
- [ ] Meta Pixel checked with Events Manager → Test events
- [ ] Privacy policy (`/privacy`) reviewed for your business
- [ ] Illustrative media replaced with real footage when available (see below)

---

## 4. Editing content and media

| What                                                                      | Where                                                            |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Prices (launch + standard), durations, turnaround, deposit, launch pricing on/off, show time-lapse, hours, service area, policy, contact | `/admin/settings` and `/admin/availability` (defaults in [`src/lib/settings.ts`](src/lib/settings.ts)) |
| Hero, FPV difference, industries, packages copy, inquiry options, How It Works, FAQ | [`src/content/site.ts`](src/content/site.ts) |
| Ad landing pages (`/time-lapse`, `/real-estate`)                          | `landing` in `src/content/site.ts`                               |
| "Imagine the possibilities" showcase (titles, future videos)              | `showcase.items` in `src/content/site.ts`                        |

**Pricing.** Every price the site shows and the booking server charges comes from admin → Settings. FPV packages have a *launch price* and a *standard price after launch*. With **Launch pricing on**, the launch price is charged and the standard rate is shown beneath it; switch it **off** and the standard price is charged and shown. Set an end date only if you want one displayed.

### Replacing media

All current imagery is labelled on the site: the hero loop and the FPV/industry frames are **AI-generated ("Concept visualization")**; the older aerial images are **"Illustrative imagery"**. Never remove a label unless the media is Cloudline's own footage.

- **Hero loop:** `public/media/hero/` holds `hero-fpv.mp4` (H.264, ≤3 MB), `hero-fpv.webm`, `hero-fpv-mobile.mp4` (9:16 portrait) and the two first-frame posters. Re-encode a new clip with `FFMPEG=/path/to/ffmpeg bash scripts/encode-hero.sh input.mp4 [start] [seconds]`. The caption is `hero.mediaNote` in `src/content/site.ts`. Set it to `""` only for your own footage. The original source is kept out of the deploy in `assets-src/` (git-ignored).
- **Industry tiles:** set `image` on each item in `industries.items` (1600×1000 or larger, WebP, subject centred). Tiles without an image show a designed backdrop.
- **Package visuals:** `image` on each item in `fpvPackages.items` (1600×900+, WebP).
- **Showcase videos:** add `poster` + `videoUrl` to an item in `showcase.items`. Keep `isIllustrative: true` unless it's verified Cloudline work.
- **Aerial service visuals:** `public/media/roof-clean.webp` (time-lapse) and `public/media/estate-frame.webp` (real estate).

---

## 5. How it works (architecture)

```
src/
  app/
    page.tsx                  Landing page (server; prices from DB)
    book/page.tsx             Booking wizard
    book/confirmed/page.tsx   Server-verified confirmation
    admin/                    Protected dashboard (bookings, availability, settings)
    api/
      availability            Real slot computation (never fabricated)
      bookings/hold           Validates + creates a temporary pending_payment hold
      bookings/quote          FPV quote request (no payment)
      bookings/[ref]          Customer's own booking (token-protected) + .ics
      payments/deposit        Charges the $20 deposit via Square
      webhooks/square         Signature-verified payment events
      contact                 Contact form (honeypot, timing, rate limits, Turnstile)
      cron/maintenance        Daily: hold cleanup + day-before reminders
      admin/*                 Admin-only APIs (session + allow-list)
  lib/
    availability.ts           Slot engine (hours, buffers, notice, blocks, holds, Google busy)
    bookings.ts               confirmDeposit() — idempotent confirmation + notifications
    square.ts, email.ts, meta-capi.ts, google-calendar.ts, ics.ts
    settings.ts               Settings types + defaults
    validation.ts             Shared zod schemas (client + server)
  content/site.ts             Editable marketing content
supabase/schema.sql           Tables, double-booking constraint, RLS lockdown
```

**Booking statuses:**

```
quote_requested → quote_sent → pending_payment → confirmed → completed
                                     │               ├→ needs_rescheduling → (reschedule) → confirmed
                                     └→ expired      └→ cancelled
```

**Preventing double bookings takes three layers:**

1. Slots are recomputed against live data when a hold is created.
2. A Postgres **exclusion constraint** on the busy window (prep buffer + shoot + travel buffer) rejects any overlapping `pending_payment` or `confirmed` bookings, even under concurrent requests.
3. Holds expire automatically.

**Time zone:** all scheduling uses `America/New_York`, including correct handling of the DST switch.

**FPV quote flow:**

1. The customer requests a quote. No payment is taken.
2. The admin sets a price and duration in the booking drawer and clicks **Send quote**.
3. The customer receives a private link that shows the quoted total, deposit and balance. They pick a slot and pay the deposit.

---

## 6. What's not verified yet

These parts couldn't be run without real credentials. Test them in sandbox before launch:

- Square card form, payment, and webhook round-trip
- Resend delivery
- Google Places and Calendar
- Meta events
- The Supabase schema. It was written for Supabase Postgres but wasn't executed during development.

The UI, API validation and guards, and the availability engine were all exercised locally.

# cloudline-media
