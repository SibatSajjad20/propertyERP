# Graph Report - PropertyERP  (2026-10-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1297 nodes · 2961 edges · 143 communities (74 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `685082cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- units/schema.ts
- import-screen.tsx
- users/actions.ts
- lib/auth.ts
- can
- errorMessage
- users-screen.tsx
- e2e-guard.ts
- compilerOptions
- structure/actions.ts
- dashboard/queries.ts
- cn
- requireSession
- structure-screen.tsx
- nav.ts
- status.test.ts
- error-state.tsx
- structure-panel.tsx
- units/actions.ts
- enums.ts
- dashboard-screen.tsx
- 5. Screen Patterns
- audit-screen.tsx
- structure.test.ts
- devDependencies
- scripts
- permissions.ts
- import/actions.ts
- dependencies
- button.tsx
- Decisions
- skeleton.tsx
- profile-screen.tsx
- assertCan
- Handover
- structure/page.tsx
- Agent instructions
- User guide
- Sardar's Mall ERP
- units/queries.ts
- transitions-dev/SKILL.md
- Avatar group hover
- Error state shake
- data-table.tsx
- seed.ts
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
- Contributing
- Data model
- app/layout.tsx
- Web Interface Guidelines
- Import rules
- package.json
- occupancy-chart.tsx
- Roadmap
- lint-staged.config.mjs
- next.config.ts
- instrumentation.ts
- dashboard/page.tsx
- proxy.ts
- better-auth
- class-variance-authority
- clsx
- @better-auth/drizzle-adapter
- PERMISSIONS.md
- dotenv
- drizzle-kit
- drizzle-orm
- eslint.config.mjs
- eslint-config-next
- eslint-config-prettier
- exceljs
- @fontsource-variable/geist
- @fontsource-variable/geist-mono
- husky
- jsdom
- lint-staged
- motion
- next
- pg-boss
- @phosphor-icons/react
- pino
- @radix-ui/react-checkbox
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-scroll-area
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-tooltip
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
- @visx/group
- @visx/legend
- @visx/responsive
- @visx/scale
- @visx/shape
- @visx/tooltip
- xlsx
- zod
- @playwright/test
- prettier
- tailwindcss
- @tailwindcss/turbopack
- @testing-library/react
- @types/node
- @types/react
- typescript
- @vitejs/plugin-react
- vitest
- prettier.config.mjs
- instrumentation-client.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 75 edges
2. `requireSession()` - 70 edges
3. `assertCan()` - 56 edges
4. `UserRole` - 33 edges
5. `can()` - 27 edges
6. `errorMessage()` - 26 edges
7. `db` - 22 edges
8. `Button` - 22 edges
9. `computeTotalPrice()` - 18 edges
10. `compilerOptions` - 18 edges

## Surprising Connections (you probably didn't know these)
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/users.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/status.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/structure.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/units.test.ts → src/lib/auth.ts
- `AppShellProps` --references--> `UserRole`  [EXTRACTED]
  src/components/app-shell/app-shell.tsx → src/db/schema/enums.ts

## Import Cycles
- None detected.

## Communities (143 total, 69 thin omitted)

### Community 0 - "units/schema.ts"
Cohesion: 0.05
Nodes (71): SidebarProps, Checkbox, unitStatuses, UserRole, InventoryScreenProps, helper, InventoryTable(), inventoryTableFeatures (+63 more)

### Community 1 - "import-screen.tsx"
Cohesion: 0.09
Nodes (46): POST(), asAuditJson(), commitImportBatch(), rollbackLatestBatch(), uploadAndParseSpreadsheet(), cleanArea(), cleanCategoryName(), cleanFloorName() (+38 more)

### Community 2 - "users/actions.ts"
Cohesion: 0.08
Nodes (44): PATCH(), GET(), POST(), instant, metadata, UsersSettingsPage(), session, asAuditJson() (+36 more)

### Community 3 - "lib/auth.ts"
Cohesion: 0.08
Nodes (34): { GET, POST }, AppGroupLayout(), instant, MustChangePasswordGate(), LoginForm(), instant, LoginPage(), metadata (+26 more)

### Community 4 - "can"
Cohesion: 0.12
Nodes (33): GET(), DashboardPage(), instant, metadata, sql, applyDataRowStyles(), applyHeaderStyles(), escapeCsvField() (+25 more)

### Community 5 - "errorMessage"
Cohesion: 0.09
Nodes (35): GET(), instant, GET(), instant, instant, InventoryRoute(), metadata, generateMetadata() (+27 more)

### Community 6 - "users-screen.tsx"
Cohesion: 0.11
Nodes (27): formatRole(), getInitials(), navIcons, Sidebar(), DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup (+19 more)

### Community 7 - "e2e-guard.ts"
Cohesion: 0.11
Nodes (12): looksLikeProduction(), main(), E2E_STRUCTURE_NAME_PATTERN, E2E_UNIT_CODE_PATTERN, isE2eStructureName(), isE2eUnitCode(), assertTestDatabase(), isAllowProductionFlag() (+4 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 9 - "structure/actions.ts"
Cohesion: 0.10
Nodes (27): archiveFloor(), asAuditJson(), AuditAction, countActiveUnitsOnBlock(), countActiveUnitsOnFloor(), countActiveUnitsOnProperty(), activeUnitsArchiveMessage(), ArchiveKind (+19 more)

### Community 10 - "dashboard/queries.ts"
Cohesion: 0.21
Nodes (17): Database, db, globalForDb, UnitStatus, importBatches, blocks, categories, floors (+9 more)

### Community 11 - "cn"
Cohesion: 0.13
Nodes (18): PageHeader(), Input, InputProps, NumberInput, NumberInputProps, SegmentedControl(), SegmentedControlOption, SegmentedControlProps (+10 more)

### Community 12 - "requireSession"
Cohesion: 0.11
Nodes (22): ImportPage(), instant, metadata, instant, metadata, ProfilePage(), instant, UsersRedirectPage() (+14 more)

### Community 13 - "structure-screen.tsx"
Cohesion: 0.14
Nodes (20): Badge(), BadgeProps, badgeVariants, dotColors, Dialog, DialogClose, DialogContent, DialogDescription (+12 more)

### Community 14 - "nav.ts"
Cohesion: 0.13
Nodes (17): Breadcrumb, BreadcrumbContext, BreadcrumbProvider(), useBreadcrumbOverride(), BreadcrumbSet(), CommandMenu(), icons, getBreadcrumbName() (+9 more)

### Community 15 - "status.test.ts"
Cohesion: 0.13
Nodes (16): assertTransition(), BOOKING_REF_REQUIRED_MESSAGE, canTransition(), NOT_SELLABLE_MESSAGE, REVERSE_REASON_MESSAGE, STATUS_TRANSITIONS, AppError, ConflictError (+8 more)

### Community 16 - "error-state.tsx"
Cohesion: 0.15
Nodes (8): GET(), ErrorState(), NotFoundState(), pingDatabase(), isTransientDbError(), sleep(), WAKING_DB_MESSAGE, withDbRetry()

### Community 17 - "structure-panel.tsx"
Cohesion: 0.13
Nodes (20): AppShellProps, Sheet, SheetBody(), SheetClose, SheetContent, SheetDescription, SheetFooter(), SheetHeader() (+12 more)

### Community 18 - "units/actions.ts"
Cohesion: 0.19
Nodes (21): archiveUnit(), asAuditJson(), assertUniqueCode(), changeUnitStatus(), createUnit(), loadCategory(), loadFloorProperty(), revalidateUnits() (+13 more)

### Community 19 - "enums.ts"
Cohesion: 0.19
Nodes (12): auditLog, user, verification, AuditAction, auditActionEnum, auditActions, unitStatusEnum, userRoleEnum (+4 more)

### Community 20 - "dashboard-screen.tsx"
Cohesion: 0.16
Nodes (18): DashboardFilters(), handleBlockChange(), handlePropertyChange(), updateQuery(), DashboardFiltersProps, DashboardScreen(), DashboardScreenProps, formatRelativeTime() (+10 more)

### Community 21 - "5. Screen Patterns"
Cohesion: 0.11
Nodes (17): 1. Dashboard (`/dashboard`), 1. Foundations & Tokens, 2. Inventory (`/inventory`), 2. Typography & Numerical Formatting, 3. App Shell Architecture, 3. Unit Detail & Edit Sheet, 4. Building Hierarchy (`/structure`), 4. UI Component Library (`src/components/ui/`) (+9 more)

### Community 22 - "audit-screen.tsx"
Cohesion: 0.20
Nodes (13): Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, AuditScreen(), AuditScreenProps, diffFields(), FIELD_LABELS (+5 more)

### Community 23 - "structure.test.ts"
Cohesion: 0.23
Nodes (13): cell(), HEADER_ALIASES, ImportDraftRow, keyOf(), looksLikeSummary(), mapHeaders(), parseImportGrid(), floorLabelForLevel() (+5 more)

### Community 24 - "devDependencies"
Cohesion: 0.13
Nodes (16): eslint, devDependencies, eslint, pino-pretty, prettier-plugin-tailwindcss, @testing-library/dom, @testing-library/jest-dom, @testing-library/user-event (+8 more)

### Community 25 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, db:cleanup-e2e, db:cleanup-e2e:apply, db:generate, db:migrate, db:seed, db:studio (+8 more)

### Community 26 - "permissions.ts"
Cohesion: 0.20
Nodes (10): AuditPage(), instant, metadata, userRoles, loadAuditLog(), listAuditLog(), ForbiddenError, actions (+2 more)

### Community 27 - "import/actions.ts"
Cohesion: 0.20
Nodes (9): RecordedUnitChange, Tx, cleanedRowSchema, commitImportSchema, importColumnMappingSchema, importPreviewSchema, rollbackBatchSchema, globalForBoss (+1 more)

### Community 28 - "dependencies"
Cohesion: 0.15
Nodes (13): cmdk, @hookform/resolvers, dependencies, cmdk, @hookform/resolvers, postgres, @radix-ui/react-select, @radix-ui/react-separator (+5 more)

### Community 29 - "button.tsx"
Cohesion: 0.19
Nodes (10): Button, ButtonProps, buttonVariants, FilterBar(), FilterBarProps, FilterChip(), FilterChipOption, FilterChipProps (+2 more)

### Community 30 - "Decisions"
Cohesion: 0.17
Nodes (11): ADR-0001 — Next.js App Router monolith, monorepo-ready, ADR-0002 — Numeric money, frozen sold price, ADR-0003 — Better Auth + Drizzle, ADR-0004 — visx, not Recharts, ADR-0005 — Phosphor light, no Lucide, ADR-0006 — Graphify for the code graph, ADR-0007 — Whole-rupee asking price, ADR-0008 — Optimistic version lock on unit writes (+3 more)

### Community 31 - "skeleton.tsx"
Cohesion: 0.24
Nodes (3): PageSkeleton(), Skeleton(), DashboardSkeleton()

### Community 32 - "profile-screen.tsx"
Cohesion: 0.26
Nodes (8): loginSchema, LoginValues, Label, ProfileScreenProps, ChangeOwnPasswordInput, changeOwnPasswordSchema, UpdateOwnNameInput, updateOwnNameSchema

### Community 33 - "assertCan"
Cohesion: 0.45
Nodes (12): archiveBlock(), archiveProperty(), createBlock(), createFloor(), createProperty(), revalidateStructure(), updateBlock(), updateFloor() (+4 more)

### Community 34 - "Handover"
Cohesion: 0.18
Nodes (10): Architecture, Data rules, Handover, How to add a floor, How to add a unit, Known limitations, Neon, Preview deploys (+2 more)

### Community 35 - "structure/page.tsx"
Cohesion: 0.24
Nodes (10): instant, metadata, StructurePage(), hrefFor(), isArchiveResult(), StructureScreen(), handleArchiveFromPanel(), handleArchiveTarget() (+2 more)

### Community 36 - "Agent instructions"
Cohesion: 0.20
Nodes (9): Agent instructions, Code graph, Commit attribution, Conventions, File-scoped commands, Layout, Package manager, Stack (+1 more)

### Community 37 - "User guide"
Cohesion: 0.20
Nodes (9): Export, Find a unit, If the page says the database is waking, Import, Reverse a sale, Sell a unit, Sign in, User guide (+1 more)

### Community 38 - "Sardar's Mall ERP"
Cohesion: 0.20
Nodes (9): Code graph, Deploy, Docs, Env, Migrate and seed, Neon point-in-time restore, Sardar's Mall ERP, Scripts (+1 more)

### Community 39 - "units/queries.ts"
Cohesion: 0.31
Nodes (9): unitPricing, bookPriceExpr(), inventorySelect, inventoryWhere(), listInventory(), listInventoryRows(), searchUnitsByCode(), sortColumn() (+1 more)

### Community 40 - "transitions-dev/SKILL.md"
Cohesion: 0.22
Nodes (7): Calibrating `stroke-dasharray` for your path, CSS, HTML usage, JavaScript orchestration, Success check, Tunable variables, When to use

### Community 41 - "Avatar group hover"
Cohesion: 0.22
Nodes (8): Avatar group hover, CSS, HTML usage, JavaScript orchestration, React form, Tunable variables, When to use, Why the timing-function is set inline before the variable writes

### Community 42 - "Error state shake"
Cohesion: 0.22
Nodes (8): CSS, Error state shake, HTML usage, JavaScript orchestration, Recomputing the keyframe stops, Tunable variables, When to use, Why three classes (`.is-error` on wrap + input, `.is-shaking` on input)

### Community 43 - "data-table.tsx"
Cohesion: 0.25
Nodes (7): DataTable(), DataTableProps, helper, inventoryColumns, InventoryRow, inventoryTableFeatures, numericAccessors

### Community 44 - "seed.ts"
Cohesion: 0.36
Nodes (7): account, DEFAULT_CATEGORIES, ensureUser(), envOr(), seed(), SeedUser, seedDevUnits()

### Community 45 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 46 - "Card resize"
Cohesion: 0.29
Nodes (6): Card resize, CSS, HTML usage, JavaScript orchestration, Tunable variables, When to use

### Community 47 - "Number pop-in"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Number pop-in, Tunable variables, When to use

### Community 48 - "Notification badge"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Notification badge, Tunable variables, When to use

### Community 49 - "Text states swap"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Text states swap, Tunable variables, When to use

### Community 50 - "Menu dropdown"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Menu dropdown, Tunable variables, When to use

### Community 51 - "Modal open / close"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Modal open / close, Tunable variables, When to use

### Community 52 - "Panel reveal"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Panel reveal, Tunable variables, When to use

### Community 53 - "Page side-by-side"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Page side-by-side, Tunable variables, When to use

### Community 54 - "Icon swap"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, Icon swap, JavaScript orchestration, Tunable variables, When to use

### Community 55 - "Transitions.dev"
Cohesion: 0.29
Nodes (7): Common mistakes to avoid, Decision rules, Output format, Quick reference, Reference files, Transitions.dev, Universal install

### Community 56 - "Architecture"
Cohesion: 0.29
Nodes (6): Architecture, Auth and jobs, Caching, Feature-folder pattern, How to add a module, Layers

### Community 57 - "Contributing"
Cohesion: 0.33
Nodes (5): Commits, Contributing, Hooks, Setup, Workflow

### Community 58 - "Data model"
Cohesion: 0.33
Nodes (5): Data model, Entities, ER diagram, Invariants, Unit fields

### Community 60 - "Web Interface Guidelines"
Cohesion: 0.40
Nodes (4): Guidelines Source, How It Works, Usage, Web Interface Guidelines

### Community 61 - "Import rules"
Cohesion: 0.40
Nodes (4): Cleaning, Import rules, Money, Re-import (diff mode)

### Community 62 - "package.json"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 63 - "occupancy-chart.tsx"
Cohesion: 0.40
Nodes (3): margin, OccupancyChartProps, OccupancyPoint

### Community 64 - "Roadmap"
Cohesion: 0.50
Nodes (3): MVP (this scaffold), Next, Roadmap

### Community 66 - "next.config.ts"
Cohesion: 0.50
Nodes (3): nextConfig, securityHeaders, sentryEnabled

## Knowledge Gaps
- **420 isolated node(s):** `InventoryScreenProps`, `StatusHistoryProps`, `StatusMode`, `ArchiveUnitInput`, `ChangeUnitStatusInput` (+415 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `units/schema.ts`, `profile-screen.tsx`, `structure/page.tsx`, `users-screen.tsx`, `data-table.tsx`, `structure-screen.tsx`, `structure-panel.tsx`, `audit-screen.tsx`, `button.tsx`, `skeleton.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `requireSession()` connect `requireSession` to `import-screen.tsx`, `users/actions.ts`, `structure/page.tsx`, `can`, `errorMessage`, `assertCan`, `lib/auth.ts`, `structure/actions.ts`, `status.test.ts`, `units/actions.ts`, `enums.ts`, `structure.test.ts`, `permissions.ts`, `import/actions.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `assertCan()` connect `assertCan` to `import-screen.tsx`, `users/actions.ts`, `structure/page.tsx`, `can`, `errorMessage`, `structure/actions.ts`, `requireSession`, `status.test.ts`, `units/actions.ts`, `enums.ts`, `structure.test.ts`, `permissions.ts`, `import/actions.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requireSession()` (e.g. with `mockSession()` and `mockSession()`) actually correct?**
  _`requireSession()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `InventoryScreenProps`, `StatusHistoryProps`, `StatusMode` to the rest of the system?**
  _420 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `units/schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05396825396825397 - nodes in this community are weakly interconnected._
- **Should `import-screen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09294199860237597 - nodes in this community are weakly interconnected._