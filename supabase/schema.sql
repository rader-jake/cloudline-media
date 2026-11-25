-- ════════════════════════════════════════════════════════════════
-- Cloudline Media — Supabase schema
-- Run in Supabase → SQL Editor (safe to re-run).
--
-- Security model: Row Level Security is ENABLED on every table with NO
-- policies, so the public anon key can read/write nothing. All access goes
-- through Next.js server routes using the service-role key, and admin routes
-- additionally require a signed-in, allow-listed admin (ADMIN_EMAILS).
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin
  create type booking_status as enum (
    'quote_requested', 'quote_sent', 'pending_payment', 'confirmed',
    'needs_rescheduling', 'completed', 'cancelled', 'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid', 'processing', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ── Bookings ────────────────────────────────────────────────────
create table if not exists bookings (
  id                    uuid primary key default gen_random_uuid(),
  reference             text not null unique,            -- e.g. CL-7KQ2MX (shown to customer)
  access_token          text not null,                   -- secret for the customer's booking link
  status                booking_status not null default 'pending_payment',

  package               text not null,
  package_name          text not null,

  customer_name         text not null,
  email                 text not null,
  phone                 text not null,
  business_name         text,

  address_line1         text,
  address_line2         text,
  city                  text,
  state                 text,
  zip                   text,
  address_formatted     text,
  address_place_id      text,
  address_lat           double precision,
  address_lng           double precision,
  address_verified      boolean not null default false,
  outside_service_area  boolean not null default false,

  property_type         text,
  project_description   text,
  filming_requirements  text,
  special_instructions  text,
  access_notes          text,
  fpv_interest          boolean not null default false,
  preferred_dates       text,

  quoted_total_cents    integer check (quoted_total_cents is null or quoted_total_cents >= 0),
  deposit_cents         integer not null default 2000 check (deposit_cents >= 0),
  deposit_status        payment_status not null default 'unpaid',
  square_payment_id     text unique,
  square_receipt_url    text,
  payment_attempts      integer not null default 0,

  scheduled_start       timestamptz,
  scheduled_end         timestamptz,
  duration_minutes      integer,
  -- the full window the crew is committed (prep before + shoot + travel after)
  busy_start            timestamptz,
  busy_end              timestamptz,
  hold_expires_at       timestamptz,

  policy_accepted_at    timestamptz,
  policy_text           text,

  utm                   jsonb not null default '{}'::jsonb,
  fbp                   text,
  fbc                   text,
  marketing_consent     boolean not null default false,
  ip_hash               text,
  user_agent            text,

  confirmation_email_sent_at timestamptz,
  team_email_sent_at    timestamptz,
  reminder_sent_at      timestamptz,
  calendar_event_id     text,
  admin_notes           text,
  cancelled_reason      text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint bookings_package_check check (package in ('timelapse', 'realestate', 'fpv', 'flythrough', 'experience', 'production', 'wedding_fpv', 'custom')),
  constraint busy_window_valid check (busy_start is null or busy_end > busy_start)
);

-- Hard guarantee against double bookings: no two active bookings may have
-- overlapping busy windows. Expired holds are flipped to status 'expired'
-- (and their window cleared) before new holds are inserted.
do $$ begin
  alter table bookings add constraint bookings_no_overlap
    exclude using gist (tstzrange(busy_start, busy_end, '[)') with &&)
    where (status in ('pending_payment', 'confirmed') and busy_start is not null);
exception when duplicate_object then null; when duplicate_table then null; end $$;

create index if not exists bookings_status_start_idx on bookings (status, scheduled_start);
create index if not exists bookings_busy_idx on bookings (busy_start, busy_end);
create index if not exists bookings_email_idx on bookings (lower(email));

-- ── Availability blocks (vacation days, personal time, etc.) ───
create table if not exists availability_blocks (
  id          uuid primary key default gen_random_uuid(),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  all_day     boolean not null default false,
  reason      text,
  created_at  timestamptz not null default now(),
  constraint block_valid check (ends_at > starts_at)
);
create index if not exists availability_blocks_range_idx on availability_blocks (starts_at, ends_at);

-- ── Settings (single row, JSON) ────────────────────────────────
create table if not exists settings (
  id          integer primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
-- An empty object means "use the app defaults" for every key. Review them in /admin/settings.
insert into settings (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- ── Contact form messages ──────────────────────────────────────
create table if not exists contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  service     text,
  message     text not null,
  ip_hash     text,
  created_at  timestamptz not null default now()
);
create index if not exists contact_messages_ip_idx on contact_messages (ip_hash, created_at desc);

-- ── Processed Square webhook events (idempotency) ──────────────
create table if not exists webhook_events (
  event_id     text primary key,
  type         text not null,
  received_at  timestamptz not null default now()
);

-- ── updated_at trigger ─────────────────────────────────────────
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at before update on bookings for each row execute function set_updated_at();
drop trigger if exists settings_updated_at on settings;
create trigger settings_updated_at before update on settings for each row execute function set_updated_at();

-- ── Lock everything down ───────────────────────────────────────
alter table bookings            enable row level security;
alter table availability_blocks enable row level security;
alter table settings            enable row level security;
alter table contact_messages    enable row level security;
alter table webhook_events      enable row level security;

revoke all on bookings, availability_blocks, settings, contact_messages, webhook_events from anon, authenticated;

-- Newer Supabase projects no longer auto-grant table access to service_role.
-- The server (and only the server) uses this role, so grant it explicitly.
grant usage on schema public to service_role;
grant select, insert, update, delete on bookings, availability_blocks, settings, contact_messages, webhook_events to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ── FPV packages + inquiry fields ──────────────────────────────
-- Kept in a migration so it also applies to databases created before it existed.
-- (Same SQL as supabase/migrations/20261124_fpv_packages.sql.)
alter table bookings
  add column if not exists is_inquiry              boolean not null default false,  -- started as an inquiry / quote request
  add column if not exists industry                text,                            -- "What are we filming?"
  add column if not exists indoor_outdoor          text,
  add column if not exists space_size              text,
  add column if not exists intended_use            text[] not null default '{}',
  add column if not exists social_handle           text,
  add column if not exists is_wedding_videographer boolean not null default false,
  add column if not exists event_date              date,
  add column if not exists expected_attendance     text,
  add column if not exists location_review         text,                            -- pending | approved | declined
  add column if not exists standard_price_cents    integer,                         -- post-launch rate shown at booking time
  add column if not exists launch_pricing          boolean not null default false;  -- launch price applied at booking time

alter table bookings drop constraint if exists bookings_indoor_outdoor_check;
alter table bookings add constraint bookings_indoor_outdoor_check check (indoor_outdoor is null or indoor_outdoor in ('indoor', 'outdoor', 'both'));
alter table bookings drop constraint if exists bookings_space_size_check;
alter table bookings add constraint bookings_space_size_check check (space_size is null or space_size in ('small', 'medium', 'large', 'not_sure'));
alter table bookings drop constraint if exists bookings_location_review_check;
alter table bookings add constraint bookings_location_review_check check (location_review is null or location_review in ('pending', 'approved', 'declined'));


create index if not exists bookings_inquiry_idx on bookings (is_inquiry, status, created_at desc);
