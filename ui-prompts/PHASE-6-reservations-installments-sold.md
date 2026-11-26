# PHASE 6: Reservations, installments, agreements, sold, direct sale

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

- `mockups/11-reservations.png`
- `mockups/12-reservation-new.png`
- `mockups/13-reservation-detail.png`
- `mockups/14-installments.png`
- `mockups/15-agreements.png`
- `mockups/16-sold.png`
- `mockups/17-sold-detail.png`
- `mockups/18-direct-sale.png`

## Inspect first (briefly)

- Routes: `src/app/(app)/reservations/{page,new/page,[id]/page}.tsx`, `src/app/(app)/installments/page.tsx`, `src/app/(app)/sold/{page,new/page,[id]/page}.tsx`
- `src/features/sales/components/*`: reservations-screen, reservation-wizard, reservation-detail-screen, sold-screen, sold-detail-screen, direct-sale-screen, printable-documents
- `src/features/installments/components/*`: installments-screen, due-this-week-card, record-payment, edit-payment, void-payment, reschedule, payment-receipt dialogs
- Queries: `listReservations`, `getReservationDetail`, `listSoldUnits`, `getSoldDetail` in `src/features/sales/queries.ts`; `src/features/installments/queries.ts`
- Search for an agreements route: `rg -n "agreement" src/app src/lib/nav.ts`

## Implement

1. **Reservations list:**
   - StatStrip from the existing KPIs (Active holds, Expiring soon, Converted, Cancelled / Expired).
   - Toolbar with search and a status segmented control.
   - Columns: Unit, Prospective buyer (name with phone below), Start date, Expires at, Time remaining, Status, and row actions.
     - Time remaining: a 64px mini bar with remaining / `durationDays`, red under 15%, plus text.
     - Row actions: small Extend and Convert to booking buttons, only for ACTIVE rows, wired to the existing actions and links.
2. **New reservation:**
   - `FormSection` blocks: Unit (the existing selector), Prospective buyer (existing fields only), Hold period (the existing 5 durations as radio cards: "1 day / 24 hours", "3 days", "7 days / 1 week", "15 days", "30 days / 1 month") with Notes.
   - Right: a "Hold summary" computed client-side (unit, list price, start and end) plus a note.
   - **Omit "Token amount"** and the CNIC field unless they already exist.
3. **Reservation detail:**
   - Header actions: Cancel reservation (danger, existing dialog), Extend (existing), Convert to booking (primary).
   - StatStrip: Time remaining (red when under 24h, with a bar), Unit price, and Hold period (`durationDays`).
   - **Omit "Token received" and "Extensions"**: there are no fields. (Extensions could be counted from audit `RESERVATION_EXTEND`, but skip it to avoid a query.)
   - Panels: Prospective buyer and Property unit `DefinitionList`s, the inline "Extend reservation" form (existing extend action, Additional days select), "History" (from the reservation's own timestamps: created, extended if `updatedAt` differs, cancelled), and "Before converting to booking". The checklist is built only from fields present on the reservation's client (CNIC, phone); document rows appear only if `getReservationDetail` already returns documents.
4. **Installments & collections:**
   - A big search bar (the existing `searchInstallmentsClients`) with the selected client as a blue pill.
   - Client panel: header (initials avatar, name, booking no, unit, CNIC, phone, then Reschedule and Record payment buttons), a 4-cell mini strip (net price, paid, balance, next due), then the schedule table (Seq, Due date, Amount, Paid, Balance, Status, actions such as Receipt or Record payment).
   - "Payments" table (Payment date, Amount, Method, Cheque / Bank, Notes, Status Valid/Voided, row menu with edit/void/receipt).
   - Right: a "Due this week" panel from `getDueThisWeekInstallments` with a Week/Overdue segmented control (only if overdue rows are available from the same data; otherwise a single list).
5. **Agreements:**
   - If an agreements route **exists** (Faizan may have one locally), restyle it to `15-agreements.png` using only its real fields.
   - If **not**, do **not** create agreement numbers or signed statuses. Skip this screen and remove "Agreements" from the nav. Agreements stay reachable from the booking detail "More" menu.
   - Mention which case applied in your report.
6. **Sold list:**
   - StatStrip from the existing KPIs (Total units sold, Total realized volume, Average unit price).
   - Segmented control for sale type (Completed booking / Direct sale / Bought back) if the filter exists; otherwise just search.
   - Columns: Form no, Unit, Owner, Sale type, Sale price, Sold date, Status (Active / Bought back).
7. **Sold detail:**
   - Header: the form or serial number as `idTitle` and a pill with the sale type. Actions are the existing print and download buttons.
   - StatStrip: Realised sale, Payment method (with bank and instrument as the sub-line), Settlement date.
   - Three panels: Registered buyer, Property unit, Documents (existing).
   - A separated "Unit buyback & reacquisition" panel holding the existing buyback form and a danger "Start buyback" button.
8. **Direct sale:**
   - `FormSection` blocks: Unit and buyer; Sale price & payment (List / Sale / Concession computed, payment method as a segmented control with the existing options Cash / Cheque / Online / Pay order, bank, instrument, required concession reason); Documents (two bordered checklists, Buyer and Nominee, using the existing upload components).
   - Right: a sticky "Sale summary" panel, plus a note if the unit is reserved, only if that state is already available.

## Data notes

- Token, extensions count, agreement numbers and signed status are omitted unless they exist.
- Everything else uses existing queries. No new queries in this phase.

## Phase-specific checks

- Compare every route with its mockup at 1440 and 1920.
- The record, void, edit and reschedule dialogs still work and use the new input styles.
- Reservation countdown text updates without layout shift.
