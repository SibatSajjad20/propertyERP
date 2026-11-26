# PHASE 2: App shell (new sidebar, top bar, breadcrumbs, search)

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

## Design tokens (exact values from the approved mockups)

| Token                                  | Value                                                                                                 | Use                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `--primary`                            | `#0B558B`                                                                                             | brand, primary buttons, active icons, links |
| `--primary-hover` / `--primary-active` | `#084572` / `#063A61`                                                                                 | button states                               |
| `--primary-soft`                       | `#EAF1F7`                                                                                             | selected rows, blue pill background         |
| chart shades                           | `#0B3F66` sold, `#0B558B` booked, `#7FA6C6` reserved, `#E3E9EF` available, `#B9CEE0` secondary bars   | blue-only charts                            |
| `--bg`                                 | `#F6F7F9`                                                                                             | app background                              |
| `--surface`                            | `#FFFFFF`                                                                                             | panels                                      |
| `--sidebar-bg`                         | `#FAFBFC`                                                                                             | sidebar, table header row, inputs-on-grey   |
| `--border`                             | `#E4E7EC`                                                                                             | panel and control borders                   |
| `--line`                               | `#EDEFF2`                                                                                             | hairline row dividers inside panels         |
| `--line-strong`                        | `#CBD2DA`                                                                                             | separators, empty-state dots                |
| `--text` / ink                         | `#0F172A`                                                                                             | primary text                                |
| `--text-secondary`                     | `#334155`                                                                                             | table body text                             |
| `--muted`                              | `#64748B`                                                                                             | labels, meta                                |
| `--subtle` / faint                     | `#94A3B8`                                                                                             | secondary meta, zero values                 |
| `--ok` / `--ok-soft`                   | `#1F7A4D` / `#E9F4EE`                                                                                 | Paid, Available, "Nothing overdue"          |
| `--bad` / `--bad-soft`                 | `#B42318` / `#FDF0EF`                                                                                 | Overdue, danger actions                     |
| `--warn-dot`                           | `#D99A1E`                                                                                             | Reserved / Partial status dot               |
| status dots                            | Available `#1F7A4D`, Reserved `#D99A1E`, Booked `#0B558B`, Sold `#475569`, Pending/Upcoming `#CBD2DA` | 7px dot plus a text label                   |

**Typography:** Inter via `@fontsource-variable/inter` (family `"Inter Variable"`). Set `font-feature-settings: 'tnum','cv11'` globally on body. There are **no monospace fonts anywhere**. Unit codes and booking or receipt numbers use Inter 500 with `letter-spacing: .012em` (rename `.unit-code` usage to an `.id` style, or restyle `.unit-code` to this).

| Role                              | Size / weight / tracking                                             |
| --------------------------------- | -------------------------------------------------------------------- |
| body                              | 13px / 400 / -0.003em                                                |
| page title (h1)                   | 22px / 600 / -0.022em                                                |
| record title (booking or unit ID) | 24px / 600 / -0.005em                                                |
| stat big                          | 26px / 600 / -0.025em; currency prefix "Rs" at 0.6em, 500, muted     |
| stat medium                       | 21px / 600 / -0.02em                                                 |
| stat label                        | 12px / 500 / muted                                                   |
| stat sub-line                     | 12px / muted                                                         |
| panel title                       | 13.5px / 600                                                         |
| tab                               | 13.5px / 500 (active: ink with 2px `#0B558B` underline)              |
| table header                      | 12px / 500 / muted, sentence case, background `#FAFBFC`, height 38   |
| table cell                        | 13px, row height 44, `#EDEFF2` bottom divider, numbers right-aligned |
| sidebar item                      | 13px, height 32                                                      |
| sidebar group label               | 11px / 500 / faint, **sentence case** (not uppercase)                |

**Spacing and radii:**

- Content area `max-width:1440px`, padding `24px 28px 28px`. Grid gaps 20. Page header bottom margin 20.
- Panel: radius 12, 1px `--border`, **no heavy shadow**. Make `--shadow-card` a subtle `0 1px 2px rgba(15,23,42,.03)` or none. Panel header padding `13px 20px`, min-height 50, `--line` bottom border.
- Stat strip: one panel split into cells by `--line` vertical hairlines. Cell padding `16px 20px 17px`. Progress bar 4px tall, track `#EDF0F3`, radius 2.
- Buttons: height 34, padding 0 13, radius 8, 13px/500. Small: height 28, radius 7. Large: height 40.
  - Default: white with 1px border and shadow `0 1px 1px rgba(15,23,42,.04)`.
  - Primary: `#0B558B` with shadow `0 1px 2px rgba(11,85,139,.25)`.
  - Danger: red text on white.
  - Ghost: no border.
- Inputs: height 38, radius 8, 1px border. Focus: border `#0B558B` plus `0 0 0 3px rgba(11,85,139,.12)`. Prefix addon ("Rs") on a `#FAFBFC` background.
- Pill: height 22, radius 999, 12px/500, 6px dot. Neutral is `#F1F3F6`; blue is `--primary-soft` with primary text.
- Segmented control: track `#EEF1F4`, radius 8, padding 2. Active segment is white with radius 6 and shadow `0 1px 2px rgba(15,23,42,.08)`.
- Form section (`fsec`): a two-column grid, `280px` description column plus fields column, gap 40, padding 22 vertical, `--line` top divider.
- Top bar: height **56**, white, bottom border `--border`, padding `0 28px 0 20px`.
- Sidebar: **248px** expanded / **68px** collapsed (the old sidebar was 232).

**Mockups:** `mockups/01b-sidebar.png` (expanded and collapsed close-up), plus the shell on any screen such as `mockups/02-dashboard.png` and `mockups/10-booking-detail.png`.

## Inspect first (briefly)

- `src/components/app-shell/{app-shell,sidebar,top-bar,command-menu,breadcrumb-context,breadcrumb-set,nav-items}.tsx`
- `src/lib/nav.ts`, `src/lib/permissions.ts`
- `src/app/(app)/layout.tsx`
- `src/components/ui/{tooltip,dropdown-menu,sheet}.tsx`
- `src/features/dashboard/queries.ts` (the `getDashboardStats` / `getDashboardBundle` aggregates, used to model the counts query)

## Implement

1. **Navigation groups** in `src/lib/nav.ts`. Keep the hrefs, actions and `visibleNav` filtering. Labels and grouping are presentation only:
   - Overview: Dashboard
   - Inventory: Units (`/inventory`), Structure, Import
   - Sales: Bookings, Reservations, Installments, Agreements (**only if a route for it exists in this repo**; otherwise leave it out), Sold
   - Insights: Reports, Client ledger (`/reports/client-ledger`, gated by the same action as reports)
   - Admin: Users (`/settings/users`), Company, Audit log

   Group labels are sentence case. The groups replace the current `inventoryNav`/`salesNav`/... rendering in `sidebar.tsx`, or add a grouped export and keep the old exports for other users such as the command menu.

2. **Sidebar** (`sidebar.tsx`), matching `01b-sidebar.png`:
   - Background `--sidebar-bg`, right border `--border`. Width 248 expanded, 68 collapsed. Width transition uses `--duration-panel` and `--ease-ledger`; respect `prefers-reduced-motion`.
   - **Brand block:** a 48px row with a 12px margin. Logo tile is 32px (white, border, radius 8, `/images/logo-mark.png` at 22px). Then the name "Sardar's Mall" (13.5/600) with the sub-line "Property ERP" (11.5 muted), and an up/down chevron. It opens a dropdown with only real links: Company settings (ADMIN) and Profile. **No property switcher**: there is no multi-property data in the UI flow.
   - **Nav item:** height 32, radius 7, 13px. Icon is 16px in `#8391A2`.
     - Active: white background, 1px `--border`, shadow `0 1px 2px rgba(15,23,42,.05)`, ink text at 500, icon in `--primary`, plus `aria-current="page"`. No filled blue pill.
     - Hover: `#F1F3F6`.
     - Keep the existing `pendingHref` optimistic-active logic and the `navLocked` behaviour.
   - **Counts** on the right (11.5px muted): Units total, Bookings active, Reservations active, Sold total, and Installments overdue in `--bad` at 500. See **LIGHT READ-ONLY QUERY** below. They render inside `<Suspense fallback={null}>` so the shell never waits for them, and their width is reserved with `min-width` so nothing shifts.
   - **Footer:** a "Collapse" row with a `[` key hint, then the user block: 30px avatar with initials, name (12.5/500), **email** (11.5 muted; pass `session.user.email` from `(app)/layout.tsx` through `AppShell`), and the menu (Profile, Sign out) as today.
   - **Collapsed (68px):**
     - icons only, centred in 42×36 hit areas;
     - group labels become 1px `--line` separators;
     - counts are hidden; overdue becomes a 6px red dot on the Installments icon;
     - every item has a Radix `Tooltip` (label plus count) on hover and focus;
     - the brand shows the logo only; the user block shows the avatar only.
   - **Toggle:** the Collapse row, a sidebar button in the top bar, and the keyboard shortcut `[` (ignored while typing in inputs).
   - **Persist** the state in a cookie (`sidebar=collapsed|expanded`). Read it in `(app)/layout.tsx` via `cookies()` and pass it as the initial prop so the first paint is correct with **no flash or layout shift**. Write it client-side on toggle. Do not use localStorage-only state.
   - Mobile (below lg): keep the existing `Sheet`, always expanded.
3. **Top bar** (`top-bar.tsx`):
   - Height 56, white, bottom border, padding `0 28px 0 20px`.
   - Left: a 28px bordered sidebar-toggle icon button, then breadcrumbs (13px muted, `/` separators in `#CBD2DA`, last item ink 500).
     - Breadcrumbs must show the real record: for example "Sales / Bookings / {bookingNo}", "Inventory / Units / {unitCode}" and "Sales / Reservations / {unitCode}". Use the existing `BreadcrumbSet` / `breadcrumb-context` override from each detail page.
     - Rename the "Inventory" root crumb label to "Units" to match the nav.
   - Right: the search trigger (340px wide, 34px tall, `--sidebar-bg`, placeholder "Search units, clients, bookings…", `Ctrl K` key chip) opening the existing `CommandMenu`.
   - **No notification bell**: there is no data source, so omit it.
   - Remove the duplicate avatar if the sidebar already has the account block. Keep the mobile menu button.
4. **AppShell** (`app-shell.tsx`):
   - Content wrapper is `max-w-[1440px] px-7 pt-6 pb-7`.
   - Sidebar sticky with full height, main content scrolls.
   - Accept `initialCollapsed` and `userEmail` props.

## LIGHT READ-ONLY QUERY (call out in your report)

`getNavCounts()` in `src/features/dashboard/queries.ts`:

- **One** SQL round trip using `count(*) filter (...)` over `units` (non-archived total and sold), plus scalar subselects for active bookings, active reservations and overdue installments (reuse the exact overdue predicate already in `getDashboardBundle`).
- Mark it `"use cache"`, `cacheTag("dashboard")`, `cacheLife("minutes")`, so existing mutation invalidations refresh it.
- Call it from `(app)/layout.tsx` **without awaiting before render**: pass the promise to a small server component inside Suspense, or `use()` it inside the client sidebar under Suspense.
- If this adds measurable time to the layout, drop the counts and keep only the overdue dot. Report which you shipped.

## Data notes

- Brand name and logo are static, as today.
- Counts come from the query above.
- Email comes from the session.
- Bell, property switcher and location line ("Bannu") are omitted: no source.

## Phase-specific checks

- Compare expanded and collapsed at 1440 and 1920 with `mockups/01b-sidebar.png`.
- Reload while collapsed: it renders collapsed on the first frame.
- Tab order: toggle, nav items, account menu. Tooltips appear on keyboard focus in collapsed mode.
- `navLocked` users still see the lock behaviour.
