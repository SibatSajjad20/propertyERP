# PHASE 4: Inventory, unit detail, unit create/edit, structure, import

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

- `mockups/03-inventory.png`
- `mockups/04-unit-detail.png`
- `mockups/05-unit-edit.png` (also used for `/units/new`)
- `mockups/06-structure.png`
- `mockups/07-import.png`

## Inspect first (briefly)

- Routes: `src/app/(app)/inventory/page.tsx`, `src/app/(app)/units/[id]/page.tsx`, `src/app/(app)/units/[id]/edit/page.tsx`, `src/app/(app)/units/new/page.tsx`, `src/app/(app)/structure/page.tsx`, `src/app/(app)/import/page.tsx`
- `src/features/units/components/*`: inventory-screen, inventory-table, unit-form, unit-create-screen, unit-edit-screen, status-history, unit-status-actions
- `src/features/structure/components/*`
- `src/features/import/components/*`: import-screen, upload-dropzone, mapping-step, preview-table, batch-history, empty
- `src/features/sales/components/unit-ownership-timeline.tsx`
- Queries: `src/features/units/queries.ts`, `src/features/structure/queries.ts`, `src/features/import/queries.ts`

## Implement

1. **Inventory (`/inventory`)**
   - PageHeader "Units". Meta: "{total} units across {floors} floors". Actions: Export, Import (link), New unit (primary, permission-gated).
   - StatStrip with the existing summary numbers: Total matching (plus gross sq ft if it is already computed), Filtered value, Available (with a % bar), Sold (with a % bar), and Missing gross area (with a "Review units" link that applies the existing missing-gross filter).
   - One table panel. The toolbar holds the existing search ("Code, number, owner…") and the floor, category, status and sellable filters as compact selects, plus a "Columns" button only if column visibility already exists.
   - Columns are exactly the current ones: Unit code, Unit no., Floor, Category, Gross sq ft, Net sq ft, Rate/sq ft, Total price, Status, Ownership group, Sold on, and an actions menu.
   - Unit code uses the `.id` style. Status uses the dot pill. Numbers are right-aligned. Empty values show a faint "—".
   - **Omit the "Table | Floor grid" toggle** unless a grid view already exists.
2. **Unit detail (`/units/[id]`)**
   - Header: back link "Units", the unit code as `idTitle`, a status pill, and meta (category, floor and block, unit no., Sellable).
   - Actions: Edit unit, Change status (the existing `unit-status-actions` in a menu), and primary "View booking" or "View sold record" (the links that exist today).
   - StatStrip: Total price, Rate per sq ft, Gross area (sub-line: net area), and Booking (booking no. plus client and paid %) shown only when a booking exists.
   - **Floor panel:** a grid of all units on the same floor. Each tile is 50px tall: code, status text, background by status shade, and the current unit outlined in primary. Tiles link to `/units/[id]`. Header hint shows the real counts by status. **LIGHT READ-ONLY QUERY:** `listFloorUnits(floorId)` selects id, unit_code, status and gross_area for `floor_id = $1 and archived_at is null` ordered by unit_number. Run it in the page's `Promise.all` with `getUnitById`, or reuse `getStructureScreenData` if it already returns per-floor units.
   - Two `DefinitionList` panels, "Unit" and "Area and price", from the unit row.
   - Right column: "Ownership" (`getUnitOwnershipTimeline` as an `ActivityList`) and "Status history" (`listUnitStatusHistory` as a compact table).
3. **Unit create/edit**
   - `FormSection` layout: Identity, Area, Pricing, Ownership. Use the exact fields and validation in `unit-form.tsx`. "Reason for rate change" appears only when the rate changes, as today.
   - Right column: a sticky "New price" panel computed client-side (gross × rate + adjustment) showing current price, difference and % change, then the "Sellable inventory" switch with its help text, then a note when bookings exist.
   - Header actions: Cancel (ghost) and Save changes (primary).
4. **Structure (`/structure`)**
   - Three panels: Blocks list (selected row in primary-soft), Floors list (drag handle only if reordering exists, code, label, level and unit count, free count, actions menu), and the selected floor's units as tiles in an 8-column grid with a status legend.
   - Header: the property select plus the existing Add floor and Add units actions.
5. **Import (`/import`)**
   - The existing steps rendered as a 4-step stepper: Upload file, Map columns, Review rows, Import (done steps show a filled primary check; the active step has an underline).
   - Review step: the table with the existing validation status per row as status dots (Ready / warning / error text from the real validation), a segmented filter with real counts, and a summary panel with real counts plus a note.
   - "Recent imports" uses `listImportBatches()`. The header primary action label uses the real importable count.

## Data notes

- Floor grid: the light query above.
- Ownership "Phase 2 launch" style notes: only the real timeline text.
- Import counts: from existing parse/validation results only.

## Phase-specific checks

- Compare each route with its mockup at 1440 and 1920.
- Inventory filters still update client-side with no RSC reload (React Query keys are unchanged).
- Unit edit keyboard flow works and validation errors appear inline with the new input styles.
