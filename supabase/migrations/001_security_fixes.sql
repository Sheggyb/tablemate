-- Migration 001: Security fixes & schema improvements
-- Run this on the live Supabase database (SQL editor or CLI).
-- Safe to re-run (all statements are idempotent).

-- ────────────────────────────────────────────────────────────
-- Fix 1: Tighten RLS on guests table
-- The old policies exposed ALL guest rows to any anonymous user.
-- Anonymous RSVP access is now handled via security definer functions.
-- ────────────────────────────────────────────────────────────
drop policy if exists "RSVP token read"   on public.guests;
drop policy if exists "RSVP token update" on public.guests;

create policy "RSVP token read" on public.guests for select
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

create policy "RSVP token update" on public.guests for update
  using (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.weddings w where w.id = wedding_id and w.user_id = auth.uid()));

-- ────────────────────────────────────────────────────────────
-- Fix 1b: Security definer RPC functions for anonymous RSVP page
-- ────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────
-- Fix 2: Add share_code to weddings
-- ────────────────────────────────────────────────────────────
alter table public.weddings add column if not exists share_code text unique default encode(gen_random_bytes(6), 'hex');
create index if not exists idx_weddings_share_code on public.weddings(share_code);

-- ────────────────────────────────────────────────────────────
-- Fix 3: Additional guest indexes for common query patterns
-- ────────────────────────────────────────────────────────────
create index if not exists idx_guests_wedding_table on public.guests(wedding_id, table_id);
create index if not exists idx_guests_wedding_rsvp  on public.guests(wedding_id, rsvp);

-- ────────────────────────────────────────────────────────────
-- Fix 4: Unique constraint on rules to prevent duplicate entries
-- ────────────────────────────────────────────────────────────
alter table public.rules add constraint if not exists unique_rule unique (guest1_id, guest2_id, type);
