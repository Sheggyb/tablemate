-- TableMate Database Schema
-- Run this in Supabase SQL editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ════════════════════════════════════
-- USERS (extends Supabase auth.users)
-- ════════════════════════════════════
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text,
  full_name     text,
  plan          text not null default 'free',   -- free | couple | premium | planner
  stripe_customer_id text,
  created_at    timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ════════════════════════════════════
-- WEDDINGS
-- ════════════════════════════════════
create table public.weddings (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  name          text not null default 'Our Wedding',
  date          date,
  couple_names  text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.weddings enable row level security;
create policy "Users manage own weddings" on public.weddings for all using (auth.uid() = user_id);

-- ════════════════════════════════════
-- VENUES (floor plans per wedding)
-- ════════════════════════════════════
create table public.venues (
  id                uuid default gen_random_uuid() primary key,
  wedding_id        uuid references public.weddings(id) on delete cascade not null,
  name              text not null default 'Main Venue',
  background_image  text,
  bg_opacity        numeric default 0.4,
  sort_order        int default 0
);
alter table public.venues enable row level security;
create policy "Wedding owner manages venues" on public.venues for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ════════════════════════════════════
-- TABLES (seating tables)
-- ════════════════════════════════════
create table public.tables (
  id              uuid default gen_random_uuid() primary key,
  wedding_id      uuid references public.weddings(id) on delete cascade not null,
  venue_id        uuid references public.venues(id) on delete cascade not null,
  name            text not null,
  type            text not null default 'round',       -- round | square | rectangular
  capacity        int  not null default 8,
  seat_assignment text not null default 'table',       -- table | seat
  x               numeric default 80,
  y               numeric default 80,
  rotation        numeric default 0
);
alter table public.tables enable row level security;
create policy "Wedding owner manages tables" on public.tables for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ════════════════════════════════════
-- GROUPS (families, couples, friend groups)
-- ════════════════════════════════════
create table public.groups (
  id          uuid default gen_random_uuid() primary key,
  wedding_id  uuid references public.weddings(id) on delete cascade not null,
  name        text not null,
  color       text default '#D49A7C',
  invite_code text
);
alter table public.groups enable row level security;
create policy "Wedding owner manages groups" on public.groups for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ════════════════════════════════════
-- GUESTS
-- ════════════════════════════════════
create table public.guests (
  id            uuid default gen_random_uuid() primary key,
  wedding_id    uuid references public.weddings(id) on delete cascade not null,
  table_id      uuid references public.tables(id) on delete set null,
  group_id      uuid references public.groups(id) on delete set null,
  seat_index    int,
  first_name    text not null,
  last_name     text default '',
  email         text default '',
  phone         text default '',
  rsvp          text not null default 'pending',   -- pending | confirmed | declined
  meal          text not null default 'standard',  -- standard | vegetarian | vegan | gluten-free | halal | kosher | children
  allergies     text default '',
  notes         text default '',
  special_needs text[] default '{}',
  rsvp_token    text unique default encode(gen_random_bytes(16), 'hex'),
  rsvp_responded_at timestamptz,
  created_at    timestamptz default now()
);
alter table public.guests enable row level security;
create policy "Wedding owner manages guests" on public.guests for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));
-- RSVP page can read/update guest by token (no auth required)
create policy "RSVP token read" on public.guests for select using (rsvp_token is not null);
create policy "RSVP token update" on public.guests for update using (rsvp_token is not null);

-- ════════════════════════════════════
-- SEATING RULES
-- ════════════════════════════════════
create table public.rules (
  id          uuid default gen_random_uuid() primary key,
  wedding_id  uuid references public.weddings(id) on delete cascade not null,
  guest1_id   uuid references public.guests(id) on delete cascade not null,
  guest2_id   uuid references public.guests(id) on delete cascade not null,
  type        text not null  -- must-sit-with | must-not-sit-with
);
alter table public.rules enable row level security;
create policy "Wedding owner manages rules" on public.rules for all
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ════════════════════════════════════
-- TABLE SEATS (junction: which guest sits where)
-- ════════════════════════════════════
-- NOTE: denormalized into guests.table_id + guests.seat_index for simplicity
-- This view reconstructs the seat grid for a table
create or replace view public.table_seating as
  select
    t.id as table_id,
    t.name as table_name,
    t.capacity,
    t.venue_id,
    t.wedding_id,
    g.id as guest_id,
    g.first_name,
    g.last_name,
    g.meal,
    g.rsvp,
    g.seat_index
  from public.tables t
  left join public.guests g on g.table_id = t.id;

-- ════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════
create index on public.guests(wedding_id);
create index on public.tables(venue_id);
create index on public.groups(wedding_id);
create index on public.rules(wedding_id);
create index on public.guests(rsvp_token);
