# Decisions

ADR log. Newest first.

## ADR-0006 — Graphify for the code graph

Status: accepted

`graphifyy` (double y) generates `graphify-out/`. Commit `GRAPH_REPORT.md` and `graph.json`. Gitignore `graph.html`. Agents read the report before large changes.

## ADR-0005 — Phosphor light, no Lucide

Status: accepted

Navigation icons only, `weight="light"`. Lucide is banned so the UI does not drift into generic shadcn.

## ADR-0004 — visx, not Recharts

Status: accepted

Charts stay SVG-native and token-coloured. Recharts' defaults fight the ledger look.

## ADR-0003 — Better Auth + Drizzle

Status: accepted

Email/password with additional `role` field. Auth tables sit beside domain tables in the same Postgres.

## ADR-0002 — Numeric money, frozen sold price

Status: accepted

`numeric` columns, decimal strings in JS, SQL view for asking price. Sale copies the computed amount into `sold_price_pkr`.

## ADR-0001 — Next.js App Router monolith, monorepo-ready

Status: accepted

One app at the repo root, `packages/` reserved. pnpm workspace. Feature folders rather than a separate API service until a second app exists.
