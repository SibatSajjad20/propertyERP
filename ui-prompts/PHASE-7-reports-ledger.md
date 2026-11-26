# PHASE 7: Reports and client ledger

> Copy-paste this whole file into Cursor or Antigravity (agent mode) at the repo root `C:\Users\coco\Desktop\PropertyERP`. Run the phases in order, one at a time; earlier phases provide the tokens and primitives later ones use.

## Context

- Repo: `SibatSajjad20/propertyERP`, branch `feat/ux-perf-overhaul`. Local path: `C:\Users\coco\Desktop\PropertyERP`. Run `git pull` first.
- Stack: Next.js 16 App Router (cacheComponents), pnpm, Drizzle and postgres-js, Better Auth, Tailwind v4 (`src/styles/globals.css` plus `src/styles/tokens.css`), Radix primitives in `src/components/ui`, Phosphor icons, visx, TanStack Query and Table. Follow `AGENTS.md`.
- Approved mockups: `mockups/NN-name.png` in the repo root (1x and `@2x`). The mockup CSS source is `mockups/mockup-styles.css` (if it's missing, use the token table in Phase 1). Open the PNG for every screen you touch and match it.

## Ground rules (apply to every phase)

1. **Work end to end, no pause.** Briefly inspect the files listed below, then implement the whole phase, then run the acceptance checks and report the results. Do not stop to ask for approval.
2. **UI only.** Do not change server actions, DB schema, migrations, permissions, validation or business logic. Do not change existing queries unless this prompt names a **LIGHT READ-ONLY QUERY**. Any such query must be a single aggregate or a `limit`ed select, run in the existing `Promise.all` (never sequentially), and use `"use cache"` plus the existing `cacheTag`/`cacheLife` where the surrounding code already does. Never add N+1 loops. The performance work on this branch must not regress.
3. **No invented data.** Mockups use example numbers and names. Every value on screen must come from real data. If an element has no real source, omit it (this prompt lists which ones). Never hard-code sample figures, placeholder counts or fake activity.
4. **Keep it fast.** No new chart or animation libraries. Use plain SVG or the visx already installed. Lazy-load chart components with `next/dynamic` (`ssr:false` only if they are client-only) with a fixed-height placeholder so there is **no layout shift**. Do not add client components where a server component works. Keep the existing React Query `initialData` hydration pattern.
5. **Look and feel:** brand `#0B558B`, greys and white. No gradients, no glows, no decorative icons (nav and button icons only, Phosphor `regular`, 15–16px), no rainbow colours, no buzzword copy. Prefer hairline dividers and definition lists over stacks of boxed cards.
6. **Accessibility:** visible `:focus-visible` on every interactive element (token `--focus-ring`). Keyboard-reachable tabs, segmented controls, menus and the sidebar toggle. `aria-current="page"` on the active nav item. Status shown by colour also has a text label.
7. Keep existing behaviour, routes, URLs, permissions (`assertCan` / `visibleNav`) and test IDs. If an e2e selector breaks because the markup changed, update the selector, not the behaviour.

## Acceptance checks (run at the end and report)

- `pnpm typecheck`, `pnpm lint` and `pnpm test` all pass. Run `pnpm test:e2e` too if Playwright and the test DB are configured locally; if not, say so.
- `pnpm build` succeeds with no new warnings about dynamic usage or cache.
- Visual check: run the app, screenshot each touched route at **1440×900** and **1920×1080**, and compare side by side with the named `mockups/NN-name.png`. List any intentional differences (usually omitted elements with no data).
- Collapsed sidebar: each touched page at 1440 with the sidebar collapsed has no overflow and no horizontal scroll.
- Keyboard: Tab through the page. Focus is always visible and in a logical order, and Esc closes menus and dialogs.
- No layout shift when charts or lazy panels load (skeletons have fixed height).
- Performance: page server time is not worse than before (compare `performance.now()` logs where they exist, or the Vercel/Next dev timing).

## Design tokens

Use the tokens and primitives built in Phase 1 (`globals.css`, `tokens.css`, `PageHeader`, `StatStrip`, `Panel`, `Pill`/`StatusDot`, `Tabs`, `SegmentedControl`, `DataTable`, `FormSection`, `DefinitionList`, `ActivityList`). Exact values are in `mockups/mockup-styles.css`. Do not hard-code colours that already have a token.

**Mockups:**

- `mockups/19-reports-summary.png`
- `mockups/20-reports-booked.png` (also the template for the Reserved and Sold reports)
- `mockups/21-reports-installments.png`
- `mockups/22-client-ledger.png`

## Inspect first (briefly)

- Routes: `src/app/(app)/reports/{page,summary,booked,reserved,sold,installments,client-ledger}/page.tsx`
- `src/features/reports/components/*`: report-shell, summary-report-screen, booked-report-screen, reserved-report-screen, sold-report-screen, installments-report-screen, client-ledger-screen, collections-area-chart
- `src/features/reports/{queries,load-summary,export}.ts`

## Implement

1. **`report-shell.tsx`:**
   - PageHeader with the report title and meta (date range and scope from the real filters). Actions: the existing period/filter selects, Print, and Export (primary; "Export PDF" or "Export Excel" depending on what exists).
   - Below it, an underline tab row linking the report routes: Summary, Booked, Reserved, Sold, Installments, Client ledger. The active tab follows the pathname.
   - Keep print styles working: hide the sidebar and top bar when printing.
2. **Summary:**
   - StatStrip with the existing 5 KPIs: Period sales, Net collections, Discounts given, Outstanding, Overdue amount (red). Sub-lines only where the data exists.
   - Left: the "Floor ledger summary" table (Floor code and name, Block, Units, Available, Booked, Sold, Total unit value, Total sold value) with a bold total row.
   - Right: "Collections by month" using the existing `collections-area-chart` restyled as a single `--primary` 2px line, an 8% primary fill, `#EDF0F3` gridlines and an end-point dot. Lazy-load it with a fixed-height skeleton.
   - "Category mix" as horizontal bars (8px, primary on `#EDF0F3`) with "{units} units · {pct}%" from the existing category data.
3. **Booked / Reserved / Sold reports:** a StatStrip with their existing KPIs, then a table with the existing columns (Booked: Unit, Client, CNIC, Phone, Plan, Net price, Paid, Balance, Next due, Overdue in red when above 0, Status).
4. **Installments report:**
   - The existing status filters as a segmented control (All, Due this week, Due this month, Overdue, Pending, Partial, Paid).
   - StatStrip with the 5 existing KPIs.
   - Table columns: Seq, Client, Unit, Due date (red when overdue), Amount, Paid, Balance, Status.
5. **Client ledger:**
   - Left column: the client search (existing) with a results list (selected in primary-soft) and a "Client credentials" `DefinitionList`.
   - Right column: a 4-cell StatStrip (Total charged, Total paid with a bar, Balance, Overdue) derived from the ledger rows already returned, then the "Statement" table (Date, Description, Reference, Charge, Payment, Running balance) with a bold closing-balance row.
   - Actions: Download PDF and Print statement, if they exist.

## Data notes

- All data comes from the existing report queries. No new queries.
- Hide any KPI sub-line in the mockups (such as "after 4 voided payments") that the query does not return.

## Phase-specific checks

- Compare each report route at 1440 and 1920.
- Print preview of the Summary and the client statement looks clean: no shell, readable tables.
- Exports still download.
