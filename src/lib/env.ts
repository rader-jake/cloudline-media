// Centralised environment access + "is this integration configured?" checks.
// Server-only values must never be imported into client components.

const v = (key: string) => {
  const val = process.env[key];
  return val && val.trim() !== "" ? val.trim() : undefined;
};

export const SITE_URL = (v("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");

export const env = {
  supabaseUrl: v("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: v("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: v("SUPABASE_SERVICE_ROLE_KEY"),
  adminEmails: (v("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  squareEnv: (v("SQUARE_ENVIRONMENT") === "production" ? "production" : "sandbox") as "production" | "sandbox",
  squareAppId: v("NEXT_PUBLIC_SQUARE_APPLICATION_ID"),
  squareLocationId: v("NEXT_PUBLIC_SQUARE_LOCATION_ID"),
  squareAccessToken: v("SQUARE_ACCESS_TOKEN"),
  squareWebhookKey: v("SQUARE_WEBHOOK_SIGNATURE_KEY"),
  squareWebhookUrl: v("SQUARE_WEBHOOK_URL"),

  resendKey: v("RESEND_API_KEY"),
  emailFrom: v("EMAIL_FROM"),
  emailReplyTo: v("EMAIL_REPLY_TO"),
  teamEmails: (v("TEAM_NOTIFICATION_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean),

  googleCalendarId: v("GOOGLE_CALENDAR_ID"),
  googleSaEmail: v("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  googleSaKey: v("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, "\n"),

  metaPixelId: v("NEXT_PUBLIC_META_PIXEL_ID"),
  metaCapiToken: v("META_CAPI_ACCESS_TOKEN"),
  metaTestCode: v("META_CAPI_TEST_EVENT_CODE"),

  turnstileSecret: v("TURNSTILE_SECRET_KEY"),
  cronSecret: v("CRON_SECRET"),
  ipSalt: v("IP_HASH_SALT") ?? "cloudline",
};

export const configured = {
  database: () => Boolean(env.supabaseUrl && env.supabaseServiceKey),
  adminAuth: () => Boolean(env.supabaseUrl && env.supabaseAnonKey && env.adminEmails.length),
  square: () => Boolean(env.squareAppId && env.squareLocationId && env.squareAccessToken),
  email: () => Boolean(env.resendKey && env.emailFrom),
  googleCalendar: () => Boolean(env.googleCalendarId && env.googleSaEmail && env.googleSaKey),
  metaCapi: () => Boolean(env.metaPixelId && env.metaCapiToken),
};
