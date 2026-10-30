# Decisions

ADR log. Newest first.

## ADR-0010 — Users, roles, and login limits

Status: accepted

User administration lives at `/settings/users` (ADMIN). Creates set a temporary password and `must_change_password`; there is no email invite. Role, disable, and password reset are server actions and `/api/users` route handlers, both calling `assertCan("users.manage")`. Guards: no self-demote, no self-disable, at least one active ADMIN. Disabled users fail sign-in and have sessions revoked. Login failures are rate-limited in process memory (5 / 15 minutes) plus Better Auth's built-in limiter. The permission matrix in `src/lib/permissions.ts` is the source of truth.

## ADR-0009 — Single status service and transition map

Status: accepted

`changeUnitStatus` is the only writer of `units.status`. It locks the row `FOR UPDATE`, checks `version`, validates the transition, bumps the version, and writes `unit_status_history` plus `audit_log` in the same transaction. Allowed transitions live in one map (`STATUS_TRANSITIONS` in `src/features/units/status.ts`): `AVAILABLE → SOLD` and `SOLD → AVAILABLE`. Extend that map (and the enum) when `RESERVED` / `BOOKED` arrive — do not add a second status writer.

Sale requires `units.sell` (ADMIN, INVENTORY_MANAGER, SALES), a booking ref, and a sellable live unit; it freezes `sold_price_pkr` from `computeTotalPrice`. Reverse requires `units.reverse_sale` (ADMIN) and a reason of at least 10 characters; it clears sold price / date / seller and keeps `booking_ref`.

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
