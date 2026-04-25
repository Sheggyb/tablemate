# TableMate Launch Readiness Plan

> **For Hermes:** Use claude-code skill to implement this plan.

**Goal:** Fix all critical bugs and polish issues blocking a production launch of TableMate.

**Architecture:** Next.js 15 App Router + Supabase + Stripe. All source code lives in `src/`. Pages under `src/app/`, components under `src/components/`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase, Stripe, Resend

---

## CRITICAL (Security / Data Loss)

### Task 1: Fix AI seat API ownership check
**Objective:** Prevent any user from fetching another user's seating data via the AI endpoint.

**File:** `src/app/api/ai/seat/route.ts`

**Fix:** After getting `userId` from the session, verify the wedding belongs to that user before proceeding:
```ts
// After auth check, before fetching guests/tables:
const { data: wedding, error: weddingError } = await supabase
  .from('weddings')
  .select('id')
  .eq('id', weddingId)
  .eq('user_id', userId)
  .single();

if (weddingError || !wedding) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

**Verify:** The check must come before any `guests` or `tables` query.

---

### Task 2: Fix autoSeat not persisting to Supabase
**Objective:** When the AI assigns seats, save them to the database so they survive page refresh.

**File:** `src/components/planner/PlannerClient.tsx`

**Fix:** After `dispatch({ type: 'AUTO_SEAT', ... })` in the `autoSeat` function, also write each assignment to Supabase:
```ts
// After dispatching local state update:
const upsertRows = assignments.map((a: any) => ({
  guest_id: a.guestId,
  table_id: a.tableId,
  seat_number: a.seatNumber ?? null,
  wedding_id: weddingId,
  venue_id: venueId,
}));

await supabase.from('seat_assignments').upsert(upsertRows, { onConflict: 'guest_id' });
```

Check the actual Supabase table name and columns by looking at `supabase/migrations/` first.

---

### Task 3: Fix location field silently dropped on wedding creation
**Objective:** Save the location field when creating a new wedding.

**File:** `src/app/app/new/page.tsx`

**Fix:** Add `location` to the Supabase insert query. Find the insert call that has `name`, `couple_names`, `date` and add `location: formData.location` (or whatever the state field is called).

---

## HIGH PRIORITY (UX / Correctness)

### Task 4: Unify dark mode localStorage key
**Objective:** User's dark mode preference persists across all pages.

**Problem:** Three different keys in use:
- `"tablemate_dark"` — landing page
- `"tm-theme"` — dashboard  
- `"tablemate-dark"` — new wedding page

**Fix:** Search all files for these three keys. Pick one canonical key (`"tm-theme"` — it's already in the dashboard which users spend most time in). Replace all occurrences of `"tablemate_dark"` and `"tablemate-dark"` with `"tm-theme"`.

Run: `grep -r "tablemate_dark\|tablemate-dark\|tm-theme" src/ --include="*.tsx" --include="*.ts" -l` to find all files.

---

### Task 5: Add dark mode to the upgrade page
**Objective:** `/app/upgrade/page.tsx` should respect `"tm-theme"` localStorage preference.

**File:** `src/app/app/upgrade/page.tsx`

**Fix:** Add the same dark mode hook used in the dashboard. Look at `src/app/app/page.tsx` or dashboard page to copy the pattern. Apply `dark` class to the root div, then replace hardcoded `bg-[#FDFBF8]` and `bg-white` with dark-aware classes (`dark:bg-gray-900`, `dark:bg-gray-800`, etc.). Match the visual style of the dashboard.

---

### Task 6: Replace alert() calls with toast notifications
**Objective:** Remove jarring browser `alert()` calls, use the existing toast system.

**File:** `src/components/planner/GuestPanel.tsx` (and any other file using `alert()`)

**Fix:** 
1. Run `grep -r "alert(" src/ --include="*.tsx" -n` to find all usages.
2. For each `alert(message)`, replace with the toast pattern already in the codebase. Look at other components to find how toasts are called (likely `toast.success()`, `toast.error()`, or a custom hook).

---

### Task 7: Add backend guest limit enforcement
**Objective:** Free plan users cannot exceed 50 guests via any API path.

**Files to check:** Any API route that inserts guests (likely `src/app/api/guests/route.ts` or similar).

**Fix:** Before inserting a new guest, count existing guests for the wedding and check against the plan limit:
```ts
const { count } = await supabase
  .from('guests')
  .select('*', { count: 'exact', head: true })
  .eq('wedding_id', weddingId);

const plan = await getUserPlan(userId); // use existing plan util
const limit = PLAN_LIMITS[plan].maxGuests;

if (count !== null && count >= limit) {
  return NextResponse.json({ error: 'Guest limit reached for your plan' }, { status: 403 });
}
```

Find `PLAN_LIMITS` in `src/types.ts` and the existing plan-checking utility to reuse.

---

## POLISH (Nice to Have for Launch)

### Task 8: Add Wishing Wall to landing page features section
**Objective:** Mention the Wishing Wall as a feature on the landing page — it's a real differentiator.

**File:** `src/app/page.tsx` (landing page)

**Fix:** Find the features/benefits section. Add a card/item for the Wishing Wall feature. Something like: "💌 Wishing Wall — Guests can leave heartfelt messages directly from their RSVP link."

Keep the same visual style as other feature cards.

---

### Task 9: General UI audit — mobile planner
**Objective:** Verify the mobile planner (`MobilePlanner.tsx`) works correctly and has no obvious broken states.

**File:** `src/components/planner/MobilePlanner.tsx`

**Fix:** Read through the component. Check:
- Does it have access to all the same actions as the desktop planner (add guest, assign seat, remove)?
- Are there any `TODO` comments or incomplete handlers?
- Does it handle the empty state (no tables/guests) gracefully?

Fix any `TODO`s or obviously broken handlers found.

---

### Task 10: Final check — commit everything clean
**Objective:** All changes committed, no console errors in key pages.

**Steps:**
1. Run `git status` — confirm all files are staged
2. Run `git add -A && git commit -m "fix: launch readiness — security, dark mode, persistence, UX polish"`
3. Run `git push origin main`

Vercel will auto-deploy after push.

---

## Summary of Files Likely Touched
- `src/app/api/ai/seat/route.ts` — ownership check
- `src/components/planner/PlannerClient.tsx` — autoSeat persistence
- `src/app/app/new/page.tsx` — location field
- `src/app/page.tsx` — landing page (dark mode key + wishing wall)
- `src/app/app/page.tsx` or dashboard — dark mode key
- `src/app/app/upgrade/page.tsx` — dark mode
- `src/components/planner/GuestPanel.tsx` — alert() → toast
- Guest API route (find it) — backend guest limit
