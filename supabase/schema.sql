-- TableMate Database Schema
-- Run this in Supabase SQL editor

create extension if not exists "pgcrypto";

-- ════════════════════════════════════
-- PROFILES (extends auth.users)
-- ════════════════════════════════════
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text,
  full_name     text,
  plan          text not null default 'free',
  stripe_customer_id text,
  created_at    timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ════════════════════════════════════
-- WEDDINGS
-- ════════════════════════════════════
create table if not exists public.weddings (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  name          text not null default 'Our Wedding',
  date          date,
  couple_names  text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.weddings enable row level security;
drop policy if exists "Users manage own weddings" on public.weddings;
create policy "Users manage own weddings" on public.weddings for all using (auth.uid() = user_id);

-- ════════════════════════════════════
-- VENUES
-- ════════════════════════════════════
create table if not exists public.venues (
  id                uuid default gen_random_uuid() primary key,
  wedding_id        uuid references public.weddings(id) on delete cascade not null,
  name              text not null default 'Main Venue',
  background_image  text,
  bg_opacity        numeric default 0.15,
  sort_order        int default 0
);
alter table public.venues enable row level security;
drop policy if exists "Wedding owner manages venues" on public.venues;
create policy "Wedding owner manages venues" on public.venues for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ════════════════════════════════════
-- TABLES
-- ════════════════════════════════════
create table if not exists public.tables (
  id              uuid default gen_random_uuid() primary key,
  wedding_id      uuid references public.weddings(id) on delete cascade not null,
  venue_id        uuid references public.venues(id) on delete cascade not null,
  name            text not null,
  shape           text not null default 'round',
  capacity        int  not null default 8,
  x               numeric default 80,
  y               numeric default 80,
  rotation        numeric default 0
);
alter table public.tables enable row level security;
drop policy if exists "Wedding owner manages tables" on public.tables;
create policy "Wedding owner manages tables" on public.tables for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ════════════════════════════════════
-- GROUPS
-- ════════════════════════════════════
create table if not exists public.groups (
  id          uuid default gen_random_uuid() primary key,
  wedding_id  uuid references public.weddings(id) on delete cascade not null,
  name        text not null,
  color       text default '#D49A7C',
  invite_code text
);
alter table public.groups enable row level security;
drop policy if exists "Wedding owner manages groups" on public.groups;
create policy "Wedding owner manages groups" on public.groups for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ════════════════════════════════════
-- GUESTS
-- ════════════════════════════════════
create table if not exists public.guests (
  id            uuid default gen_random_uuid() primary key,
  wedding_id    uuid references public.weddings(id) on delete cascade not null,
  table_id      uuid references public.tables(id) on delete set null,
  group_id      uuid references public.groups(id) on delete set null,
  seat_index    int,
  first_name    text not null,
  last_name     text default '',
  email         text default '',
  phone         text default '',
  rsvp          text not null default 'pending',
  meal          text not null default 'standard',
  allergies     text default '',
  notes         text default '',
  rsvp_token    text unique default encode(gen_random_bytes(16), 'hex'),
  rsvp_responded_at timestamptz,
  created_at    timestamptz default now()
);
alter table public.guests enable row level security;
drop policy if exists "Wedding owner manages guests" on public.guests;
drop policy if exists "RSVP token read" on public.guests;
drop policy if exists "RSVP token update" on public.guests;
create policy "Wedding owner manages guests" on public.guests for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));
-- RSVP policies: anonymous access is handled via security definer RPC functions below.
-- Direct table access is restricted to authenticated wedding owners only.
create policy "RSVP token read" on public.guests for select
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));
create policy "RSVP token update" on public.guests for update
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ════════════════════════════════════
-- RULES
-- ════════════════════════════════════
create table if not exists public.rules (
  id          uuid default gen_random_uuid() primary key,
  wedding_id  uuid references public.weddings(id) on delete cascade not null,
  guest1_id   uuid references public.guests(id) on delete cascade not null,
  guest2_id   uuid references public.guests(id) on delete cascade not null,
  type        text not null
);
alter table public.rules enable row level security;
drop policy if exists "Wedding owner manages rules" on public.rules;
create policy "Wedding owner manages rules" on public.rules for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_rule'
  ) THEN
    ALTER TABLE public.rules ADD CONSTRAINT unique_rule UNIQUE (guest1_id, guest2_id, type);
  END IF;
END$$;

-- ════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════
create index if not exists idx_guests_wedding_id    on public.guests(wedding_id);
create index if not exists idx_tables_venue_id      on public.tables(venue_id);
create index if not exists idx_groups_wedding_id    on public.groups(wedding_id);
create index if not exists idx_rules_wedding_id     on public.rules(wedding_id);
create index if not exists idx_guests_rsvp_token    on public.guests(rsvp_token);
create index if not exists idx_guests_wedding_table on public.guests(wedding_id, table_id);
create index if not exists idx_guests_wedding_rsvp  on public.guests(wedding_id, rsvp);

-- ════════════════════════════════════
-- WEDDINGS: share_code column
-- ════════════════════════════════════
alter table public.weddings add column if not exists share_code text unique default encode(gen_random_bytes(6), 'hex');
create index if not exists idx_weddings_share_code on public.weddings(share_code);

-- ════════════════════════════════════
-- SECURITY DEFINER FUNCTIONS (RSVP)
-- These bypass RLS so the anonymous/public RSVP page can read and update
-- a single guest record without exposing the full guests table.
-- ════════════════════════════════════

-- Read a guest by RSVP token (includes related wedding data)
create or replace function public.get_guest_by_rsvp_token(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select row_to_json(r) from (
    select g.*, row_to_json(w.*) as weddings
    from public.guests g
    join public.weddings w on w.id = g.wedding_id
    where g.rsvp_token = p_token
    limit 1
  ) r;
$$;

-- Update a guest's RSVP response (only fields the guest is allowed to change)
create or replace function public.update_guest_rsvp(
  p_token      text,
  p_rsvp       text,
  p_meal       text,
  p_allergies  text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.guests
  set
    rsvp               = p_rsvp,
    meal               = p_meal,
    allergies          = p_allergies,
    rsvp_responded_at  = now()
  where rsvp_token = p_token;
$$;
