# PHASE 5: Bookings list, new booking wizard, booking detail

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

- `mockups/08-bookings.png`
- `mockups/09-booking-new.png`
- `mockups/10-booking-detail.png`

## Inspect first (briefly)

- Routes: `src/app/(app)/bookings/page.tsx`, `src/app/(app)/bookings/new/page.tsx`, `src/app/(app)/bookings/[id]/page.tsx`
- `src/features/sales/components/*`: bookings-screen, booking-wizard, client-form, payment-plan-panel, unit-selector, booking-detail-screen, printable-documents
- `src/features/documents/components/*`: documents-section, document-upload, pdf-download-bar, down-payment-receipt-button
- `src/features/sales/queries.ts` (`listBookings`, `getBookingDetail`)
- `src/features/sales/calculator.ts`, `src/features/installments/components/record-payment-dialog.tsx`

## Implement

1. **Bookings list**
   - PageHeader "Bookings". Meta: real counts by status (from the existing KPI row). Actions: Export (if it exists) and New booking (primary).
   - StatStrip from the existing KPIs: Active bookings, Collected total, Outstanding balance, Overdue amount (in red).
   - Table toolbar: search ("Search serial, form no, unit, client…") plus a status segmented control (All / Active / Completed / Cancelled / Returned) that drives the existing `status` filter.
   - Columns: Serial / Form no (booking no. with the application form no. below in faint), Unit, Client (name with CNIC below), Plan, Net price, Paid (64px mini bar plus %), Status, actions.
   - "Next due" column: show it **only if `listBookings` already returns a next-due date**. Otherwise omit it. Do not add a per-row query.
2. **New booking wizard**
   - Keep `booking-wizard.tsx` logic, steps and validation. Restyle it:
     - a 5-step stepper panel (Unit selection, Client details, Next of kin, Payment plan, Review & confirm);
     - `FormSection` blocks for each step;
     - the plan frequency (Monthly / Quarterly / Semi-annual) as radio cards that show the computed "N × Rs X" from `calculator.ts`.
   - Right column: a "Unit summary" `DefinitionList` and a "Schedule preview" table (on booking, first 2 installments, a grouped "03–N" row, on possession, and a total), all computed client-side with the existing calculator.
   - Header: the selected unit and client as meta, with Back and Continue (primary) buttons. A "Save draft" button appears **only if drafts already exist**.
   - **Omit "Overdue surcharge"**: there is no field in the schema.
3. **Booking detail** (match `10-booking-detail.png` closely)
   - **Header:** back link "Bookings", `bookingNo` as `idTitle`, a pill "{status} · {paidPercent}% paid", meta "Serial {serialNo} · {applicationFormNo} · Unit {unitCode} · Booked {createdAt}".
   - **Actions:**
     - "More" dropdown containing every current action: Print, the Include CNIC appendix toggle (as a checkbox menu item), Down payment receipt, Agreement, and Return Booking (red, separated, still behind its confirm dialog).
     - "Download PDF" (default button) and "Record payment" (primary, opens the existing dialog).
     - All existing permission checks stay.
   - **StatStrip** (columns `1.25fr 1.4fr 1fr 1.25fr .9fr`):
     - Total price (`netPrice`), with the sub-line "{category} {unitCode} · {gross} sq ft"
     - Paid so far, with a % bar
     - Remaining (`remainingBalancePkr`), with the sub-line "incl. possession Rs X" when `possessionAmount > 0`
     - Next installment: the first schedule item with `paidAmount < amount` from `installments`, showing amount, due date and "in N days" or "N days late"
     - Overdue: sum of overdue schedule items, or "Nothing overdue" in green. Derive it client-side from `getBookingDetail().installments`; **no new query**.
   - **Tabs** (Radix, underline style) with real counts:
     - Overview
     - Payment schedule ({installments.length + down payment})
     - Documents ({uploaded}/{required+optional} from `documents` and `src/features/documents/required.ts`)
     - Activity
       The active tab is kept in the `?tab=` search param.
   - **Overview tab:**
     - Left: a "Payment schedule" preview (down payment row, the next 3–4 unpaid rows highlighted, a grouped remaining row, the possession row) with "View all N" switching tabs; then a "Documents" checklist panel.
     - Right: a "Client" `DefinitionList` (name, father's name, CNIC, phone, the **full address with no truncation**, nominee with relation) plus a "Unit" `DefinitionList`, then "Recent activity".
   - **Documents checklist:** two columns, Client and Next of kin. Each row is a 34×26 neutral thumbnail placeholder (an icon, never the face image in this list), the label, a green check when uploaded, and View / Replace. Optional documents show an "Optional" tag with Upload or Capture.
     - Reuse `documents-section.tsx` / `document-upload.tsx` logic: View opens the existing signed-URL preview and Replace or Remove use the existing upload flow.
     - Signed URLs keep loading lazily as they do now.
   - **Recent activity:** build it from data already in `getBookingDetail`: `booking.createdAt` ("Booking created"), each payment (amount, method, receipt no if present, by), document uploads (grouped by day) and refunds. **No audit-log query.**
   - **Payment schedule tab:** the full table (Seq, Description, Due date, Amount, Paid, Status) plus the payments table, using the existing edit/void/receipt actions.
   - **Documents tab:** the full `DocumentsSection`.
   - **Activity tab:** the full list.

## Data notes

- Everything comes from `getBookingDetail` or client-side derivation. No new queries in this phase.

## Phase-specific checks

- Compare at 1440 and 1920 with the three mockups.
- Every action from the old 8-button toolbar is still reachable in at most 2 clicks.
- The PDF and receipt downloads still work.
- Record payment updates the strip numbers after it succeeds (existing invalidation).
