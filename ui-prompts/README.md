# Property ERP: new UI implementation prompts

These eight prompts implement the 26 approved mockups in the real repo. Each one is self-contained: paste it into Cursor or Antigravity in agent mode, and the agent will briefly inspect the listed files, build the whole phase, then run the checks and report.

## Before you start (one time)

1. Copy the mockup PNGs into the repo root as `mockups/`. Use the same file names as the screens (`01-login.png`, `01b-sidebar.png`, `02-dashboard.png` … `26-profile.png`, plus the `@2x` versions).
2. Copy `reference/mockup-styles.css` into `mockups/mockup-styles.css`. It is the exact CSS behind the mockups, which the agents use as their token reference.
3. Open `C:\Users\coco\Desktop\PropertyERP`, run `git pull` on `feat/ux-perf-overhaul`, then `pnpm install`.
4. Optional: start a branch such as `feat/new-ui`.

## Order

| #   | File                                          | What it does                                                                                                                                                                                                  |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `PHASE-1-tokens-font-primitives.md`           | Swaps Geist for Inter (tabular figures, no monospace), sets the new colour/spacing/radius tokens and restyles the shared building blocks (page header, stat strip, panel, pills, tabs, tables, forms, lists). |
| 2   | `PHASE-2-app-shell-sidebar.md`                | New sidebar (248/68 px, grouped nav, calm active state, live counts, collapse remembered in a cookie), plus the top bar with breadcrumbs and search.                                                          |
| 3   | `PHASE-3-dashboard.md`                        | New dashboard: 5-number strip, blue collections chart, availability by floor, installments, recent bookings, activity.                                                                                        |
| 4   | `PHASE-4-inventory-units-structure-import.md` | Units list, unit detail with floor grid, unit create/edit, structure, import.                                                                                                                                 |
| 5   | `PHASE-5-bookings.md`                         | Bookings list, new booking wizard, booking detail (one main button plus a More menu, summary strip, tabs, document checklist).                                                                                |
| 6   | `PHASE-6-reservations-installments-sold.md`   | Reservations (list, new, detail), installments, agreements (only if the page exists), sold list and detail, direct sale.                                                                                      |
| 7   | `PHASE-7-reports-ledger.md`                   | Report tabs, executive summary, booked/reserved/sold/installments reports, client ledger.                                                                                                                     |
| 8   | `PHASE-8-admin-login.md`                      | Users, company, audit log, profile, login.                                                                                                                                                                    |

Run one phase at a time. When it finishes, check the screens yourself, commit (for example `feat(ui): phase 3 dashboard`), then paste the next one.

## Rules built into every prompt

- **UI only.** No changes to actions, schema, permissions or business logic.
- **A few small read-only queries are allowed**, and they are named in the prompts. Each is a single cached query that runs alongside the existing ones:
  - Phase 2: sidebar counts
  - Phase 3: monthly collections, total receivable, last 5 bookings (and possibly the 5 oldest overdue installments)
  - Phase 4: units on the same floor, for the unit page grid
  - Phase 8 (optional): recent sign-ins
- **No fake data.** Anything in the mockups without a real source is left out (list below).
- **Keeps the app fast.** No new chart libraries, charts load lazily with fixed-height placeholders, and there is no layout jump.
- **Checks every phase:** typecheck, lint, tests, build, screenshots at 1440 and 1920 compared with `mockups/NN-name.png`, collapsed sidebar and keyboard focus.

## Mockup elements with no real data (the prompts omit them)

- **Sidebar:** notification bell, property switcher, "Bannu" location line.
- **Dashboard:** Month/Quarter/Year switch. "· N clients" on Overdue is shown only if it can be added to the existing query.
- **Bookings list:** "Next due" column, unless the list query already returns it.
- **New booking:** "Overdue surcharge" field, and "Save draft" unless drafts exist.
- **Reservations:** "Token amount" and "Token received", "Extensions" count, and buyer CNIC on a hold unless it exists.
- **Agreements:** AG numbers and signed / awaiting-signature status. The page is built only if an agreements route exists in the repo.
- **Company:** name, phone, email, address, NTN, logo replace, "Signs" column, numbering prefixes, default down payment. Only bank details and signatories exist in the database.
- **Users:** "Recent sign-ins" (optional light query).
- **Profile:** sessions list, only if Better Auth's `listSessions` is available.
- **Login:** address line. Keep the existing Sardar's Mall building photo; the mockup's floor drawing is a placeholder.
- **Everywhere:** all names, numbers, dates, receipt numbers and staff in the mockups are examples. Real data replaces them.
