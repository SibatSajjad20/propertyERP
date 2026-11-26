# PHASE 1: Design tokens, Inter font, shared primitives

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

**Mockups:** every file in `mockups/`. Primitives are judged mainly against `mockups/10-booking-detail.png`, `mockups/03-inventory.png`, `mockups/05-unit-edit.png` and `mockups/19-reports-summary.png`.

## Inspect first (briefly)

- `src/app/layout.tsx` (Geist imports)
- `src/styles/globals.css` and `src/styles/tokens.css`
- `package.json`
- `src/components/page-header.tsx`, `src/components/page-skeleton.tsx`
- `src/components/ui/*`: button, badge, unit-status-badge, stat-card, tabs, segmented-control, input, money-input, select, empty-state, filter-bar, skeleton, switch, checkbox
- `src/components/data-table/data-table.tsx`
- Every place that uses the `.unit-code` class or `font-mono`: `rg -n "unit-code|font-mono" src`

## Implement

1. **Font**
   - `pnpm remove @fontsource-variable/geist @fontsource-variable/geist-mono`, then `pnpm add @fontsource-variable/inter`.
   - In `src/app/layout.tsx`, import `@fontsource-variable/inter` and remove the Geist imports.
   - In both `globals.css` (`@theme inline`) and `tokens.css`, set `--font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;` and point `--font-mono` at the same sans stack so nothing renders monospace.
   - On `body`, set `font-size:13px; letter-spacing:-0.003em; font-feature-settings:'tnum','cv11';`. Remove `"ss01"` from the table rule.
   - Restyle `.unit-code` to `font-family: var(--font-sans); font-weight:500; letter-spacing:.012em;` and add an alias `.id` with the same rules. Remove every `font-mono` usage.
2. **Tokens:** update `:root` and `@theme inline` in `globals.css` to the table above. Keep the existing token names so current classes keep working, and add the new ones:
   - `--sidebar-bg`, `--ok`, `--ok-soft`, `--bad`, `--bad-soft`, `--warn-dot`, `--chart-sold`, `--chart-booked`, `--chart-reserved`, `--chart-available`, `--chart-secondary`
   - their `--color-*` theme aliases, so Tailwind classes like `bg-ok-soft` and `text-bad` work.
   - Status colours: `--available:#1F7A4D`, `--reserved:#D99A1E`, `--booked:#0B558B`, `--sold:#475569`.
   - In `tokens.css`: `--topbar-height:56px`, `--sidebar-width:248px`, add `--sidebar-width-collapsed:68px`, `--row-height:44px`. Flatten `--shadow-card` as in the token table.
3. **Primitives:** restyle the existing components where they exist; create new files only where none exists, all in `src/components/ui/` unless noted.
   - `PageHeader` (`src/components/page-header.tsx`): add optional `back?: {href,label}`, `meta?: ReactNode[]` (rendered joined with a `·` in `#CBD2DA`), `badge?: ReactNode` and `idTitle?: boolean` (24px record title). Remove the bottom border; use 20px bottom margin. Keep the existing props working.
   - `StatStrip` + `StatCell` (new `stat-strip.tsx`): one panel, CSS grid with a `columns` prop. Each cell has a label, an optional right-side label, a value (big or medium, with an `Rs` prefix span), an optional sub-line and an optional thin progress bar (one or more segments). Keep `StatCard` for any screen not yet migrated. Reuse `animated-number.tsx` only if it causes no layout shift; otherwise render static numbers.
   - `Panel` (new `panel.tsx`): `title`, `actions` (right side), `children`, `bodyClassName`. Hairline header.
   - `Pill` / `StatusDot` (extend `badge.tsx`): tones `neutral | blue | ok | warn | bad | dark | muted`, each with dot plus text. `UnitStatusBadge` uses the status-dot style from the token table.
   - `Tabs` (`tabs.tsx`): underline style, with an optional count chip (11.5px, `#EEF1F4` background, radius 5).
   - `SegmentedControl`: the token style.
   - `Button` variants: `primary | default | ghost | danger` and sizes `sm | md | lg` to the token spec.
   - `DataTable` (`src/components/data-table/data-table.tsx`): 38px header on `#FAFBFC` and 44px rows with `--line` dividers. Add a `numeric` column meta for right alignment, a pager row ("Showing X–Y of N" plus Previous/Next small buttons) and an optional toolbar slot (search input, selects, segmented control, right-side actions). Keep virtualisation and sorting as they are.
   - `FormSection` (new `form-section.tsx`): two columns (280px title and help text, then the fields grid). Restyle `Input`, `MoneyInput`, `Select` and `Textarea` to the input tokens, including the "Rs" prefix addon.
   - `DefinitionList` (new `definition-list.tsx`): a 140px label column and right-aligned values with hairline rows. Long values wrap and are never truncated.
   - `ActivityList` (new `activity-list.tsx`): a dot timeline. Each item has a title, an optional sub-line and a time.
   - `EmptyState`: a quiet centred title, one line of help and an optional action. No illustration.
   - `Skeleton`: keep the contrast from commit `700c1e9`, and use fixed heights that match each primitive.
4. Do not migrate whole screens in this phase. Only make sure existing screens still render correctly with the new tokens and font. Fix any obvious breakage they cause.

## Data notes

None. Styling only.

## Phase-specific checks

- `rg -n "Geist|font-mono" src` returns nothing, apart from comments you update.
- A quick tour of `/`, `/inventory`, `/bookings` and one booking detail at 1440 shows Inter with tabular figures, with no overflow and nothing broken.
