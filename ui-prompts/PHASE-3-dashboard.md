# PHASE 3: Dashboard

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

**Mockup:** `mockups/02-dashboard.png`. This is the showcase screen, so match it closely.

## Inspect first (briefly)

- `src/app/(app)/page.tsx`, `src/app/(app)/dashboard/page.tsx`
- `src/features/dashboard/components/*`: dashboard-screen, dashboard-filters, floor-stack, inventory-mix-donut, sales-over-time-chart, occupancy-chart, dashboard-skeleton
- `src/features/dashboard/hooks/use-dashboard-query.ts`
- `src/features/dashboard/queries.ts` (`getDashboardBundle`, `getRecentActivity`, `getSalesOverTime`, `DashboardStats`, `DashboardNeedsAttention`)
- `src/features/installments/queries.ts` (`getDueThisWeekInstallments`)
- `src/lib/money.ts` (`formatPkrCompact`, `formatPkrLedger`): use these for lakh/crore formatting and do not write new formatters.

## Layout (top to bottom)

1. **PageHeader**
   - Title "Dashboard". Meta: today's date (long format, Asia/Karachi), then the current filter scope from `DashboardFilters` (for example "{block} · all floors").
   - Actions: the existing filters (restyled as compact selects), "Export" (the existing export), and "New booking" as the primary button (only if the role can create bookings).
   - **Omit the Month/Quarter/Year segmented control**: the bundle has no period filter.
2. **StatStrip**, 5 cells, columns `1.15fr 1.2fr 1fr 1fr 1fr`:
   - **Collected this month:** big value. On the right, a delta % against last month (green when up, muted when down). Sub-line "Rs X in {last month}". Source: the new collections series.
   - **Booked & sold:** "{booked+sold} of {total} units" with a 3-segment bar (sold `--chart-sold`, booked `--chart-booked`, reserved `--chart-reserved`). Source: `stats`.
   - **Receivable:** sum of unpaid balances on active bookings. Sub-line "Across N active bookings". Source: the light query.
   - **Due next 7 days:** `attention.dueThisWeekPkr`, sub-line "N installments".
   - **Overdue:** `attention.overduePkr` in `--bad`, sub-line "N installments". Omit "· N clients" unless you add `count(distinct booking.client_id)` to the **existing** overdue aggregate at no extra round trip.
3. **Two-column row** (`1fr 452px`, gap 20):
   - **Collections chart panel**
     - Header right: a legend and a segmented control "Collections | Bookings value". Collections uses the new monthly payments series; Bookings value uses the existing `getSalesOverTime().volumePkr`.
     - 12 monthly bars at roughly 46% of slot width, radius 3. Past months `--chart-secondary`; the current month `--primary` with a dark tooltip label above it showing the value.
     - Y gridlines at `#EDF0F3` with labels in Cr. A dashed `#64748B` "12-month avg" line, labelled at its left end on a white chip.
     - Build it as a lightweight visx or plain-SVG component, `next/dynamic` loaded with a fixed-height (262px) skeleton. Delete the old animated version or leave it unused. No entry animations beyond a 180ms fade.
   - **Availability by floor panel**
     - One row per floor (top floor first) from `floors`: floor code, a 10px stacked bar (sold / booked / reserved / available in chart shades, 2px gaps), then "{available} / {total}".
     - Legend at the bottom with the real totals. Header link "Structure" goes to `/structure`.
     - This replaces `FloorStack` and the donut on this screen.
4. **Three-column row** (`1.12fr 1fr .86fr`):
   - **Installments panel:** a segmented control "Overdue N | Next 7 days N". Rows: client name with "{unitCode} · #{seq}" below, due date (red "N days late" for overdue), amount right-aligned, and a status dot. Source: `getDueThisWeekInstallments().rows`.
     - If those rows do not include overdue items, the Overdue tab needs a **LIGHT READ-ONLY QUERY**: the oldest 5 overdue installments (`limit 5`, same predicate as the overdue aggregate).
     - Show at most 5 rows plus a "View all" link to `/installments`.
   - **Recent bookings panel:** booking number with the client below, unit, net price and paid %. **LIGHT READ-ONLY QUERY:** `listRecentBookings(5)` is a single select ordered by `created_at desc limit 5` with the client and unit join. Do not call the full `listBookings`. Header link "All bookings".
   - **Activity panel:** `getRecentActivity(5)` rendered with `ActivityList` (actor · target as the sub-line, relative time). Header link "Audit log" only for roles that can read audit.

## LIGHT READ-ONLY QUERIES (add inside `getDashboardBundle`'s existing `Promise.all`)

- `collectionsByMonth`: `select date_trunc('month', payments.paid_at) m, sum(amount)` for the last 12 months, grouped and ordered. Exclude voided payments with the same predicate used elsewhere for `payments`. Fill missing months with 0 in JS.
- `receivable`: `sum(net_price - paid_total)` with `count(*)` over `bookings where status='ACTIVE'`, as one select.
- `listRecentBookings(5)` and the optional overdue-rows `limit 5` described above.

All of them are covered by the bundle's `"use cache"` plus `cacheTag("dashboard")`.

## Data notes

- Remove "Reversals this month" from the strip unless you keep it as the sub-line of Collected.
- No invented deltas: if last month is 0, hide the delta.
- Never show "Main block" literally; use the real filter labels.

## Phase-specific checks

- Compare at 1440 and 1920 with `mockups/02-dashboard.png`. At 1440 the bottom row may wrap the Activity panel under the others; there must be no horizontal scroll.
- The chart has no layout shift (skeleton height equals final height).
- The dashboard bundle time logged by the existing `performance.now()` is not slower than before by more than about 50ms.
