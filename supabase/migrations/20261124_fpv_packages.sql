-- ════════════════════════════════════════════════════════════════
-- FPV packages + inquiry fields (2026-11-24)
-- Safe to run more than once. Adds new package IDs and optional columns only;
-- existing bookings and payment records are not modified (except backfilling
-- is_inquiry = true on the legacy quote-only 'fpv' rows, which is what they were).
-- Run in Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- New package IDs (old ones kept so existing rows stay valid)
alter table bookings drop constraint if exists bookings_package_check;
alter table bookings add constraint bookings_package_check
  check (package in ('timelapse', 'realestate', 'fpv', 'flythrough', 'experience', 'production', 'wedding_fpv', 'custom'));

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

update bookings set is_inquiry = true where package = 'fpv' and is_inquiry = false;

create index if not exists bookings_inquiry_idx on bookings (is_inquiry, status, created_at desc);
