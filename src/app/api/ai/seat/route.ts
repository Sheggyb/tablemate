import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/ai/seat — Smart seating optimizer (no external API)
// Premium/Planner only
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Check plan
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!profile || !["premium","planner"].includes(profile.plan)) {
    return NextResponse.json({ error: "Smart Seating requires Premium or Planner plan", upgrade: true }, { status: 403 });
  }

  const { weddingId, venueId } = await req.json();

  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .select("id")
    .eq("id", weddingId)
    .eq("user_id", user.id)
    .single();

  if (weddingError || !wedding) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Load all data
  const [guestsRes, tablesRes, rulesRes, groupsRes] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", weddingId),
    supabase.from("tables").select("*").eq("venue_id", venueId),
    supabase.from("rules").select("*").eq("wedding_id", weddingId),
    supabase.from("groups").select("*").eq("wedding_id", weddingId),
  ]);

  const guests = guestsRes.data || [];
  const tables = tablesRes.data || [];
  const rules  = rulesRes.data  || [];

  const unseated = guests.filter(g => !g.table_id && g.rsvp !== "declined");
  if (!unseated.length) return NextResponse.json({ message: "Everyone is already seated", assignments: [] });

  // Track free seats per table
  const seatMap: Record<string, number> = {};
  for (const t of tables) {
    const taken = guests.filter(g => g.table_id === t.id).length;
    seatMap[t.id] = t.capacity - taken;
  }

  // Build rule lookups
  const mustWith: Record<string, string[]> = {};
  const mustNotWith: Record<string, string[]> = {};
  for (const r of rules) {
    if (r.type === "must") {
      (mustWith[r.guest1_id] = mustWith[r.guest1_id] || []).push(r.guest2_id);
      (mustWith[r.guest2_id] = mustWith[r.guest2_id] || []).push(r.guest1_id);
    } else {
      (mustNotWith[r.guest1_id] = mustNotWith[r.guest1_id] || []).push(r.guest2_id);
      (mustNotWith[r.guest2_id] = mustNotWith[r.guest2_id] || []).push(r.guest1_id);
    }
  }

  // Group guests by group_id (party), then ungrouped last
  const grouped: Record<string, typeof unseated> = {};
  const ungrouped: typeof unseated = [];
  for (const g of unseated) {
    if (g.group_id) {
      (grouped[g.group_id] = grouped[g.group_id] || []).push(g);
    } else {
      ungrouped.push(g);
    }
  }

  const assignments: Array<{ guestId: string; tableId: string }> = [];
  const assignedTo: Record<string, string> = {}; // guestId → tableId

  function canFit(tableId: string, count: number) {
    return seatMap[tableId] >= count;
  }

  function violatesRules(guestId: string, tableId: string): boolean {
    const mustNotIds = mustNotWith[guestId] || [];
    for (const blocked of mustNotIds) {
      if (assignedTo[blocked] === tableId) return true;
    }
    return false;
  }

  function scoreTable(guestIds: string[], tableId: string): number {
    let score = 0;
    for (const gid of guestIds) {
      for (const mustId of (mustWith[gid] || [])) {
        if (assignedTo[mustId] === tableId) score += 10;
      }
    }
    return score;
  }

  function assignGroup(guestIds: string[]) {
    // Sort tables: prefer ones with must-with already there, enough capacity, no violations
    const candidates = tables
      .filter(t => canFit(t.id, guestIds.length) && !guestIds.some(id => violatesRules(id, t.id)))
      .sort((a, b) => scoreTable(guestIds, b.id) - scoreTable(guestIds, a.id));

    if (!candidates.length) {
      // Try splitting into individuals if group is too big
      for (const gid of guestIds) assignGroup([gid]);
      return;
    }

    const table = candidates[0];
    for (const gid of guestIds) {
      assignments.push({ guestId: gid, tableId: table.id });
      assignedTo[gid] = table.id;
      seatMap[table.id]--;
    }
  }

  // Assign groups first (keep parties together)
  for (const groupGuests of Object.values(grouped)) {
    assignGroup(groupGuests.map(g => g.id));
  }

  // Then ungrouped individuals
  for (const g of ungrouped) {
    assignGroup([g.id]);
  }

  // Persist to DB
  let applied = 0;
  for (const a of assignments) {
    const { data: tableGuests } = await supabase
      .from("guests")
      .select("seat_index")
      .eq("table_id", a.tableId);

    const usedSeats = new Set((tableGuests || []).map((g: { seat_index: number }) => g.seat_index).filter((s: number | null) => s !== null));
    let seatIndex = 0;
    const cap = tables.find(t => t.id === a.tableId)?.capacity || 8;
    while (usedSeats.has(seatIndex) && seatIndex < cap) seatIndex++;
    if (seatIndex >= cap) continue;

    await supabase.from("guests").update({
      table_id: a.tableId,
      seat_index: seatIndex,
    }).eq("id", a.guestId);

    applied++;
  }

  return NextResponse.json({
    message: `Seated ${applied} of ${unseated.length} guests`,
    applied,
    total: unseated.length,
    assignments,
  });
}
