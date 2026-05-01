"use client";

import PlannerClient from "../wedding/[id]/PlannerClient";
import type { Wedding, Venue, Guest, Table, Group } from "@/lib/types";

const WEDDING: Wedding = {
  id: "demo",
  user_id: "demo",
  name: "Demo Wedding 🎉",
  date: "2025-08-15",
  couple_names: "Alex & Jordan",
  share_code: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const VENUE: Venue = {
  id: "venue-demo",
  wedding_id: "demo",
  name: "Main Hall",
  background_image: null,
  bg_opacity: 0.15,
  sort_order: 0,
};

const TABLES: Table[] = [
  { id: "t1", venue_id: "venue-demo", name: "Bride's Family",  shape: "round",     capacity: 8,  x: 180, y: 180, rotation: 0 },
  { id: "t2", venue_id: "venue-demo", name: "Groom's Family",  shape: "round",     capacity: 8,  x: 420, y: 180, rotation: 0 },
  { id: "t3", venue_id: "venue-demo", name: "Friends",         shape: "round",     capacity: 8,  x: 180, y: 400, rotation: 0 },
  { id: "t4", venue_id: "venue-demo", name: "Work Colleagues", shape: "rectangle", capacity: 10, x: 380, y: 400, rotation: 0 },
];

const GROUPS: Group[] = [
  { id: "g1", wedding_id: "demo", name: "Family",     color: "#6366f1", invite_code: null },
  { id: "g2", wedding_id: "demo", name: "Friends",    color: "#f59e0b", invite_code: null },
  { id: "g3", wedding_id: "demo", name: "Colleagues", color: "#10b981", invite_code: null },
];

const GUESTS: Guest[] = [
  { id: "guest-1",  wedding_id: "demo", first_name: "Emma",     last_name: "Johnson", rsvp: "confirmed", meal: "chicken", group_id: "g1", table_id: null, seat_index: null },
  { id: "guest-2",  wedding_id: "demo", first_name: "James",    last_name: "Johnson", rsvp: "confirmed", meal: "fish",    group_id: "g1", table_id: null, seat_index: null },
  { id: "guest-3",  wedding_id: "demo", first_name: "Sophie",   last_name: "Davis",   rsvp: "confirmed", meal: "vegan",   group_id: "g1", table_id: null, seat_index: null },
  { id: "guest-4",  wedding_id: "demo", first_name: "Oliver",   last_name: "Davis",   rsvp: "confirmed", meal: "chicken", group_id: "g1", table_id: null, seat_index: null },
  { id: "guest-5",  wedding_id: "demo", first_name: "Mia",      last_name: "Taylor",  rsvp: "confirmed", meal: "halal",   group_id: "g2", table_id: null, seat_index: null },
  { id: "guest-6",  wedding_id: "demo", first_name: "Noah",     last_name: "Taylor",  rsvp: "pending",   meal: "fish",    group_id: "g2", table_id: null, seat_index: null },
  { id: "guest-7",  wedding_id: "demo", first_name: "Ava",      last_name: "Wilson",  rsvp: "confirmed", meal: "vegan",   group_id: "g2", table_id: null, seat_index: null },
  { id: "guest-8",  wedding_id: "demo", first_name: "Liam",     last_name: "Chen",    rsvp: "confirmed", meal: "chicken", group_id: "g3", table_id: null, seat_index: null },
  { id: "guest-9",  wedding_id: "demo", first_name: "Isabella", last_name: "Chen",    rsvp: "confirmed", meal: "fish",    group_id: "g3", table_id: null, seat_index: null },
  { id: "guest-10", wedding_id: "demo", first_name: "Lucas",    last_name: "Martin",  rsvp: "confirmed", meal: "halal",   group_id: "g3", table_id: null, seat_index: null },
];

export default function DemoPage() {
  return (
    <PlannerClient
      wedding={WEDDING}
      initialVenues={[VENUE]}
      initialGuests={GUESTS}
      initialTables={TABLES}
      initialGroups={GROUPS}
      initialRules={[]}
      plan="pro"
      isDemo={true}
    />
  );
}
