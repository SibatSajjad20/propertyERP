# Decisions

ADR log. Newest first.

## ADR-0008 — Optimistic version lock on unit writes

Status: accepted

Every unit create is version 1. Updates and archives submit the loaded `version`. The row is locked `FOR UPDATE`, compared, and bumped in the same transaction as `audit_log` (and `rate_history` when the rate changes). A mismatch is rejected with "This unit was changed by someone else. Reload to see the latest." so two clerks cannot silently overwrite each other.

## ADR-0007 — Whole-rupee asking price

Status: accepted

Asking price is `round(rate_per_sqft_pkr × net_area_sqft + coalesce(price_adjustment_pkr, 0), 0)` in both the `unit_pricing` view and `computeTotalPrice`. Math stays on decimal strings / numeric / bigint — never JS floats. Display uses Indian grouping (`Rs 84,00,000`) and a short form (`8.4 Cr` / `45 Lac`). Sale still freezes that whole-rupee amount into `sold_price_pkr`.

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
