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

Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

## Scripts

| Script                      | What                               |
| --------------------------- | ---------------------------------- |
| `pnpm dev`                  | Next.js dev server                 |
| `pnpm build` / `pnpm start` | Production                         |
| `pnpm lint`                 | ESLint                             |
| `pnpm typecheck`            | `tsc --noEmit`                     |
| `pnpm format`               | Prettier                           |
| `pnpm test`                 | Vitest                             |
| `pnpm test:e2e`             | Playwright                         |
| `pnpm db:generate`          | Drizzle generate                   |
| `pnpm db:migrate`           | Apply migrations                   |
| `pnpm db:seed`              | Property, block, categories, admin |
| `pnpm db:studio`            | Drizzle Studio                     |

## Env

See `.env.example`. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. `SENTRY_DSN` is optional; Sentry is disabled without it.

## Docs

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/DESIGN.md`
- `docs/PERMISSIONS.md`
- `docs/IMPORT_RULES.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`

## Regenerate the code graph

Before large structural changes, read `graphify-out/GRAPH_REPORT.md`.

```bash
uv tool install graphifyy
graphify install
graphify .
```

Commit `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`. `graph.html` is gitignored.
