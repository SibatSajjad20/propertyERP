# Sardar's Mall ERP

Property and inventory ledger for Sardar's Mall (368 units, 11 floors). Hierarchy: Property > Block > Floor > Unit.

## Setup

Prerequisites: Node 24, pnpm 12, Supabase / Postgres.

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. Inventory and sales users are also seeded from the matching `INVENTORY_*` and `SALES_*` variables.

## Scripts

| Script                      | What                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                  | Next.js dev server                                                                                                 |
| `pnpm build` / `pnpm start` | Production                                                                                                         |
| `pnpm lint`                 | ESLint                                                                                                             |
| `pnpm typecheck`            | `tsc --noEmit`                                                                                                     |
| `pnpm format`               | Prettier                                                                                                           |
| `pnpm test`                 | Vitest (no production DB)                                                                                          |
| `pnpm test:e2e`             | Playwright against the local/test DB (reuses `pnpm dev` on :3000 if it is already up; start that first on Windows) |
| `pnpm db:generate`          | Drizzle generate                                                                                                   |
| `pnpm db:migrate`           | Apply migrations                                                                                                   |
| `pnpm db:seed`              | Property, block, categories, admin and staff                                                                       |
| `pnpm db:studio`            | Drizzle Studio                                                                                                     |
| `pnpm db:cleanup-e2e`       | Dry-run: list Playwright leftover rows                                                                             |
| `pnpm db:cleanup-e2e:apply` | Delete those rows (add `--allow-production` only after review)                                                     |

## Env

See `.env.example`. Required: `DATABASE_URL`, `DIRECT_URL` (optional for migrations), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

| Variable                                        | Purpose                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                  | Supabase pooled connection string (port 6543, `prepare: false`)      |
| `DIRECT_URL`                                    | Supabase direct connection string (port 5432) for migrations         |
| `BETTER_AUTH_SECRET`                            | Session signing secret (32+ bytes)                                   |
| `BETTER_AUTH_URL`                               | Canonical public origin (production URL)                             |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seeded administrator                                                 |
| `INVENTORY_*` / `SALES_*`                       | Seeded staff for e2e                                                 |
| `LOG_LEVEL`                                     | Optional pino level                                                  |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`         | Optional Sentry                                                      |
| `ALLOW_TEST_DB`                                 | Set to `1` only for a dedicated non-prod database used by Playwright |

`.env*` is gitignored except `.env.example`. Do not put secrets in `NEXT_PUBLIC_*` other than a public Sentry DSN.

Preview deploys: Vercel sets `VERCEL_URL`. Auth `baseURL` uses `https://${VERCEL_URL}` when `VERCEL_ENV=preview`. `trustedOrigins` includes that origin. Function region is set to `sin1` (`Singapore`).

## Deploy

1. Create a Supabase project (Postgres 16, Region: Singapore `sin1`).
2. Copy the transaction pooled connection string (port 6543) into `DATABASE_URL`, and the direct connection string (port 5432) into `DIRECT_URL`.
3. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (production origin, `https://…`).
4. Set admin seed env vars, then run `pnpm db:migrate` and `pnpm db:seed`.
5. Deploy to Vercel with the same env vars and region `sin1`.

## Migrate and seed

```bash
pnpm db:migrate
pnpm db:seed
```

Migrations live in `src/db/migrations`. Do not rewrite history. Generate with `pnpm db:generate` after schema edits.

## Docs

- `docs/USER_GUIDE.md` — client-facing how-to
- `docs/HANDOVER.md` — architecture, roles, how to add a floor or unit
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/DESIGN.md`
- `docs/PERMISSIONS.md`
- `docs/IMPORT_RULES.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`

## Code graph

```bash
uv tool install graphifyy
graphify install
graphify .
```

Commit `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`. `graph.html` is gitignored.
