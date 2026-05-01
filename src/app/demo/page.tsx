"use client";

import { useEffect, useState } from "react";
import PlannerClient from "@/app/app/wedding/[id]/PlannerClient";
import type { Wedding, Venue, Guest, Table, Group, Rule } from "@/lib/types";

// ── Mock data for demo ──────────────────────────────────────────────────────
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

// 4 tables, no guests pre-assigned
const TABLES: Table[] = [
  { id: "t1", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 1 — Bride's Family",  shape: "round",     capacity: 8,  x: 160, y: 160 },
  { id: "t2", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 2 — Groom's Family",  shape: "round",     capacity: 8,  x: 440, y: 160 },
  { id: "t3", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 3 — Friends",         shape: "round",     capacity: 8,  x: 160, y: 400 },
  { id: "t4", wedding_id: "demo-wedding", venue_id: "demo-venue", name: "Table 4 — Work Colleagues", shape: "rectangle", capacity: 10, x: 440, y: 400 },
];

const GROUPS: Group[] = [
  { id: "grp1", wedding_id: "demo-wedding", name: "Bride's Family",  color: "#c9a96e", invite_code: null },
  { id: "grp2", wedding_id: "demo-wedding", name: "Groom's Family",  color: "#7B9E87", invite_code: null },
  { id: "grp3", wedding_id: "demo-wedding", name: "Friends",         color: "#8B7BA8", invite_code: null },
  { id: "grp4", wedding_id: "demo-wedding", name: "Work Colleagues", color: "#6E9EC9", invite_code: null },
];

// All 10 guests unassigned (table_id: null) — ready to drag to tables
const GUESTS: Guest[] = [
  { id: "g1",  wedding_id: "demo-wedding", table_id: null, group_id: "grp1", seat_index: null, first_name: "Emma",      last_name: "Johnson",  email: "emma@example.com",    rsvp: "confirmed", meal: "standard",    rsvp_token: "tok1"  },
  { id: "g2",  wedding_id: "demo-wedding", table_id: null, group_id: "grp1", seat_index: null, first_name: "James",     last_name: "Johnson",  email: "james@example.com",   rsvp: "confirmed", meal: "vegetarian",  rsvp_token: "tok2"  },
  { id: "g3",  wedding_id: "demo-wedding", table_id: null, group_id: "grp2", seat_index: null, first_name: "Sophie",    last_name: "Davis",    email: "sophie@example.com",  rsvp: "confirmed", meal: "vegan",       rsvp_token: "tok3"  },
  { id: "g4",  wedding_id: "demo-wedding", table_id: null, group_id: "grp2", seat_index: null, first_name: "Oliver",    last_name: "Davis",    email: null,                  rsvp: "confirmed", meal: "standard",    rsvp_token: "tok4"  },
  { id: "g5",  wedding_id: "demo-wedding", table_id: null, group_id: "grp3", seat_index: null, first_name: "Mia",       last_name: "Taylor",   email: "mia@example.com",     rsvp: "confirmed", meal: "halal",       rsvp_token: "tok5"  },
  { id: "g6",  wedding_id: "demo-wedding", table_id: null, group_id: "grp3", seat_index: null, first_name: "Noah",      last_name: "Taylor",   email: null,                  rsvp: "pending",   meal: "standard",    rsvp_token: "tok6"  },
  { id: "g7",  wedding_id: "demo-wedding", table_id: null, group_id: "grp3", seat_index: null, first_name: "Ava",       last_name: "Wilson",   email: "ava@example.com",     rsvp: "confirmed", meal: "gluten-free", rsvp_token: "tok7"  },
  { id: "g8",  wedding_id: "demo-wedding", table_id: null, group_id: "grp4", seat_index: null, first_name: "Liam",      last_name: "Chen",     email: null,                  rsvp: "confirmed", meal: "standard",    rsvp_token: "tok8"  },
  { id: "g9",  wedding_id: "demo-wedding", table_id: null, group_id: "grp4", seat_index: null, first_name: "Isabella",  last_name: "Chen",     email: null,                  rsvp: "confirmed", meal: "vegetarian",  rsvp_token: "tok9"  },
  { id: "g10", wedding_id: "demo-wedding", table_id: null, group_id: "grp4", seat_index: null, first_name: "Lucas",     last_name: "Martin",   email: null,                  rsvp: "confirmed", meal: "standard",    rsvp_token: "tok10" },
];

const RULES: Rule[] = [];

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);

  // Apply saved theme before rendering so demo inherits theme from landing page
  useEffect(() => {
    const saved = localStorage.getItem("tm-theme");
    const root = document.documentElement;
    if (saved === "dark") {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
    } else {
      root.setAttribute("data-theme", "light");
      root.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Demo banner */}
      <div
        style={{
          background: "var(--accent)",
          color: "#fff",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 500,
          flexShrink: 0,
          letterSpacing: "0.01em",
        }}
      >
        🎉 <strong>Live Demo</strong> — Drag guests from the sidebar onto the tables to seat them. Add or remove tables freely. No account needed.
        &nbsp;&nbsp;
        <a
          href="/auth/signup"
          style={{ color: "#fff", textDecoration: "underline", fontWeight: 700 }}
        >
          Sign up free →
        </a>
      </div>

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
    </div>
  );
}
