import type { Table, Guest } from "@/lib/types";
import type { ExportTheme } from "@/lib/exportThemes";

// ─── Types & Helpers ─────────────────────────────────────────────────────────

type RGB = [number, number, number];

const MEAL_LABEL: Record<string, string> = {
  standard: "Standard", vegetarian: "Vegetarian", vegan: "Vegan",
  "gluten-free": "Gluten-Free", halal: "Halal", kosher: "Kosher",
  children: "Children's", chicken: "Chicken", fish: "Fish",
};
function mealLabel(m?: string | null) { return m ? (MEAL_LABEL[m] ?? m) : ""; }
function guestName(g: Guest) { return `${g.first_name} ${g.last_name ?? ""}`.trim(); }

type Doc = ReturnType<InstanceType<typeof import("jspdf")["jsPDF"]>["addPage"]> extends never
  ? never
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : any;

// ─── Shared Layout ───────────────────────────────────────────────────────────

function drawBg(doc: Doc, t: ExportTheme, w: number, h: number) {
  doc.setFillColor(...(t.bg as RGB));
  doc.rect(0, 0, w, h, "F");
}

function drawHeader(doc: Doc, t: ExportTheme, title: string, subtitle: string, w: number, ml: number, mr: number): number {
  drawBg(doc, t, w, 297);

  // Triple rule
  doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.25);
  doc.line(ml, 10, w - mr, 10);
  doc.setDrawColor(...(t.accent as RGB)); doc.setLineWidth(0.8);
  doc.line(ml, 12.5, w - mr, 12.5);
  doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.25);
  doc.line(ml, 14, w - mr, 14);

  // Title in serif
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...(t.text as RGB));
  doc.text(title, w / 2, 30, { align: "center" });

  // Subtitle in italic serif
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...(t.muted as RGB));
  doc.text(subtitle, w / 2, 40, { align: "center" });

  // Triple rule bottom
  doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.25);
  doc.line(ml, 46, w - mr, 46);
  doc.setDrawColor(...(t.accent as RGB)); doc.setLineWidth(0.8);
  doc.line(ml, 47.5, w - mr, 47.5);
  doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.25);
  doc.line(ml, 49, w - mr, 49);

  return 60;
}

function drawFooters(doc: Doc, t: ExportTheme, label: string, w: number, h: number, ml: number, mr: number) {
  const total = (doc as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.25);
    doc.line(ml, h - 12, w - mr, h - 12);
    doc.setFont("times", "italic"); doc.setFontSize(7); doc.setTextColor(...(t.muted as RGB));
    doc.text(label, ml, h - 7);
    doc.text(`${p} / ${total}`, w - mr, h - 7, { align: "right" });
  }
}

function sectionBar(doc: Doc, t: ExportTheme, label: string, y: number, ml: number, cw: number): number {
  doc.setFillColor(...(t.accentLight as RGB));
  doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.2);
  doc.roundedRect(ml, y, cw, 8.5, 1, 1, "FD");
  // left accent bar
  doc.setFillColor(...(t.accent as RGB));
  doc.rect(ml, y, 2.5, 8.5, "F");
  doc.setFont("times", "bold"); doc.setFontSize(9); doc.setTextColor(...(t.text as RGB));
  doc.text(label.toUpperCase(), ml + 6, y + 6);
  return y + 13;
}

// ─── 1. Seating Chart PDF ────────────────────────────────────────────────────
// Grouped by table — each table is a section with its guests listed below

export async function exportSeatingChartPDF(
  weddingName: string,
  tables: Table[],
  guests: Guest[],
  theme: ExportTheme,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const t = theme;
  const PAGE_W = 210, PAGE_H = 297, ML = 16, MR = 16;
  const CW = PAGE_W - ML - MR;
  const COL_GAP = 6;
  const colW = (CW - COL_GAP) / 2;

  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  let y = drawHeader(doc, t, weddingName, `Seating Chart · ${dateStr}`, PAGE_W, ML, MR);

  // Stats row
  const seated = guests.filter(g => !!g.table_id).length;
  const stats = [
    { label: "Tables",   val: String(tables.length) },
    { label: "Guests",   val: String(guests.length) },
    { label: "Seated",   val: String(seated) },
    { label: "Unseated", val: String(guests.length - seated) },
  ];
  const bw = CW / 4;
  stats.forEach((s, i) => {
    const bx = ML + i * bw;
    doc.setFillColor(...(t.surface as RGB));
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.2);
    doc.roundedRect(bx + 0.5, y, bw - 1, 16, 1.5, 1.5, "FD");
    doc.setFont("times", "bold"); doc.setFontSize(13); doc.setTextColor(...(t.accent as RGB));
    doc.text(s.val, bx + bw / 2, y + 8, { align: "center" });
    doc.setFont("times", "normal"); doc.setFontSize(7); doc.setTextColor(...(t.muted as RGB));
    doc.text(s.label, bx + bw / 2, y + 13.5, { align: "center" });
  });
  y += 22;

  // Build two columns of table blocks
  // Collect table blocks: { header height + rows }
  const ROW_H = 7;
  const HEADER_H = 10;
  const TABLE_GAP = 5;

  type TableBlock = { table: Table; tableGuests: Guest[] };
  const blocks: TableBlock[] = tables.map(tbl => ({
    table: tbl,
    tableGuests: [...guests]
      .filter(g => g.table_id === tbl.id)
      .sort((a, b) => (a.last_name ?? a.first_name).localeCompare(b.last_name ?? b.first_name)),
  }));

  // Split blocks into two columns (left-right balanced by total rows)
  const leftBlocks: TableBlock[] = [];
  const rightBlocks: TableBlock[] = [];
  let leftHeight = 0, rightHeight = 0;
  for (const b of blocks) {
    const bh = HEADER_H + Math.max(b.tableGuests.length, 1) * ROW_H + TABLE_GAP;
    if (leftHeight <= rightHeight) { leftBlocks.push(b); leftHeight += bh; }
    else { rightBlocks.push(b); rightHeight += bh; }
  }

  const drawTableBlock = (b: TableBlock, col: number, startY: number): number => {
    const x = col === 0 ? ML : ML + colW + COL_GAP;
    let cy = startY;

    // Table header bar
    doc.setFillColor(...(t.accentLight as RGB));
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.2);
    doc.roundedRect(x, cy, colW, HEADER_H, 1.5, 1.5, "FD");
    // accent left strip
    doc.setFillColor(...(t.accent as RGB));
    doc.rect(x, cy, 3, HEADER_H, "F");
    doc.setFont("times", "bold"); doc.setFontSize(9.5); doc.setTextColor(...(t.text as RGB));
    doc.text(b.table.name, x + 7, cy + 6.5);
    doc.setFont("times", "italic"); doc.setFontSize(7.5); doc.setTextColor(...(t.muted as RGB));
    doc.text(`${b.tableGuests.length} / ${b.table.capacity}`, x + colW - 2, cy + 6.5, { align: "right" });
    cy += HEADER_H;

    if (b.tableGuests.length === 0) {
      doc.setFont("times", "italic"); doc.setFontSize(7.5); doc.setTextColor(...(t.muted as RGB));
      doc.text("No guests assigned", x + 4, cy + 5);
      cy += ROW_H;
    } else {
      b.tableGuests.forEach((g, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(...(t.surface as RGB));
          doc.rect(x, cy, colW, ROW_H, "F");
        }
        // small dot
        doc.setFillColor(...(t.accent as RGB));
        doc.circle(x + 4, cy + ROW_H / 2, 1, "F");
        doc.setFont("times", "normal"); doc.setFontSize(8.5); doc.setTextColor(...(t.text as RGB));
        doc.text(guestName(g), x + 8, cy + 5);
        if (g.meal && g.meal !== "standard") {
          doc.setFont("times", "italic"); doc.setFontSize(7); doc.setTextColor(...(t.muted as RGB));
          doc.text(mealLabel(g.meal), x + colW - 2, cy + 5, { align: "right" });
        }
        cy += ROW_H;
      });
    }

    return cy + TABLE_GAP;
  };

  // Render two columns in parallel, paginating each independently
  let lY = y, rY = y;
  let lI = 0, rI = 0;
  const newPage = () => {
    doc.addPage();
    drawBg(doc, t, PAGE_W, PAGE_H);
    return 20;
  };

  while (lI < leftBlocks.length || rI < rightBlocks.length) {
    if (lI < leftBlocks.length) {
      const b = leftBlocks[lI];
      const bh = HEADER_H + Math.max(b.tableGuests.length, 1) * ROW_H + TABLE_GAP;
      if (lY + bh > PAGE_H - 18) { lY = newPage(); rY = lY; }
      lY = drawTableBlock(b, 0, lY);
      lI++;
    }
    if (rI < rightBlocks.length) {
      const b = rightBlocks[rI];
      const bh = HEADER_H + Math.max(b.tableGuests.length, 1) * ROW_H + TABLE_GAP;
      if (rY + bh > PAGE_H - 18) { rY = newPage(); lY = rY; }
      rY = drawTableBlock(b, 1, rY);
      rI++;
    }
  }

  drawFooters(doc, t, `${weddingName} — Seating Chart`, PAGE_W, PAGE_H, ML, MR);
  doc.save(`seating-chart-${weddingName.replace(/\s+/g, "-")}.pdf`);
}

// ─── 3. Place Cards PDF ──────────────────────────────────────────────────────
// Proper printable tent-fold place cards — 4 per A4 page

export async function exportPlaceCardsPDF(
  weddingName: string,
  tables: Table[],
  guests: Guest[],
  theme: ExportTheme,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const t = theme;
  const PAGE_W = 210, PAGE_H = 297;

  const confirmed = guests.filter(g => g.rsvp !== "declined");

  // Each card: 88mm × 60mm — 2 per row, 2 rows = 4 per page with bleed lines
  const CARD_W = 88, CARD_H = 60;
  const COL_GAP = (PAGE_W - 2 * CARD_W) / 3; // equal margins
  const ROW_GAP = (PAGE_H - 2 * CARD_H) / 3;

  const positions = [
    { x: COL_GAP, y: ROW_GAP },
    { x: COL_GAP * 2 + CARD_W, y: ROW_GAP },
    { x: COL_GAP, y: ROW_GAP * 2 + CARD_H },
    { x: COL_GAP * 2 + CARD_W, y: ROW_GAP * 2 + CARD_H },
  ];

  let slot = 0;
  drawBg(doc, t, PAGE_W, PAGE_H);

  confirmed.forEach((g, idx) => {
    if (slot === 4) {
      doc.addPage();
      drawBg(doc, t, PAGE_W, PAGE_H);
      slot = 0;
    }

    const pos = positions[slot];
    const { x, y } = pos;

    // Cut guide lines (very faint)
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.15);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).setLineDashPattern([1, 2], 0);
    doc.rect(x, y, CARD_W, CARD_H, "D");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).setLineDashPattern([], 0);

    // Card background
    doc.setFillColor(...(t.white as RGB));
    doc.setDrawColor(...(t.accent as RGB)); doc.setLineWidth(0.5);
    doc.roundedRect(x + 1, y + 1, CARD_W - 2, CARD_H - 2, 2, 2, "FD");

    // Fold line (center dashed)
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).setLineDashPattern([1.5, 1.5], 0);
    doc.line(x + 3, y + CARD_H / 2, x + CARD_W - 3, y + CARD_H / 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).setLineDashPattern([], 0);

    // Top half: decorative accent bar
    doc.setFillColor(...(t.accentLight as RGB));
    doc.roundedRect(x + 1, y + 1, CARD_W - 2, CARD_H / 2 - 1, 2, 0, "F");

    // Accent top line
    doc.setFillColor(...(t.accent as RGB));
    doc.rect(x + 1, y + 1, CARD_W - 2, 2.5, "F");

    // Bottom half: name area
    // Guest name — large, centered
    doc.setFont("times", "bold");
    const nameSize = guestName(g).length > 20 ? 13 : 16;
    doc.setFontSize(nameSize);
    doc.setTextColor(...(t.text as RGB));
    doc.text(guestName(g), x + CARD_W / 2, y + CARD_H / 2 + 11, { align: "center" });

    // Table name
    const tbl = tables.find(tt => tt.id === g.table_id);
    doc.setFont("times", "italic"); doc.setFontSize(9); doc.setTextColor(...(t.accent as RGB));
    doc.text(tbl ? tbl.name : "Unseated", x + CARD_W / 2, y + CARD_H / 2 + 20, { align: "center" });

    // Meal (if not standard)
    if (g.meal && g.meal !== "standard") {
      doc.setFont("times", "normal"); doc.setFontSize(7.5); doc.setTextColor(...(t.muted as RGB));
      doc.text(mealLabel(g.meal), x + CARD_W / 2, y + CARD_H / 2 + 27, { align: "center" });
    }

    // Wedding name in top half (small)
    doc.setFont("times", "italic"); doc.setFontSize(7); doc.setTextColor(...(t.muted as RGB));
    doc.text(weddingName, x + CARD_W / 2, y + CARD_H / 4 + 3, { align: "center" });

    slot++;
    void idx;
  });

  drawFooters(doc, t, `${weddingName} — Place Cards · Cut along dotted lines`, PAGE_W, PAGE_H, 8, 8);
  doc.save(`place-cards-${weddingName.replace(/\s+/g, "-")}.pdf`);
}

// ─── 4. Escort Cards PDF ─────────────────────────────────────────────────────
// Alphabetical A–Z guest list with table assignments — displayed at venue entrance

export async function exportEscortCardsPDF(
  weddingName: string,
  tables: Table[],
  guests: Guest[],
  theme: ExportTheme,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const t = theme;
  const PAGE_W = 210, PAGE_H = 297, ML = 16, MR = 16;
  const CW = PAGE_W - ML - MR;
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  let y = drawHeader(doc, t, weddingName, `Please find your seat · ${dateStr}`, PAGE_W, ML, MR);

  // Group guests by first letter of last name
  const sorted = [...guests].filter(g => !!g.table_id).sort((a, b) => {
    const la = (a.last_name ?? a.first_name).toLowerCase();
    const lb = (b.last_name ?? b.first_name).toLowerCase();
    return la < lb ? -1 : la > lb ? 1 : 0;
  });

  let currentLetter = "";
  const ROW_H = 7.5;

  for (const g of sorted) {
    const letter = (g.last_name?.[0] ?? g.first_name[0]).toUpperCase();

    if (y + ROW_H + 12 > PAGE_H - 16) {
      doc.addPage();
      drawBg(doc, t, PAGE_W, PAGE_H);
      y = 20;
    }

    if (letter !== currentLetter) {
      currentLetter = letter;
      y += 3;
      // Letter divider
      doc.setFont("times", "bold"); doc.setFontSize(9); doc.setTextColor(...(t.accent as RGB));
      doc.text(letter, ML, y + 5);
      doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.2);
      doc.line(ML + 7, y + 3.5, ML + CW, y + 3.5);
      y += 8;
    }

    // Row background
    doc.setFillColor(...(t.surface as RGB));
    doc.rect(ML, y, CW, ROW_H, "F");

    // Guest name
    doc.setFont("times", "normal"); doc.setFontSize(9); doc.setTextColor(...(t.text as RGB));
    doc.text(guestName(g), ML + 4, y + 5.3);

    // Table name — right aligned
    const tbl = tables.find(tt => tt.id === g.table_id);
    doc.setFont("times", "bold"); doc.setFontSize(8.5); doc.setTextColor(...(t.accent as RGB));
    doc.text(tbl?.name ?? "—", ML + CW - 2, y + 5.3, { align: "right" });

    // Subtle separator line
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.1);
    doc.line(ML, y + ROW_H, ML + CW, y + ROW_H);

    y += ROW_H;
  }

  drawFooters(doc, t, `${weddingName} — Escort Card List`, PAGE_W, PAGE_H, ML, MR);
  doc.save(`escort-cards-${weddingName.replace(/\s+/g, "-")}.pdf`);
}

// ─── 5. Table Cards PDF ──────────────────────────────────────────────────────
// Elegant per-table guest list cards

export async function exportTableCardsPDF(
  weddingName: string,
  tables: Table[],
  guests: Guest[],
  theme: ExportTheme,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const t = theme;
  const PAGE_W = 210, PAGE_H = 297, ML = 16, MR = 16;
  const CW = PAGE_W - ML - MR;
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  let y = drawHeader(doc, t, weddingName, `Table Cards · ${dateStr}`, PAGE_W, ML, MR);

  for (const tbl of tables) {
    const tg = guests.filter(g => g.table_id === tbl.id);
    const cardH = 16 + Math.max(tg.length, 1) * 7.5 + 8;

    if (y + cardH > PAGE_H - 18) {
      doc.addPage();
      drawBg(doc, t, PAGE_W, PAGE_H);
      y = 20;
    }

    // Card background
    doc.setFillColor(...(t.white as RGB));
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.4);
    doc.roundedRect(ML, y, CW, cardH, 2.5, 2.5, "FD");

    // Accent left bar
    doc.setFillColor(...(t.accent as RGB));
    doc.roundedRect(ML, y, 4, cardH, 2, 0, "F");
    doc.rect(ML + 2, y, 2, cardH, "F");

    // Table name header
    doc.setFont("times", "bold"); doc.setFontSize(13); doc.setTextColor(...(t.text as RGB));
    doc.text(tbl.name, ML + 10, y + 10);

    // Capacity
    doc.setFont("times", "italic"); doc.setFontSize(8.5); doc.setTextColor(...(t.muted as RGB));
    doc.text(`${tg.length} of ${tbl.capacity} seats`, ML + CW - 3, y + 10, { align: "right" });

    // Divider
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.2);
    doc.line(ML + 8, y + 14, ML + CW - 3, y + 14);

    let gy = y + 18;
    if (tg.length === 0) {
      doc.setFont("times", "italic"); doc.setFontSize(8); doc.setTextColor(...(t.muted as RGB));
      doc.text("No guests assigned", ML + 10, gy + 3);
    } else {
      tg.forEach((g, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(...(t.surface as RGB));
          doc.rect(ML + 5, gy, CW - 8, 7.5, "F");
        }
        // Seat dot
        doc.setFillColor(...(t.accent as RGB));
        doc.circle(ML + 9, gy + 3.8, 1.2, "F");

        doc.setFont("times", "normal"); doc.setFontSize(9); doc.setTextColor(...(t.text as RGB));
        doc.text(guestName(g), ML + 13, gy + 5.3);

        if (g.meal && g.meal !== "standard") {
          doc.setFont("times", "italic"); doc.setFontSize(7.5); doc.setTextColor(...(t.muted as RGB));
          doc.text(mealLabel(g.meal), ML + CW - 5, gy + 5.3, { align: "right" });
        }
        gy += 7.5;
      });
    }

    y += cardH + 6;
  }

  drawFooters(doc, t, `${weddingName} — Table Cards`, PAGE_W, PAGE_H, ML, MR);
  doc.save(`table-cards-${weddingName.replace(/\s+/g, "-")}.pdf`);
}

// ─── 6. Kitchen Sheet PDF ────────────────────────────────────────────────────

export async function exportKitchenSheetPDF(
  weddingName: string,
  tables: Table[],
  guests: Guest[],
  theme: ExportTheme,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const t = theme;
  const PAGE_W = 210, PAGE_H = 297, ML = 16, MR = 16;
  const CW = PAGE_W - ML - MR;
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  let y = drawHeader(doc, t, weddingName, `Kitchen Sheet · ${dateStr}`, PAGE_W, ML, MR);

  const confirmed = guests.filter(g => g.rsvp !== "declined");
  const mealGroups = confirmed.reduce<Record<string, Guest[]>>((acc, g) => {
    const m = g.meal || "standard";
    if (!acc[m]) acc[m] = [];
    acc[m].push(g);
    return acc;
  }, {});

  // Summary totals
  y = sectionBar(doc, t, "Meal Summary", y, ML, CW);
  doc.setFont("times", "bold"); doc.setFontSize(9); doc.setTextColor(...(t.text as RGB));
  doc.text(`Total confirmed: ${confirmed.length} guests`, ML + 3, y); y += 8;

  Object.entries(mealGroups).sort((a, b) => b[1].length - a[1].length).forEach(([meal, list], idx) => {
    if (y > PAGE_H - 20) { doc.addPage(); drawBg(doc, t, PAGE_W, PAGE_H); y = 20; }
    if (idx % 2 === 0) { doc.setFillColor(...(t.surface as RGB)); doc.rect(ML, y, CW, 8, "F"); }

    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.15);
    doc.rect(ML, y, CW, 8, "D");

    doc.setFont("times", "bold"); doc.setFontSize(9); doc.setTextColor(...(t.text as RGB));
    doc.text(mealLabel(meal) || meal, ML + 4, y + 5.5);
    doc.setFont("times", "bold"); doc.setFontSize(13); doc.setTextColor(...(t.accent as RGB));
    doc.text(String(list.length), ML + 65, y + 5.5, { align: "center" });
    const names = list.map(g => guestName(g)).join(", ");
    const wrapped = doc.splitTextToSize(names, CW - 80);
    doc.setFont("times", "normal"); doc.setFontSize(7.5); doc.setTextColor(...(t.muted as RGB));
    doc.text(wrapped[0] + (wrapped.length > 1 ? "…" : ""), ML + 78, y + 5.5);
    y += 9;
  });

  y += 8;

  // Detailed breakdown per meal
  Object.entries(mealGroups).forEach(([meal, list]) => {
    if (y > PAGE_H - 30) { doc.addPage(); drawBg(doc, t, PAGE_W, PAGE_H); y = 20; }
    y = sectionBar(doc, t, `${mealLabel(meal) || meal} — ${list.length} guests`, y, ML, CW);
    list.forEach((g, idx) => {
      if (y > PAGE_H - 16) { doc.addPage(); drawBg(doc, t, PAGE_W, PAGE_H); y = 20; }
      if (idx % 2 === 0) { doc.setFillColor(...(t.surface as RGB)); doc.rect(ML, y, CW, 7, "F"); }
      doc.setFont("times", "normal"); doc.setFontSize(9); doc.setTextColor(...(t.text as RGB));
      doc.text(guestName(g), ML + 6, y + 5);
      if (g.table_id) {
        const tbl = tables.find(tt => tt.id === g.table_id);
        doc.setFont("times", "italic"); doc.setFontSize(8); doc.setTextColor(...(t.muted as RGB));
        doc.text(tbl?.name ?? "—", ML + CW - 2, y + 5, { align: "right" });
      }
      y += 7;
    });
    doc.setDrawColor(...(t.border as RGB)); doc.setLineWidth(0.2);
    doc.line(ML, y, ML + CW, y); y += 6;
  });

  drawFooters(doc, t, `${weddingName} — Kitchen Sheet`, PAGE_W, PAGE_H, ML, MR);
  doc.save(`kitchen-sheet-${weddingName.replace(/\s+/g, "-")}.pdf`);
}
