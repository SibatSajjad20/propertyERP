# Graph Report - PropertyERP  (2026-10-30)

## Corpus Check
- 144 files · ~46,895 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 858 nodes · 1566 edges · 126 communities (52 shown, 74 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5abf57bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- enums.ts
- jobs.ts
- dashboard/page.tsx
- Agent instructions
- compilerOptions
- unit-status-actions.tsx
- scripts
- transitions-dev/SKILL.md
- structure/actions.ts
- dependencies
- Avatar group hover
- app/layout.tsx
- devDependencies
- instrumentation.ts
- lint-staged.config.mjs
- next.config.ts
- proxy.ts
- better-auth
- @better-auth/drizzle-adapter
- Error state shake
- @radix-ui/react-select
- cmdk
- Decisions
- Design
- drizzle-orm
- class-variance-authority
- eslint.config.mjs
- eslint-config-next
- eslint-config-prettier
- exceljs
- @hookform/resolvers
- husky
- jsdom
- lint-staged
- motion
- next
- @phosphor-icons/react
- pino
- postgres
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-separator
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-visually-hidden
- react
- react-dom
- react-hook-form
- @sentry/nextjs
- server-only
- sonner
- tailwind-merge
- @tanstack/react-table
- @tanstack/react-virtual
- @visx/axis
- @visx/event
- @visx/grid
- @visx/group
- @visx/legend
- @visx/responsive
- @visx/scale
- @visx/shape
- @visx/tooltip
- xlsx
- zod
- pino-pretty
- prettier
- prettier-plugin-tailwindcss
- tailwindcss
- @tailwindcss/turbopack
- @testing-library/react
- @testing-library/user-event
- tsx
- @types/node
- @types/react
- @types/react-dom
- typescript
- @vitejs/plugin-react
- vitest
- prettier.config.mjs
- audit/schema.ts
- dashboard/schema.ts
- instrumentation-client.ts
- Frontend Design
- Card resize
- Number pop-in
- Notification badge
- Text states swap
- Menu dropdown
- Modal open / close
- Panel reveal
- Page side-by-side
- Icon swap
- Transitions.dev
- Architecture
- Sardar's Mall ERP
- Contributing
- Data model
- Web Interface Guidelines
- Import rules
- Roadmap
- units/schema.ts
- PERMISSIONS.md
- @playwright/test
- @testing-library/dom
- drizzle-kit
- units/queries.ts
- getSession
- units/actions.ts

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 42 edges
2. `assertCan()` - 35 edges
3. `cn()` - 20 edges
4. `compilerOptions` - 18 edges
5. `can()` - 17 edges
6. `computeTotalPrice()` - 16 edges
7. `db` - 15 edges
8. `formatPkrLedger()` - 15 edges
9. `scripts` - 14 edges
10. `updateUnit()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/status.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/structure.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/units.test.ts → src/lib/auth.ts
- `StatusCell()` --calls--> `cn()`  [EXTRACTED]
  src/features/units/components/inventory-table.tsx → src/lib/cn.ts
- `DashboardPage()` --calls--> `formatPkr()`  [EXTRACTED]
  src/app/(app)/dashboard/page.tsx → src/lib/money.ts

## Import Cycles
- None detected.

## Communities (126 total, 74 thin omitted)

### Community 0 - "enums.ts"
Cohesion: 0.05
Nodes (48): ImportPage(), instant, metadata, instant, instant, metadata, UsersPage(), AppShell() (+40 more)

### Community 2 - "dashboard/page.tsx"
Cohesion: 0.18
Nodes (11): DashboardPage(), instant, metadata, sql, loadDashboard(), margin, OccupancyChart(), OccupancyChartProps (+3 more)

### Community 3 - "Agent instructions"
Cohesion: 0.20
Nodes (9): Agent instructions, Code graph, Commit attribution, Conventions, File-scoped commands, Layout, Package manager, Stack (+1 more)

### Community 4 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 5 - "unit-status-actions.tsx"
Cohesion: 0.07
Nodes (42): instant, metadata, UnitDetailPage(), loginSchema, LoginValues, TopBarProps, DataTable(), DataTableProps (+34 more)

### Community 6 - "scripts"
Cohesion: 0.11
Nodes (18): name, packageManager, private, scripts, build, db:generate, db:migrate, db:seed (+10 more)

### Community 7 - "transitions-dev/SKILL.md"
Cohesion: 0.22
Nodes (7): Calibrating `stroke-dasharray` for your path, CSS, HTML usage, JavaScript orchestration, Success check, Tunable variables, When to use

### Community 8 - "structure/actions.ts"
Cohesion: 0.07
Nodes (67): AuditPage(), instant, metadata, InventoryRoute(), instant, metadata, StructurePage(), loadAuditLog() (+59 more)

### Community 9 - "dependencies"
Cohesion: 0.15
Nodes (13): clsx, dependencies, clsx, pg-boss, @radix-ui/react-checkbox, @radix-ui/react-popover, @radix-ui/react-scroll-area, @radix-ui/react-tooltip (+5 more)

### Community 10 - "Avatar group hover"
Cohesion: 0.22
Nodes (8): Avatar group hover, CSS, HTML usage, JavaScript orchestration, React form, Tunable variables, When to use, Why the timing-function is set inline before the variable writes

### Community 11 - "app/layout.tsx"
Cohesion: 0.25
Nodes (5): geistMono, geistSans, metadata, newsreader, Toaster()

### Community 12 - "devDependencies"
Cohesion: 0.29
Nodes (7): dotenv, eslint, devDependencies, dotenv, eslint, @testing-library/jest-dom, @testing-library/jest-dom

### Community 19 - "Error state shake"
Cohesion: 0.22
Nodes (8): CSS, Error state shake, HTML usage, JavaScript orchestration, Recomputing the keyframe stops, Tunable variables, When to use, Why three classes (`.is-error` on wrap + input, `.is-shaking` on input)

### Community 22 - "Decisions"
Cohesion: 0.18
Nodes (10): ADR-0001 — Next.js App Router monolith, monorepo-ready, ADR-0002 — Numeric money, frozen sold price, ADR-0003 — Better Auth + Drizzle, ADR-0004 — visx, not Recharts, ADR-0005 — Phosphor light, no Lucide, ADR-0006 — Graphify for the code graph, ADR-0007 — Whole-rupee asking price, ADR-0008 — Optimistic version lock on unit writes (+2 more)

### Community 23 - "Design"
Cohesion: 0.25
Nodes (7): Bans, Component rules, Design, Motion, References, Tokens, Typography

### Community 96 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 97 - "Card resize"
Cohesion: 0.29
Nodes (6): Card resize, CSS, HTML usage, JavaScript orchestration, Tunable variables, When to use

### Community 98 - "Number pop-in"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Number pop-in, Tunable variables, When to use

### Community 99 - "Notification badge"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Notification badge, Tunable variables, When to use

### Community 100 - "Text states swap"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Text states swap, Tunable variables, When to use

### Community 101 - "Menu dropdown"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Menu dropdown, Tunable variables, When to use

### Community 102 - "Modal open / close"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Modal open / close, Tunable variables, When to use

### Community 103 - "Panel reveal"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Panel reveal, Tunable variables, When to use

### Community 104 - "Page side-by-side"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Page side-by-side, Tunable variables, When to use

### Community 105 - "Icon swap"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, Icon swap, JavaScript orchestration, Tunable variables, When to use

### Community 106 - "Transitions.dev"
Cohesion: 0.29
Nodes (7): Common mistakes to avoid, Decision rules, Output format, Quick reference, Reference files, Transitions.dev, Universal install

### Community 107 - "Architecture"
Cohesion: 0.29
Nodes (6): Architecture, Auth and jobs, Caching, Feature-folder pattern, How to add a module, Layers

### Community 108 - "Sardar's Mall ERP"
Cohesion: 0.29
Nodes (6): Docs, Env, Regenerate the code graph, Sardar's Mall ERP, Scripts, Setup

### Community 109 - "Contributing"
Cohesion: 0.33
Nodes (5): Commits, Contributing, Hooks, Setup, Workflow

### Community 110 - "Data model"
Cohesion: 0.33
Nodes (5): Data model, Entities, ER diagram, Invariants, Unit fields

### Community 111 - "Web Interface Guidelines"
Cohesion: 0.40
Nodes (4): Guidelines Source, How It Works, Usage, Web Interface Guidelines

### Community 112 - "Import rules"
Cohesion: 0.40
Nodes (4): Cleaning, Import rules, Money, Re-import (diff mode)

### Community 113 - "Roadmap"
Cohesion: 0.50
Nodes (3): MVP (this scaffold), Next, Roadmap

### Community 115 - "units/schema.ts"
Cohesion: 0.07
Nodes (49): soldOnColumn, StatusHistory(), StatusHistoryProps, statusLabel(), toDefaults(), UnitForm(), UnitFormProps, UnitRead() (+41 more)

### Community 121 - "units/queries.ts"
Cohesion: 0.07
Nodes (46): instant, metadata, CommandMenu(), routes, units, searchUnits(), hrefFor(), InventoryScreen() (+38 more)

### Community 126 - "getSession"
Cohesion: 0.22
Nodes (8): AppGroupLayout(), LoginForm(), instant, LoginPage(), metadata, HomePage(), instant, getSession()

### Community 128 - "units/actions.ts"
Cohesion: 0.06
Nodes (50): { GET, POST }, Database, db, globalForDb, auditLog, rateHistory, archiveUnit(), asAuditJson() (+42 more)

## Knowledge Gaps
- **351 isolated node(s):** `eslintConfig`, `lintStagedConfig`, `nextConfig`, `sentryEnabled`, `name` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`, `better-auth`, `@better-auth/drizzle-adapter`, `@radix-ui/react-select`, `cmdk`, `drizzle-orm`, `class-variance-authority`, `exceljs`, `@hookform/resolvers`, `motion`, `next`, `@phosphor-icons/react`, `pino`, `postgres`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-separator`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-visually-hidden`, `react`, `react-dom`, `react-hook-form`, `@sentry/nextjs`, `server-only`, `sonner`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual`, `@visx/axis`, `@visx/event`, `@visx/grid`, `@visx/group`, `@visx/legend`, `@visx/responsive`, `@visx/scale`, `@visx/shape`, `@visx/tooltip`, `xlsx`, `zod`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`, `eslint-config-next`, `eslint-config-prettier`, `husky`, `jsdom`, `lint-staged`, `pino-pretty`, `prettier`, `prettier-plugin-tailwindcss`, `tailwindcss`, `@tailwindcss/turbopack`, `@testing-library/react`, `@testing-library/user-event`, `tsx`, `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `@vitejs/plugin-react`, `vitest`, `@playwright/test`, `@testing-library/dom`, `drizzle-kit`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `requireSession()` connect `structure/actions.ts` to `enums.ts`, `units/actions.ts`, `dashboard/page.tsx`, `unit-status-actions.tsx`, `units/queries.ts`, `getSession`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `requireSession()` (e.g. with `mockSession()` and `mockSession()`) actually correct?**
  _`requireSession()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `lintStagedConfig`, `nextConfig` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `enums.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052403846153846155 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._