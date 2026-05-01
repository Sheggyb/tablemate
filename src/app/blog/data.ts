export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tag: "Tips" | "Guide" | "Inspiration";
  content: string; // HTML string
}

export const posts: BlogPost[] = [
  {
    slug: "perfect-wedding-seating-chart",
    title: "How to Create the Perfect Wedding Seating Chart",
    excerpt:
      "A step-by-step guide to planning your wedding seating chart — from grouping guests to finalising table layouts without the stress.",
    date: "April 28, 2026",
    readingTime: "6 min read",
    tag: "Guide",
    content: `
<h2>Why Your Seating Chart Matters More Than You Think</h2>
<p>The wedding seating chart is one of the most overlooked — and most stressful — parts of wedding planning. Done well, it sets the mood for the entire reception. Done poorly, it can lead to awkward silences, family drama, and a catering team scrambling to figure out who ordered the salmon.</p>
<p>The good news? With the right approach and the right wedding seating chart tips, you can turn what feels like a puzzle into a genuinely enjoyable process. Let's walk through it step by step.</p>

<h2>Step 1: Finalise Your Guest List First</h2>
<p>Before you touch a table layout, you need a confirmed headcount. Seating charts built on "maybes" fall apart fast. Collect RSVPs early — ideally 4–6 weeks before the wedding — and don't start detailed seating until you have at least 90% of responses in.</p>
<p>Use a spreadsheet or a dedicated tool to track each guest's meal choice, dietary restrictions, and any +1 details. This data becomes critical when you start assigning seats.</p>

<h2>Step 2: Choose Your Table Layout</h2>
<p>Decide on table shapes and sizes before you start seating people. Common options include:</p>
<ul>
  <li><strong>Round tables (8–10 guests):</strong> Great for conversation, classic wedding look</li>
  <li><strong>Long banquet tables (10–14 guests):</strong> Trendy, family-style feel</li>
  <li><strong>Square tables (4–6 guests):</strong> Intimate, ideal for smaller receptions</li>
</ul>
<p>Your venue will have constraints — fire exits, pillars, dance floor size — so confirm the floor plan before locking anything in.</p>

<h2>Step 3: Seat the VIPs First</h2>
<p>Start with your nearest and dearest: immediate family, the wedding party, and close friends. Place these tables closest to the dance floor and head table so the energy stays high throughout the night.</p>
<p>Consider the head table arrangement carefully. A sweetheart table (just the couple) is low-stress and very romantic. A full wedding party table looks impressive but can feel performative. A mix — couple plus parents — is increasingly popular.</p>

<h2>Step 4: Group Guests Thoughtfully</h2>
<p>The golden rule of seating: seat people with someone they know or will naturally connect with. Some wedding seating chart tips that consistently work:</p>
<ul>
  <li>Group guests by relationship (school friends, work colleagues, family sides)</li>
  <li>Mix ages within groups where it feels natural — grandparents next to young cousins can be charming</li>
  <li>Keep children near their parents unless you have a dedicated kids' table with supervision</li>
  <li>Seat guests with mobility issues near entrances and restrooms</li>
</ul>

<h2>Step 5: Handle Tricky Situations Gracefully</h2>
<p>Every wedding has at least one complicated dynamic — divorced parents, estranged relatives, or the colleague who doesn't know anyone. Here's how to handle the most common scenarios:</p>
<h3>Divorced or Separated Parents</h3>
<p>Seat them at separate tables, ideally with their own support networks (new partners, close friends). Don't place them where they'll be in each other's eyeline all night.</p>
<h3>The Solo Guest Who Knows No One</h3>
<p>Seat them with other sociable guests or people with shared interests. A table of fellow book-lovers, sports fans, or travel enthusiasts can turn a stranger into a friend by dessert.</p>
<h3>The Feuding Relatives</h3>
<p>Keep them on opposite sides of the room. If the venue is small, consider the "buffer table" strategy — a table of mutual acquaintances seated between them.</p>

<h2>Step 6: Review and Refine</h2>
<p>Once you have a first draft, step away for 24 hours, then review it fresh. Walk through the night in your head: who will your guests talk to during cocktail hour? Who sits next to the shy cousin? Does the table of boisterous uni friends end up right next to the elderly grandparents?</p>
<p>Get a second opinion from your partner or maid of honour — they'll catch blind spots you've missed.</p>

<h2>Use a Tool Built for Seating Charts</h2>
<p>A spreadsheet gets the job done, but it doesn't let you see the whole picture. A drag-and-drop seating chart tool lets you visualise the room, spot problems instantly, and make changes without copy-pasting rows.</p>

<div class="cta-box">
  <p><strong>Ready to build your perfect seating chart?</strong> TableMate is a professional wedding seating chart planner with drag-and-drop tables, RSVP collection, and beautiful printable exports. <a href="/signup">Try TableMate →</a></p>
</div>
    `,
  },
  {
    slug: "free-vs-paid-wedding-planning-tools",
    title: "Free vs Paid Wedding Planning Tools: What You Actually Need",
    excerpt:
      "Overwhelmed by wedding planning apps? Here's an honest breakdown of which free tools are worth your time — and when a paid upgrade actually makes sense.",
    date: "April 21, 2026",
    readingTime: "5 min read",
    tag: "Tips",
    content: `
<h2>The Wedding Planning Tool Trap</h2>
<p>Open any wedding planning forum and you'll find couples drowning in app recommendations: budget trackers, vendor directories, timeline tools, seating chart builders, and RSVP managers — often across a dozen different platforms. The question isn't whether free wedding planning tools exist (they do, in abundance). The question is: which ones are actually worth using?</p>
<p>This guide gives you an honest, no-affiliate breakdown of the free tools that genuinely deliver, and the specific scenarios where a paid upgrade is worth every penny.</p>

<h2>Free Tools That Actually Work</h2>

<h3>Guest List & RSVP: Free Tier Tools</h3>
<p>For most couples, free RSVP tools are completely sufficient. The key features you need at zero cost:</p>
<ul>
  <li>Custom RSVP link per guest</li>
  <li>Meal preference collection</li>
  <li>Dietary restriction tracking</li>
  <li>Automated reminders</li>
</ul>
<p>TableMate covers full RSVP functionality with drag-and-drop seating for any wedding size.</p>

<h3>Budget Tracking: Google Sheets Wins</h3>
<p>For budget tracking, a well-structured Google Sheet beats most dedicated apps. The reason: wedding budgets are deeply personal and variable. Generic apps often force you into categories that don't match your priorities. A spreadsheet lets you track exactly what matters to you.</p>
<p>Download a free wedding budget template (there are dozens of excellent ones), customise the categories, and you're done. No subscription, no data lock-in.</p>

<h3>Vendor Research: Use What You Already Have</h3>
<p>Google, Instagram, and TikTok are your best free vendor research tools — not because they're comprehensive, but because they show you real work, real reviews, and real price signals. Paid vendor directories often surface vendors who pay for placement, not necessarily the best fit for your wedding.</p>

<h3>Timeline & Day-Of Coordination: Free Templates</h3>
<p>A shared Google Doc or Notion template handles day-of timelines beautifully. If you have a wedding planner, they'll likely have their own system. If you're self-planning, a two-column table (time | action/responsible person) is all you need.</p>

<h2>When a Paid Tool Is Worth It</h2>

<h3>Large Guest Lists (100+ Guests)</h3>
<p>This is the biggest inflection point for free wedding planning tools. Managing 150+ RSVPs, meal preferences, table assignments, and plus-one logistics in a spreadsheet becomes genuinely painful at scale. A paid seating tool with bulk import, smart auto-assign, and real-time collaboration saves hours — and prevents expensive mistakes like double-booking seats.</p>

<h3>Multiple Venues or Floors</h3>
<p>If your reception spans multiple rooms or floors, you need a tool that can handle multiple floor plans simultaneously. This is almost always a paid feature — and worth it for the visual clarity alone.</p>

<h3>Real-Time Collaboration</h3>
<p>Planning with a partner in a different city, or working closely with a wedding planner? Real-time collaborative editing (think Google Docs, but for seating charts) is a paid feature in most tools — and it eliminates the "who has the latest version?" problem completely.</p>

<h3>Professional Exports</h3>
<p>Printable seating charts, place card sheets, and caterer-ready guest lists in PDF format are worth paying for when you factor in the time saved on formatting. A polished export also impresses vendors and venue coordinators.</p>

<h2>The Honest Recommendation</h2>
<p>Start free, upgrade only when you hit a real limitation. Most couples can plan a beautiful wedding using free tools for 80% of their tasks. The 20% where paid tools earn their cost: large guest management, seating chart visualisation, and professional-quality exports.</p>

<div class="cta-box">
  <p><strong>Plan your wedding with TableMate</strong> — drag-and-drop seating, RSVP collection, meal tracking, and printable exports. <a href="/signup">Start planning →</a></p>
</div>
    `,
  },
  {
    slug: "wedding-seating-mistakes",
    title: "10 Common Wedding Seating Mistakes to Avoid",
    excerpt:
      "From forgetting dietary needs to seating feuding relatives side by side — here are the most common wedding seating mistakes couples make, and how to avoid every one.",
    date: "April 14, 2026",
    readingTime: "7 min read",
    tag: "Tips",
    content: `
<h2>The Stakes Are Higher Than You Think</h2>
<p>Your guests will spend more time at their seats than almost anywhere else at your wedding. A great seating arrangement fades into the background — guests mingle, laugh, eat well, and dance. A poor one creates awkward silences, hurt feelings, and stories that get retold for years. Here are the ten wedding seating mistakes couples make most often — and exactly how to avoid them.</p>

<h3>Mistake #1: Starting Too Late</h3>
<p>Most couples underestimate how long seating takes. Even with a modest guest list of 80 people, creating a thoughtful seating plan takes 4–6 hours across multiple drafts. Start as soon as RSVPs close — don't leave it for the week before the wedding.</p>

<h3>Mistake #2: Building the Chart Before RSVPs Are Confirmed</h3>
<p>It's tempting to start early, but a seating chart built on assumptions requires complete rebuilding when late RSVPs come in. Wait until you have at least 90% of responses confirmed. The final 10% can be slotted in around an existing structure without major disruption.</p>

<h3>Mistake #3: Ignoring Dietary Restrictions</h3>
<p>One of the most common and costly wedding seating mistakes: forgetting to cross-reference seating with meal choices. If your caterer is serving plated meals, your front-of-house team needs to know who ordered what before guests sit down. A seating chart that doesn't include meal data creates chaos in the kitchen and delays service.</p>

<h3>Mistake #4: Seating Estranged Family Members Near Each Other</h3>
<p>You know your family dynamics better than anyone. Don't hope for the best — plan for the worst. Even if two relatives are "civil," seating them side by side for a four-hour dinner is a risk. Use the "diagonal rule": estranged guests should be on opposite sides and ideally out of direct sightlines.</p>

<h3>Mistake #5: Forgetting Accessibility Needs</h3>
<p>Guests with mobility issues, hearing impairments, or visual impairments need specific accommodations. Wheelchair users need aisle seats with extra space. Guests with hearing loss benefit from sitting closer to the speeches. Always ask during RSVP collection and account for these needs in your layout.</p>

<h3>Mistake #6: Isolating Solo Guests</h3>
<p>The "singles table" is a wedding seating mistake that refuses to die. Grouping all your unattached guests together because it's "easier" often backfires — it feels conspicuous and uncomfortable for everyone at that table. Instead, seat solo guests with people who share their interests or profession. A natural conversation starter goes further than a forced demographic grouping.</p>

<h3>Mistake #7: Ignoring Children's Needs</h3>
<p>Children need to be near their parents — full stop. The exception is a well-supervised dedicated kids' table with activities, but this requires coordination with parents and usually an adult minder. A child seated far from their parents will spend the night crying or wandering, disrupting everyone nearby.</p>

<h3>Mistake #8: Undersizing Tables</h3>
<p>Cramming ten people around a table built for eight creates an uncomfortable, noisy dinner and gives your caterer headaches. Always confirm maximum capacity with your venue and stay at least one person under the maximum. Guests should be able to reach their wine glass without elbowing their neighbour.</p>

<h3>Mistake #9: Not Communicating Changes to Your Caterer</h3>
<p>Last-minute seating changes happen — a plus-one cancels, a family member arrives unexpectedly. Have a clear protocol for communicating changes to your venue coordinator and catering team. Designate one person (ideally your wedding planner or a trusted bridesmaid) as the point of contact for day-of changes.</p>

<h3>Mistake #10: Not Having a Backup Plan</h3>
<p>Even the best-planned seating chart encounters problems on the day. Print multiple copies of the final chart. Have a list of "flexible" seats that can absorb unexpected additions. Brief your front-of-house lead on any sensitive arrangements so they can handle issues discreetly.</p>

<h2>The Easiest Fix: Use a Visual Tool</h2>
<p>Most of these wedding seating mistakes are easy to spot — but only when you can see the full picture. A visual, drag-and-drop seating tool lets you check for dietary conflicts, accessibility issues, and awkward pairings at a glance. Changes that would take 20 minutes in a spreadsheet take 30 seconds when you can simply drag a name to a new seat.</p>

<div class="cta-box">
  <p><strong>Avoid every one of these mistakes with TableMate.</strong> Our professional wedding seating chart planner includes RSVP collection, meal tracking, and drag-and-drop layout tools — so you can see and fix problems before the big day. <a href="/signup">Try TableMate →</a></p>
</div>
    `,
  },
  {
    slug: "wedding-table-decorations-guide",
    title: "Wedding Table Decoration Ideas That Wow Without Breaking the Budget",
    excerpt:
      "Beautiful table settings don't have to cost a fortune. Discover creative, budget-friendly decoration ideas for every wedding style.",
    date: "April 7, 2026",
    readingTime: "5 min read",
    tag: "Inspiration",
    content: `<p>Coming soon.</p>`,
  },
  {
    slug: "wedding-venue-checklist",
    title: "The Ultimate Wedding Venue Checklist (25 Questions to Ask Before You Book)",
    excerpt:
      "Don't sign a venue contract until you've asked these 25 essential questions. Covers capacity, catering, accessibility, and hidden costs.",
    date: "March 31, 2026",
    readingTime: "8 min read",
    tag: "Guide",
    content: `<p>Coming soon.</p>`,
  },
  {
    slug: "wedding-guest-list-tips",
    title: "How to Cut Your Wedding Guest List Without the Drama",
    excerpt:
      "Trimming the guest list is one of the hardest parts of wedding planning. Here's a clear, compassionate framework for making the tough calls.",
    date: "March 24, 2026",
    readingTime: "5 min read",
    tag: "Tips",
    content: `<p>Coming soon.</p>`,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
