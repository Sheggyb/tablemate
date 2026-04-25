import type { Table, Guest } from "@/lib/types";

const MEAL_LABEL: Record<string, string> = {
  standard:     "Standard",
  vegetarian:   "Vegetarian",
  vegan:        "Vegan",
  "gluten-free":"Gluten-Free",
  halal:        "Halal",
  kosher:       "Kosher",
  children:     "Children's",
  chicken:      "Chicken",
  fish:         "Fish",
};

const ACCENT   = [201, 169, 110] as [number, number, number]; // warm gold
const DARK     = [51,  51,  51]  as [number, number, number];
const MUTED    = [120, 110, 100] as [number, number, number];
const LIGHT_BG = [252, 249, 245] as [number, number, number];
const WHITE    = [255, 255, 255] as [number, number, number];

export async function exportSeatingChartPDF(
  weddingName: string,
  tables: Table[],
  guests: Guest[],
): Promise<void> {
  // Dynamically import jsPDF so it stays client-side only
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 18; // margin left
  const MR = 18; // margin right
  const CONTENT_W = PAGE_W - ML - MR;
  let y = 0;

  // ── helpers ────────────────────────────────────────────────────────────────
  const newPage = () => {
    doc.addPage();
    y = 16;
    // subtle header rule on every page
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.4);
    doc.line(ML, 8, PAGE_W - MR, 8);
  };

  const checkY = (needed: number) => {
    if (y + needed > PAGE_H - 16) newPage();
  };

  // ── Cover header ───────────────────────────────────────────────────────────
  // Background stripe
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, PAGE_W, 52, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...WHITE);
  doc.text(weddingName, PAGE_W / 2, 22, { align: "center" });

  // Sub-title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(252, 244, 228);
  doc.text("Seating Chart", PAGE_W / 2, 32, { align: "center" });

  // Date generated
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  doc.setFontSize(8);
  doc.setTextColor(240, 230, 210);
  doc.text(`Generated on ${dateStr}`, PAGE_W / 2, 43, { align: "center" });

  y = 62;

  // ── Summary stats bar ──────────────────────────────────────────────────────
  const totalGuests   = guests.length;
  const seatedGuests  = guests.filter(g => !!g.table_id).length;
  const unseatedGuests= totalGuests - seatedGuests;

  const stats = [
    { label: "Tables",   value: tables.length },
    { label: "Guests",   value: totalGuests },
    { label: "Seated",   value: seatedGuests },
    { label: "Unassigned", value: unseatedGuests },
  ];

  const boxW = CONTENT_W / stats.length;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);

  stats.forEach((s, i) => {
    const bx = ML + i * boxW;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(bx + 1, y, boxW - 2, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...ACCENT);
    doc.text(String(s.value), bx + boxW / 2, y + 8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(s.label, bx + boxW / 2, y + 14, { align: "center" });
  });

  y += 26;

  // ── Section: Tables ────────────────────────────────────────────────────────
  // Section heading
  doc.setFillColor(...ACCENT);
  doc.rect(ML, y, CONTENT_W, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text("SEATING ARRANGEMENT BY TABLE", ML + 4, y + 5.5);
  y += 12;

  // Render each table
  for (const table of tables) {
    const tableGuests = guests.filter(g => g.table_id === table.id);
    const rowCount    = Math.max(tableGuests.length, 1);
    const blockHeight = 10 + rowCount * 7 + 4; // header + rows + padding

    checkY(blockHeight + 4);

    // Table header
    doc.setFillColor(245, 238, 225);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, CONTENT_W, 9, 1, 1, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(table.name, ML + 4, y + 6);

    const capacityLabel = `${tableGuests.length} / ${table.capacity} guests`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(capacityLabel, PAGE_W - MR - 2, y + 6, { align: "right" });

    y += 11;

    if (tableGuests.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("No guests assigned to this table", ML + 6, y + 4);
      y += 8;
    } else {
      tableGuests.forEach((guest, idx) => {
        checkY(7);
        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.setFillColor(250, 247, 242);
          doc.rect(ML, y, CONTENT_W, 6.5, "F");
        }

        const guestName = `${guest.first_name} ${guest.last_name ?? ""}`.trim();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);
        doc.text(guestName, ML + 6, y + 4.5);

        if (guest.meal && guest.meal !== "standard") {
          const mealText = MEAL_LABEL[guest.meal] ?? guest.meal;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(...MUTED);
          doc.text(mealText, PAGE_W - MR - 2, y + 4.5, { align: "right" });
        }

        y += 6.5;
      });
    }

    // Bottom border for table block
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.2);
    doc.line(ML, y, PAGE_W - MR, y);
    y += 5;
  }

  // ── Section: Unassigned guests ─────────────────────────────────────────────
  const unassigned = guests.filter(g => !g.table_id);

  if (unassigned.length > 0) {
    checkY(20);
    y += 4;

    doc.setFillColor(210, 180, 140);
    doc.rect(ML, y, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(`UNASSIGNED GUESTS (${unassigned.length})`, ML + 4, y + 5.5);
    y += 12;

    unassigned.forEach((guest, idx) => {
      checkY(7);
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(250, 247, 242);
        doc.rect(ML, y, CONTENT_W, 6.5, "F");
      }

      const guestName = `${guest.first_name} ${guest.last_name ?? ""}`.trim();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);
      doc.text(guestName, ML + 6, y + 4.5);

      if (guest.meal && guest.meal !== "standard") {
        const mealText = MEAL_LABEL[guest.meal] ?? guest.meal;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(mealText, PAGE_W - MR - 2, y + 4.5, { align: "right" });
      }

      y += 6.5;
    });

    doc.setDrawColor(210, 180, 140);
    doc.setLineWidth(0.2);
    doc.line(ML, y, PAGE_W - MR, y);
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.3);
    doc.line(ML, PAGE_H - 12, PAGE_W - MR, PAGE_H - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text("TableMate — Seating Chart", ML, PAGE_H - 7);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MR, PAGE_H - 7, { align: "right" });
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  doc.save("TableMate-Seating-Chart.pdf");
}
