import PlannerClient from "@/app/app/wedding/[id]/PlannerClient";
import type { Wedding, Venue, Guest, Table, Group, Rule } from "@/lib/types";

// ── Mock data for demo ─────────────────────────────────────────────────────────
const WEDDING: Wedding = {
  id: "demo-wedding",
  user_id: "demo-user",
  name: "Sarah & Tom's Wedding",
  date: "2025-09-06",
  couple_names: "Sarah & Tom",
  share_code: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const VENUE: Venue = {
  id: "demo-venue",
  wedding_id: "demo-wedding",
  name: "Main Hall",
  background_image: null,
  bg_opacity: 0.15,
  sort_order: 0,
};

const TABLES: Table[] = [
  { id: "t1", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 1 — Bride's Family", shape: "round",     capacity: 8,  x: 160, y: 150 },
  { id: "t2", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 2 — Groom's Family", shape: "round",     capacity: 8,  x: 380, y: 150 },
  { id: "t3", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 3 — College Friends", shape: "round",     capacity: 6,  x: 600, y: 150 },
  { id: "t4", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 4 — Work Colleagues", shape: "round",     capacity: 10, x: 160, y: 360 },
  { id: "t5", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 5 — Childhood Friends", shape: "round",   capacity: 8,  x: 380, y: 360 },
  { id: "t6", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Head Table",                  shape: "rectangle", capacity: 12, x: 380, y: 560 },
];

const GROUPS: Group[] = [
  { id: "grp1", wedding_id: "demo-wedding", name: "Bride's Family",   color: "#c9a96e", invite_code: null },
  { id: "grp2", wedding_id: "demo-wedding", name: "Groom's Family",   color: "#7B9E87", invite_code: null },
  { id: "grp3", wedding_id: "demo-wedding", name: "College Friends",  color: "#8B7BA8", invite_code: null },
  { id: "grp4", wedding_id: "demo-wedding", name: "Work Colleagues",  color: "#6E9EC9", invite_code: null },
];

const GUESTS: Guest[] = [
  { id: "g1",  wedding_id: "demo-wedding", table_id: "t1", group_id: "grp1", seat_index: 0, first_name: "Emma",        last_name: "Johnson",  email: "emma@example.com",   rsvp: "confirmed", meal: "standard",     rsvp_token: "tok1"  },
  { id: "g2",  wedding_id: "demo-wedding", table_id: "t1", group_id: "grp1", seat_index: 1, first_name: "James",       last_name: "Johnson",  email: "james@example.com",  rsvp: "confirmed", meal: "vegetarian",   rsvp_token: "tok2"  },
  { id: "g3",  wedding_id: "demo-wedding", table_id: "t1", group_id: "grp1", seat_index: 2, first_name: "Sophie",      last_name: "Brown",    email: "sophie@example.com", rsvp: "confirmed", meal: "vegan",        rsvp_token: "tok3"  },
  { id: "g4",  wedding_id: "demo-wedding", table_id: "t1", group_id: "grp1", seat_index: 3, first_name: "Oliver",      last_name: "Brown",    email: null,                 rsvp: "confirmed", meal: "standard",     rsvp_token: "tok4"  },
  { id: "g5",  wedding_id: "demo-wedding", table_id: "t2", group_id: "grp2", seat_index: 0, first_name: "Mia",         last_name: "Davis",    email: "mia@example.com",    rsvp: "confirmed", meal: "standard",     rsvp_token: "tok5"  },
  { id: "g6",  wedding_id: "demo-wedding", table_id: "t2", group_id: "grp2", seat_index: 1, first_name: "Noah",        last_name: "Davis",    email: null,                 rsvp: "confirmed", meal: "halal",        rsvp_token: "tok6"  },
  { id: "g7",  wedding_id: "demo-wedding", table_id: "t2", group_id: "grp2", seat_index: 2, first_name: "Ava",         last_name: "Wilson",   email: "ava@example.com",    rsvp: "pending",   meal: "vegan",        rsvp_token: "tok7"  },
  { id: "g8",  wedding_id: "demo-wedding", table_id: "t2", group_id: "grp2", seat_index: 3, first_name: "Liam",        last_name: "Wilson",   email: null,                 rsvp: "confirmed", meal: "standard",     rsvp_token: "tok8"  },
  { id: "g9",  wedding_id: "demo-wedding", table_id: "t3", group_id: "grp3", seat_index: 0, first_name: "Isabella",    last_name: "Moore",    email: null,                 rsvp: "confirmed", meal: "vegetarian",   rsvp_token: "tok9"  },
  { id: "g10", wedding_id: "demo-wedding", table_id: "t3", group_id: "grp3", seat_index: 1, first_name: "Lucas",       last_name: "Taylor",   email: null,                 rsvp: "confirmed", meal: "standard",     rsvp_token: "tok10" },
  { id: "g11", wedding_id: "demo-wedding", table_id: "t3", group_id: "grp3", seat_index: 2, first_name: "Charlotte",   last_name: "Anderson", email: null,                 rsvp: "declined",  meal: "standard",     rsvp_token: "tok11" },
  { id: "g12", wedding_id: "demo-wedding", table_id: "t4", group_id: "grp4", seat_index: 0, first_name: "Ethan",       last_name: "Thomas",   email: null,                 rsvp: "confirmed", meal: "standard",     rsvp_token: "tok12" },
  { id: "g13", wedding_id: "demo-wedding", table_id: "t4", group_id: "grp4", seat_index: 1, first_name: "Amelia",      last_name: "Jackson",  email: null,                 rsvp: "confirmed", meal: "gluten-free",  rsvp_token: "tok13" },
  { id: "g14", wedding_id: "demo-wedding", table_id: "t4", group_id: "grp4", seat_index: 2, first_name: "Benjamin",    last_name: "White",    email: "ben@example.com",    rsvp: "pending",   meal: "standard",     rsvp_token: "tok14" },
  { id: "g15", wedding_id: "demo-wedding", table_id: "t5", group_id: null,   seat_index: 0, first_name: "Harper",      last_name: "Harris",   email: null,                 rsvp: "confirmed", meal: "standard",     rsvp_token: "tok15" },
  { id: "g16", wedding_id: "demo-wedding", table_id: "t5", group_id: null,   seat_index: 1, first_name: "Alexander",   last_name: "Martin",   email: null,                 rsvp: "confirmed", meal: "vegetarian",   rsvp_token: "tok16" },
  { id: "g17", wedding_id: "demo-wedding", table_id: "t6", group_id: null,   seat_index: 0, first_name: "Evelyn",      last_name: "Thompson", email: null,                 rsvp: "confirmed", meal: "standard",     rsvp_token: "tok17" },
  { id: "g18", wedding_id: "demo-wedding", table_id: "t6", group_id: null,   seat_index: 1, first_name: "Daniel",      last_name: "Garcia",   email: null,                 rsvp: "confirmed", meal: "halal",        rsvp_token: "tok18" },
  { id: "g19", wedding_id: "demo-wedding", table_id: null, group_id: "grp1", seat_index: null, first_name: "Grace",    last_name: "Johnson",  email: "grace@example.com",  rsvp: "confirmed", meal: "vegan",        rsvp_token: "tok19" },
  { id: "g20", wedding_id: "demo-wedding", table_id: null, group_id: null,   seat_index: null, first_name: "Henry",    last_name: "Smith",    email: "henry@example.com",  rsvp: "pending",   meal: "standard",     rsvp_token: "tok20" },
];

const RULES: Rule[] = [
  { id: "r1", wedding_id: "demo-wedding", guest1_id: "g1",  guest2_id: "g2",  type: "must_sit_with" },
  { id: "r2", wedding_id: "demo-wedding", guest1_id: "g7",  guest2_id: "g15", type: "must_not_sit_with" },
];

export default function DemoPage() {
  return (
    <PlannerClient
      wedding={WEDDING}
      initialVenues={[VENUE]}
      initialGuests={GUESTS}
      initialTables={TABLES}
      initialGroups={GROUPS}
      initialRules={RULES}
      plan="premium"
      isDemo={true}
    />
  );
}
