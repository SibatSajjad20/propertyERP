# PHASE 8: Admin (users, company, audit log, profile) and login

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

- `mockups/23-users.png`
- `mockups/24-company.png`
- `mockups/25-audit-log.png`
- `mockups/26-profile.png`
- `mockups/01-login.png`

## Inspect first (briefly)

- Routes: `src/app/(app)/settings/{users,company,profile}/page.tsx`, `src/app/(app)/audit/page.tsx`, `src/app/(auth)/login/{page,login-screen}.tsx`
- `src/features/users/components/users-screen.tsx`, `src/features/settings/components/company-settings-screen.tsx`, `src/features/audit/components/{audit-screen,audit-empty}.tsx`, `src/features/profile/components/profile-screen.tsx`
- `src/features/{users,settings,audit}/queries.ts`
- `src/db/schema/sales.ts` (`companySettings`, `authorizedSignatories`)
- `src/lib/auth-client.ts`

## Implement

1. **Users:**
   - Left panel: toolbar (search plus a role segmented control) and a table: Name (avatar initials, name, email below), Role, Status (Active / Disabled dot), Last login, and small "Edit role" and "Reset password" buttons wired to the existing dialogs. Keep the "New user" and "Full export" header actions.
   - Right: a static "Roles" explainer (Admin, Inventory manager, Sales) written from `src/lib/permissions.ts`, with **real** per-role counts computed from `listUsers()`.
   - **Omit "Recent sign-ins"** by default. Only if it is trivial, add a **LIGHT READ-ONLY QUERY** (ADMIN only): the 5 most recent rows from the Better Auth `session` table joined to `user` (name, user_agent, created_at). Say which option you chose.
2. **Company:** `FormSection` layout, showing only fields that exist:
   - "Company bank account" (Bank, Account title, IBAN; the existing save action).
   - "Authorised signatories" as a bordered table (Name, Designation, an Active switch bound to `isActive`, and add, edit and reorder as they exist today).
   - **Omit** company profile fields (name, phone, email, address, NTN, logo replace), the "Signs" column, numbering prefixes and default down payment: there are no columns in `company_settings`. Do not add schema.
   - Header: Save changes (primary). "Preview receipt" appears only if a preview exists.
3. **Audit log:**
   - Toolbar with the existing user, action and entity filters as compact selects (plus a date-range select only if supported) and search if supported.
   - Columns: Time, User, Action (neutral pill; Payment record and Booking create in blue, Payment void in red, Sale dark), Entity, Summary, and a Diff/Hide toggle.
   - The expanded diff renders as two side-by-side bordered boxes ("Before" and "After"). Changed values are highlighted in `--bad-soft` and `--ok-soft`.
   - Pager.
4. **Profile:**
   - Sections: Display name (avatar plus field plus Save), Password (current, new and confirm, with a 4-segment strength bar computed client-side and "Update password" primary), and "Sessions" using Better Auth `authClient.listSessions()` / `revokeSession()` if available in this version (otherwise omit the section).
   - Keep the must-change-password gate behaviour.
5. **Login:**
   - Split screen. Left: KEEP the existing Sardar's Mall building photo (`/images/sardar-mall-building.jpg`, exactly as `login-screen.tsx` uses it today via `next/image` with `priority`) filling the left panel with `object-cover`. Do NOT replace it with a drawing or a flat colour panel. Over the bottom of the photo add a subtle solid dark overlay band (e.g. `bg-black/45`, no gradient) holding the logo tile, "Sardar's Mall / Property ERP", the headline "Every unit, booking and rupee in one place." and the sub-line "Inventory, reservations, installments and reports for the sales office." in white. The mockup's floor-stack drawing is a placeholder only; ignore it.
   - Right: a 380px form (Email, Password with a "Forgot password?" link only if the flow exists, "Keep me signed in" only if it exists, a full-width primary Sign in button), then the note "Access is invite-only…".
   - **No data and no queries before sign-in.** Omit the address line.
   - Keep the rate-limit messaging and error states.

## Data notes

- Role counts come from `listUsers()`.
- Sessions come from Better Auth if it is supported.
- Everything else listed above is omitted.

## Phase-specific checks

- Compare each route at 1440 and 1920. Check the login page at 1280 too: the panel stacks below lg.
- The last active admin still cannot be demoted or disabled (existing guard).
- The login page Lighthouse performance score does not drop: no new JS, and the font is preloaded via fontsource.
