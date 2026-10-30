# Sardar's Mall ERP

Property and inventory ledger for Sardar's Mall (368 units, 11 floors). Hierarchy: Property > Block > Floor > Unit.

## Setup

Prerequisites: Node 24, pnpm 12, Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d db
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

See `.env.example`. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

| Variable                                        | Purpose                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                  | Postgres connection string                                           |
| `BETTER_AUTH_SECRET`                            | Session signing secret (32+ bytes)                                   |
| `BETTER_AUTH_URL`                               | Canonical public origin (production URL)                             |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seeded administrator                                                 |
| `INVENTORY_*` / `SALES_*`                       | Seeded staff for e2e                                                 |
| `LOG_LEVEL`                                     | Optional pino level                                                  |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`         | Optional Sentry                                                      |
| `ALLOW_TEST_DB`                                 | Set to `1` only for a dedicated non-prod database used by Playwright |

`.env*` is gitignored except `.env.example`. Do not put secrets in `NEXT_PUBLIC_*` other than a public Sentry DSN.

Preview deploys: Vercel sets `VERCEL_URL`. Auth `baseURL` uses `https://${VERCEL_URL}` when `VERCEL_ENV=preview`. `trustedOrigins` includes that origin.

## Deploy

1. Create a Neon project (Postgres 16). Copy the pooled connection string into `DATABASE_URL`.
2. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (production origin, `https://…`).
3. Set admin seed env vars, then run `pnpm db:migrate` and `pnpm db:seed` against Neon (or a CI migrate step).
4. Deploy to Vercel with the same env vars. Preview deployments work without changing `BETTER_AUTH_URL`.

## Migrate and seed

```bash
pnpm db:migrate
pnpm db:seed
```

Migrations live in `src/db/migrations`. Do not rewrite history. Generate with `pnpm db:generate` after schema edits.

## Neon point-in-time restore

Neon keeps a restore window on paid plans (check the console for the exact retention).

1. In the Neon console, open the project → **Backup & restore** (or **Branches**).
2. Create a new branch / restore target at the timestamp you need. This does not overwrite the live branch until you switch.
3. Point a staging `DATABASE_URL` at the restored branch and verify units, sales, and users.
4. To promote: swap the production connection string to the restored branch, or restore onto the production branch using Neon’s restore flow.
5. After restore, run `pnpm db:migrate` only if the restored point is behind current migrations. Do not re-seed production.

Time-travel is not a substitute for **Full export**. Administrators should download `.xlsx` after major imports or month-end.

If the app says the database is waking, Neon is starting a suspended compute. Wait and retry.

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
