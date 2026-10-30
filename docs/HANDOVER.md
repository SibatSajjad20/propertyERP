# Handover

## Architecture

Next.js App Router monolith. Feature folders under `src/features/<module>` hold Zod schemas, server queries, server actions, and UI. Routes in `src/app` stay thin. PostgreSQL 16 (local Docker or Neon) with Drizzle. Better Auth email/password. Design tokens in `src/styles/tokens.css`.

Read `docs/ARCHITECTURE.md` and `graphify-out/GRAPH_REPORT.md` before large wiring changes.

## Roles

| Role                | Typical work                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| `SALES`             | Read inventory, sell, export the filtered list                          |
| `INVENTORY_MANAGER` | All of the above plus create/edit/archive units, structure, import      |
| `ADMIN`             | Reverse sales, users, audit, full export, overwrite sold rows on import |

Enforced with `requireSession` + `assertCan` in actions and pages. The proxy only checks that a session cookie exists. Matrix: `src/lib/permissions.ts`.

## Data rules

- Hierarchy: Property → Block → Floor → Unit.
- Money is `numeric` / decimal strings. Live asking price is `round(rate × net + adjustment, 0)`.
- Sale freezes `sold_price_pkr` and sets `sold_at` / `sold_by`. Reverse clears those three and keeps `booking_ref` in history.
- One status writer: `changeUnitStatus`. Optimistic `version` lock. History + audit in the same transaction.
- Do not archive a floor/block/property that still has live units.
- Do not overwrite a `SOLD` unit on import unless ADMIN confirms.

See `docs/DATA_MODEL.md` and `docs/IMPORT_RULES.md`.

## How to add a floor

1. Sign in as ADMIN or INVENTORY_MANAGER.
2. Open **Structure**, select the property and block.
3. **New floor**. Level `0` is Ground. The label is filled in if you leave the name blank (`Ground`, `1st`, … `10th`).
4. Archive is refused while units remain on that floor.

Programmatically: `createFloor` in `src/features/structure/actions.ts`. Canonical labels live in `src/features/structure/floor-labels.ts`. Seeded Sardar's Mall Main block already has levels 0–10.

## How to add a unit

1. **Inventory → New unit**, or **Ctrl+K** then Inventory.
2. Unit code is unique per property (`GF-S12`). Category copies `is_sellable` from the category default unless you override it.
3. Rate changes write `rate_history`. Sold units lock rate/area except for ADMIN.

## Preview deploys

`baseURL` is derived at runtime. On `VERCEL_ENV=preview` it uses `https://${VERCEL_URL}`. `trustedOrigins` always includes that origin plus `BETTER_AUTH_URL`. See `src/lib/auth-origin.ts`.

## Neon

Idle computes sleep. `withDbRetry` retries transient connection errors. The UI shows “Waking the database”. Point-in-time restore is documented in the README.

## Tests

Playwright and any DB helper must call `assertTestDatabase()`. They never run against `VERCEL_ENV=production` or a host whose name contains `prod`. E2E rows use prefixes `E2E`, `ST-<digits>`, `RV-<digits>`, `SALES-<digits>`, and `Archive empty`. Review with `pnpm db:cleanup-e2e`, delete with `--apply`. Production delete also needs `--allow-production`.

## Known limitations

- Public self-registration is off. Users are created by an administrator.
- Import is a single-request commit, not a `pg-boss` job. Very large files should be split.
- Notifications in the original design mock are not implemented; the command palette replaced that slot.
- Bookings, payments, receipts, and leasing are not in this codebase yet (`docs/ROADMAP.md`).
- Sentry is silent unless `SENTRY_DSN` is set.
