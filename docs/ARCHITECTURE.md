# Architecture

Sardar's Mall ERP is a Next.js App Router monolith, monorepo-ready at the repo root. Domain logic lives in feature folders. The database is PostgreSQL 16 with Drizzle.

## Layers

1. **Routes** (`src/app`) — pages, layouts, route handlers. Thin. Load data via feature queries. Mutate via feature actions.
2. **Features** (`src/features/<module>`) — `schema.ts` (Zod), `queries.ts` (reads), `actions.ts` (writes), `components/` (UI).
3. **UI** (`src/components`) — Radix primitives and the shared data table. No business rules.
4. **Lib** (`src/lib`) — auth, permissions, money, area, errors, logger, jobs.
5. **DB** (`src/db`) — Drizzle schema, migrations, seed.

Client components never import `src/db` or `src/lib/auth.ts`.

## Feature-folder pattern

```
src/features/bookings/
  schema.ts      # Zod inputs
  queries.ts     # server-only reads
  actions.ts     # "use server" + requireSession + assertCan + transaction
  components/    # feature UI
```

Add a route under `src/app/(app)/bookings` that composes those pieces. Structure (`src/features/structure`, `/structure`) is the live example: one screen for properties, blocks, and floors.

## How to add a module

Customers, bookings, payments, and leasing come next. For each:

1. Add tables in `src/db/schema/`, generate a migration, do not rewrite history.
2. Create the feature folder with the four files above.
3. Add permissions to `src/lib/permissions.ts` and `docs/PERMISSIONS.md`.
4. Add a nav item in `src/components/app-shell/sidebar.tsx` (Phosphor light icon only).
5. Write at least one invariant test.
6. Read `graphify-out/GRAPH_REPORT.md` before large wiring changes.

## Auth and jobs

- Better Auth email/password. Session on the server via `auth.api.getSession`.
- `src/proxy.ts` only checks that a session cookie exists.
- `pg-boss` shares the Postgres instance. Start it with `getBoss()` from `src/lib/jobs.ts` when a job is first needed.

## Caching

Next.js Cache Components is on. Authenticated pages export `instant = false` so session and DB reads may block. Do not export `dynamic = "force-dynamic"`. New `(app)` pages must include `export const instant = false`.
