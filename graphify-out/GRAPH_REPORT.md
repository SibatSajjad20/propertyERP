# Graph Report - PropertyERP  (2026-10-30)

## Corpus Check
- 144 files · ~46,567 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 856 nodes · 1563 edges · 138 communities (65 shown, 73 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12866674`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- units.ts
- units/actions.ts
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
- eslint
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
- unit-form.tsx
- PERMISSIONS.md
- @playwright/test
- @testing-library/dom
- InventoryScreen
- units/queries.ts
- units/schema.ts
- inventory-screen.tsx
- lib/auth.ts
- permissions.ts
- status.test.ts
- structure-panel.tsx
- db/index.ts
- button.tsx
- errors.ts
- UserRole
- enums.ts
- units.test.ts
- users/page.tsx
- clsx

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
  tests/unit/units.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/structure.test.ts → src/lib/auth.ts
- `getDashboardStats()` --calls--> `sql`  [EXTRACTED]
  src/features/dashboard/queries.ts → src/db/index.ts
- `StatusCell()` --calls--> `cn()`  [EXTRACTED]
  src/features/units/components/inventory-table.tsx → src/lib/cn.ts

## Import Cycles
- None detected.

## Communities (138 total, 73 thin omitted)

### Community 0 - "units.ts"
Cohesion: 0.15
Nodes (19): UnitStatus, blocks, categories, floors, properties, rateHistory, unitPricing, DEFAULT_CATEGORIES (+11 more)

### Community 1 - "units/actions.ts"
Cohesion: 0.23
Nodes (15): archiveUnit(), asAuditJson(), assertUniqueCode(), changeUnitStatus(), createUnit(), loadCategory(), loadFloorProperty(), revalidateUnits() (+7 more)

### Community 2 - "dashboard/page.tsx"
Cohesion: 0.19
Nodes (10): DashboardPage(), instant, metadata, loadDashboard(), margin, OccupancyChart(), OccupancyChartProps, OccupancyPoint (+2 more)

### Community 3 - "Agent instructions"
Cohesion: 0.20
Nodes (9): Agent instructions, Code graph, Commit attribution, Conventions, File-scoped commands, Layout, Package manager, Stack (+1 more)

### Community 4 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 5 - "unit-status-actions.tsx"
Cohesion: 0.14
Nodes (15): DataTable(), DataTableProps, helper, inventoryColumns, InventoryRow, inventoryTableFeatures, numericAccessors, Badge() (+7 more)

### Community 6 - "scripts"
Cohesion: 0.11
Nodes (18): name, packageManager, private, scripts, build, db:generate, db:migrate, db:seed (+10 more)

### Community 7 - "transitions-dev/SKILL.md"
Cohesion: 0.22
Nodes (7): Calibrating `stroke-dasharray` for your path, CSS, HTML usage, JavaScript orchestration, Success check, Tunable variables, When to use

### Community 8 - "structure/actions.ts"
Cohesion: 0.09
Nodes (53): previewImport(), importPreviewSchema, archiveBlock(), archiveFloor(), archiveProperty(), asAuditJson(), AuditAction, countActiveUnitsOnBlock() (+45 more)

### Community 9 - "dependencies"
Cohesion: 0.15
Nodes (13): class-variance-authority, dependencies, class-variance-authority, pg-boss, @radix-ui/react-checkbox, @radix-ui/react-popover, @radix-ui/react-scroll-area, @radix-ui/react-tooltip (+5 more)

### Community 10 - "Avatar group hover"
Cohesion: 0.22
Nodes (8): Avatar group hover, CSS, HTML usage, JavaScript orchestration, React form, Tunable variables, When to use, Why the timing-function is set inline before the variable writes

### Community 11 - "app/layout.tsx"
Cohesion: 0.25
Nodes (5): geistMono, geistSans, metadata, newsreader, Toaster()

### Community 12 - "devDependencies"
Cohesion: 0.29
Nodes (7): dotenv, drizzle-kit, devDependencies, dotenv, drizzle-kit, @testing-library/jest-dom, @testing-library/jest-dom

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

### Community 115 - "unit-form.tsx"
Cohesion: 0.14
Nodes (26): soldOnColumn, StatusHistory(), StatusHistoryProps, statusLabel(), toDefaults(), UnitForm(), UnitFormProps, UnitRead() (+18 more)

### Community 120 - "InventoryScreen"
Cohesion: 0.54
Nodes (8): hrefFor(), InventoryScreen(), handleArchive(), handleSort(), handleSubmit(), push(), run(), inventoryQueryString()

### Community 121 - "units/queries.ts"
Cohesion: 0.10
Nodes (28): instant, InventoryRoute(), metadata, instant, metadata, UnitDetailPage(), CommandMenu(), routes (+20 more)

### Community 124 - "units/schema.ts"
Cohesion: 0.09
Nodes (21): unitStatuses, ArchiveUnitInput, archiveUnitSchema, areaSchema, ChangeUnitStatusInput, changeUnitStatusSchema, DECIMAL_PATTERN, defaultInventoryQuery (+13 more)

### Community 125 - "inventory-screen.tsx"
Cohesion: 0.13
Nodes (18): InventoryScreenProps, coreColumns, helper, InventoryTable(), inventoryTableFeatures, InventoryTableProps, numericAccessors, sortByColumn (+10 more)

### Community 126 - "lib/auth.ts"
Cohesion: 0.13
Nodes (14): { GET, POST }, AppGroupLayout(), LoginForm(), instant, LoginPage(), metadata, HomePage(), instant (+6 more)

### Community 127 - "permissions.ts"
Cohesion: 0.18
Nodes (13): AuditPage(), instant, metadata, instant, metadata, StructurePage(), loadAuditLog(), listAuditLog() (+5 more)

### Community 128 - "status.test.ts"
Cohesion: 0.18
Nodes (14): unitStatusHistory, assertTransition(), BOOKING_REF_REQUIRED_MESSAGE, canTransition(), NOT_SELLABLE_MESSAGE, REVERSE_REASON_MESSAGE, REVERSE_REASON_MIN, STATUS_TRANSITIONS (+6 more)

### Community 129 - "structure-panel.tsx"
Cohesion: 0.21
Nodes (14): initialLevel(), initialName(), panelKey(), StructurePanel(), StructurePanelForm(), handleArchive(), handleSubmit(), StructurePanelProps (+6 more)

### Community 130 - "db/index.ts"
Cohesion: 0.19
Nodes (9): ImportPage(), instant, metadata, Database, db, globalForDb, sql, importBatches (+1 more)

### Community 131 - "button.tsx"
Cohesion: 0.24
Nodes (7): loginSchema, LoginValues, TopBarProps, Button, ButtonProps, buttonVariants, authClient

### Community 132 - "errors.ts"
Cohesion: 0.22
Nodes (6): AppError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError

### Community 133 - "UserRole"
Cohesion: 0.23
Nodes (8): instant, AppShell(), AppShellProps, items, Sidebar(), SidebarProps, TopBar(), UserRole

### Community 134 - "enums.ts"
Cohesion: 0.23
Nodes (9): account, session, user, verification, AuditAction, auditActionEnum, auditActions, unitStatusEnum (+1 more)

### Community 135 - "units.test.ts"
Cohesion: 0.20
Nodes (10): auditLog, createUnitSchema, STALE_UNIT_MESSAGE, unitCodeSchema, updateUnitSchema, baseFields, currentUnit(), mockSession() (+2 more)

### Community 136 - "users/page.tsx"
Cohesion: 0.47
Nodes (4): instant, metadata, UsersPage(), listUsers()

## Knowledge Gaps
- **351 isolated node(s):** `eslintConfig`, `lintStagedConfig`, `nextConfig`, `sentryEnabled`, `name` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`, `clsx`, `better-auth`, `@better-auth/drizzle-adapter`, `@radix-ui/react-select`, `cmdk`, `drizzle-orm`, `exceljs`, `@hookform/resolvers`, `motion`, `next`, `@phosphor-icons/react`, `pino`, `postgres`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-separator`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-visually-hidden`, `react`, `react-dom`, `react-hook-form`, `@sentry/nextjs`, `server-only`, `sonner`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual`, `@visx/axis`, `@visx/event`, `@visx/grid`, `@visx/group`, `@visx/legend`, `@visx/responsive`, `@visx/scale`, `@visx/shape`, `@visx/tooltip`, `xlsx`, `zod`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`, `eslint`, `eslint-config-next`, `eslint-config-prettier`, `husky`, `jsdom`, `lint-staged`, `pino-pretty`, `prettier`, `prettier-plugin-tailwindcss`, `tailwindcss`, `@tailwindcss/turbopack`, `@testing-library/react`, `@testing-library/user-event`, `tsx`, `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `@vitejs/plugin-react`, `vitest`, `@playwright/test`, `@testing-library/dom`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `requireSession()` connect `structure/actions.ts` to `status.test.ts`, `units/actions.ts`, `dashboard/page.tsx`, `units.test.ts`, `users/page.tsx`, `units/queries.ts`, `lib/auth.ts`, `permissions.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `requireSession()` (e.g. with `mockSession()` and `mockSession()`) actually correct?**
  _`requireSession()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `lintStagedConfig`, `nextConfig` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `units.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._