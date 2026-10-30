# Agent instructions

## Package manager

Use **pnpm**: `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`

## File-scoped commands

| Task         | Command                                     |
| ------------ | ------------------------------------------- |
| Typecheck    | `pnpm exec tsc --noEmit`                    |
| Lint         | `pnpm exec eslint path/to/file.ts`          |
| Test         | `pnpm exec vitest run path/to/file.test.ts` |
| Generate SQL | `pnpm db:generate`                          |

## Stack

Next.js App Router, strict TS, Drizzle, Better Auth (email/password), Tailwind v4, Radix (no shadcn defaults), Phosphor light icons, visx, Zod on every action.

## Layout

- Features: `src/features/<module>/{actions,queries,schema,components}`
- UI: `src/components/ui`, `src/components/data-table`
- DB: `src/db/schema`, `src/db/migrations`
- Rules: `.cursor/rules/*.mdc`
- Docs: `docs/`

## Conventions

- Server-side `requireSession` + `assertCan`. Roles: ADMIN, INVENTORY_MANAGER, SALES. Matrix: `src/lib/permissions.ts`.
- Preview auth: `src/lib/auth-origin.ts` (dynamic `baseURL`, `trustedOrigins` includes `VERCEL_URL`).
- Tests never use production DB (`src/lib/test-db-guard.ts`). Review leftovers: `pnpm db:cleanup-e2e`.
- Users: `/settings/users` (ADMIN). Create with a temporary password (`must_change_password`). No self-demote/disable; keep one active ADMIN. Profile: `/settings/profile`.
- Login: in-memory failed-attempt limit (5 / 15 min per email). Better Auth request rate limit is on in production only (off when `ALLOW_TEST_DB=1` so Playwright can sign in repeatedly). Disabled users cannot sign in; sessions revoked.
- Client docs: `docs/USER_GUIDE.md`. Handover: `docs/HANDOVER.md`.
- Dashboard: `/` (alias `/dashboard`). Title is **Dashboard**. Hairline layout, no cards, Geist Mono tabular figures, visx sales-over-time chart. Role SALES sees dashboard but no audit trail.
- UX: breadcrumbs in the top bar, `PageHeader` on list pages, cmdk (`⌘/Ctrl+K`), toasts on mutations, `ErrorState` / 404, Neon waking copy. Sign out lives in the **Account menu**.
- Aggregations: Dashboard KPIs, floor ledger, block breakdown, and monthly sales are aggregated strictly in SQL (never load units into memory).
- Exports: `/api/export` generates formatted `.xlsx` (exceljs) and `.csv` for Inventory (current filters), Sold Units, and Floor Summary with frozen headers, PKR currency format (`"Rs "#,##0`), and dates in filenames (`YYYY-MM-DD`).
- Import: `/import` (ADMIN and INVENTORY_MANAGER). Ingest `.xlsx`/`.csv` (max 5 MB) parsed server-side via SheetJS/exceljs. Auto-detect headers, remap with Radix selects, apply cleaning rules (trim/uppercase unit codes, normalize floors, strip Rs/commas, map AVAILABLE/SOLD). Virtualized validation preview (TanStack) flagging duplicates, non-matching floor/block, conflicting data (6F-RA33 cases), and SOLD units without price. Atomic single-transaction commit recording audit_log, rate_history, status history, and `import_batches` row with audit-log-based soft-rollback for latest batch. Error rows downloadable as `.xlsx`. Client data files (*.xlsx, *.csv) are gitignored.
- Money: `numeric` / decimal strings. `computeTotalPrice`. Freeze `sold_price_pkr` on sale.
- One status-change action, optimistic `version` lock, history + audit in the same transaction.
- Design: `src/styles/tokens.css`. No gradients, shadows, cards, emoji, Lucide, Recharts.
- New modules copy the feature-folder pattern (`docs/ARCHITECTURE.md`).

## Code graph

Read `graphify-out/GRAPH_REPORT.md` before large changes. Regenerate with `graphify .`. Commit `GRAPH_REPORT.md` and `graph.json`; gitignore `graph.html`.

## Commit attribution

AI commits MUST include:

```
Co-Authored-By: Cursor Grok 4.6 <noreply@cursor.com>
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
