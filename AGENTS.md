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

- Server-side `requireSession` + `assertCan`. Roles: ADMIN, INVENTORY_MANAGER, SALES.
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
