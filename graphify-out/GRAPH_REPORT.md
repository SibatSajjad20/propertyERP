# Graph Report - PropertyERP  (2026-10-31)

## Corpus Check
- 239 files · ~125,371 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1335 nodes · 3148 edges · 151 communities (81 shown, 70 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b8c6cb44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- money.ts
- import/actions.ts
- users/actions.ts
- lib/auth.ts
- dashboard-aggregation.test.ts
- inventory/route.ts
- sidebar.tsx
- units/queries.ts
- compilerOptions
- structure/actions.ts
- inventory-screen.tsx
- cn.ts
- profile-screen.tsx
- users-screen.tsx
- nav.ts
- errors.ts
- errorMessage
- cn
- units/actions.ts
- enums.ts
- dashboard-screen.tsx
- 5. Screen Patterns
- audit-screen.tsx
- parse.ts
- devDependencies
- scripts
- permissions.ts
- requireSession
- dependencies
- UserRole
- Decisions
- skeleton.tsx
- units/schema.ts
- structure-screen.tsx
- Handover
- dashboard-filters.tsx
- Agent instructions
- User guide
- Sardar's Mall ERP
- users.test.ts
- transitions-dev/SKILL.md
- Avatar group hover
- Error state shake
- data-table.tsx
- top-bar.tsx
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
- users/route.ts
- class-variance-authority
- clsx
- @better-auth/drizzle-adapter
- PERMISSIONS.md
- structure.test.ts
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
- UsersScreen
- @visx/group
- @visx/legend
- @visx/responsive
- @visx/scale
- @visx/shape
- @visx/tooltip
- xlsx
- zod
- formatKarachiDateTime
- prettier
- tailwindcss
- @tailwindcss/turbopack
- @testing-library/react
- @types/node
- segmented-control.tsx
- typescript
- @vitejs/plugin-react
- vitest
- prettier.config.mjs
- instrumentation-client.ts
- success-check.tsx
- cmdk
- @tanstack/react-query
- @visx/grid
- pino-pretty
- @testing-library/dom
- @testing-library/jest-dom

## God Nodes (most connected - your core abstractions)
1. `cn()` - 79 edges
2. `requireSession()` - 78 edges
3. `assertCan()` - 64 edges
4. `UserRole` - 37 edges
5. `errorMessage()` - 28 edges
6. `can()` - 27 edges
7. `Button` - 24 edges
8. `db` - 22 edges
9. `formatPkrLedger()` - 21 edges
10. `formatPkrCompact()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/status.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/units.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/users.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/structure.test.ts → src/lib/auth.ts
- `main()` --calls--> `isE2eStructureName()`  [EXTRACTED]
  scripts/cleanup-e2e.ts → src/lib/e2e-records.ts

## Import Cycles
- None detected.

## Communities (151 total, 70 thin omitted)

### Community 0 - "money.ts"
Cohesion: 0.14
Nodes (25): generateMetadata(), generateMetadata(), UnitDetailPage(), Textarea, StatusHistory(), StatusHistoryProps, statusLabel(), UnitRead() (+17 more)

### Community 1 - "import/actions.ts"
Cohesion: 0.08
Nodes (54): POST(), ImportPage(), instant, metadata, asAuditJson(), commitImportBatch(), getImportBatches(), RecordedUnitChange (+46 more)

### Community 2 - "users/actions.ts"
Cohesion: 0.17
Nodes (19): PATCH(), session, asAuditJson(), countActiveAdmins(), publicUser(), resetUserPassword(), setUserDisabled(), updateUserRole() (+11 more)

### Community 3 - "lib/auth.ts"
Cohesion: 0.09
Nodes (33): { GET, POST }, AppGroupLayout(), instant, MustChangePasswordGate(), LoginForm(), LoginPage(), metadata, AppShell() (+25 more)

### Community 4 - "dashboard-aggregation.test.ts"
Cohesion: 0.16
Nodes (23): GET(), applyDataRowStyles(), applyHeaderStyles(), escapeCsvField(), formatExportDate(), generateFloorSummaryCsv(), generateFloorSummaryExcel(), generateInventoryCsv() (+15 more)

### Community 5 - "inventory/route.ts"
Cohesion: 0.23
Nodes (11): GET(), instant, GET(), instant, fullExportSheets(), inventoryExportRows(), serialize(), sheetFromRows() (+3 more)

### Community 6 - "sidebar.tsx"
Cohesion: 0.12
Nodes (19): formatRole(), getInitials(), navIcons, Sidebar(), SidebarProps, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent (+11 more)

### Community 7 - "units/queries.ts"
Cohesion: 0.07
Nodes (47): looksLikeProduction(), main(), Database, db, globalForDb, auditLog, account, user (+39 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 9 - "structure/actions.ts"
Cohesion: 0.15
Nodes (18): AuditAction, archiveBlockSchema, archiveFloorSchema, archivePropertySchema, CreateBlockInput, createBlockSchema, CreateFloorInput, createFloorSchema (+10 more)

### Community 10 - "inventory-screen.tsx"
Cohesion: 0.11
Nodes (27): AnimatedNumber(), AnimatedNumberProps, UnitStatus, getInventoryData(), getUnitDetail(), hrefFor(), InventoryScreen(), handleClearAllFilters() (+19 more)

### Community 11 - "cn.ts"
Cohesion: 0.15
Nodes (11): loginSchema, LoginValues, EmptyState(), EmptyStateProps, Input, InputProps, Label, NumberInput (+3 more)

### Community 12 - "profile-screen.tsx"
Cohesion: 0.21
Nodes (12): instant, metadata, ProfilePage(), asAuditJson(), changeOwnPassword(), updateOwnName(), ProfileScreen(), ProfileScreenProps (+4 more)

### Community 13 - "users-screen.tsx"
Cohesion: 0.17
Nodes (18): Badge(), BadgeProps, badgeVariants, dotColors, Dialog, DialogClose, DialogContent, DialogDescription (+10 more)

### Community 14 - "nav.ts"
Cohesion: 0.23
Nodes (9): CommandMenu(), icons, UnitJumpTarget, adminNav, allNavItems, AppNavItem, inventoryNav, visibleNav() (+1 more)

### Community 15 - "errors.ts"
Cohesion: 0.29
Nodes (6): AppError, ConflictError, errorCode(), errorStatus(), UnauthorizedError, jsonError()

### Community 16 - "errorMessage"
Cohesion: 0.07
Nodes (27): GET(), ErrorState(), NotFoundState(), pingDatabase(), initialLevel(), initialName(), panelKey(), StructurePanel() (+19 more)

### Community 17 - "cn"
Cohesion: 0.12
Nodes (21): AppShellProps, PageHeader(), Checkbox, Separator, Sheet, SheetBody(), SheetClose, SheetContent (+13 more)

### Community 18 - "units/actions.ts"
Cohesion: 0.08
Nodes (40): archiveUnit(), asAuditJson(), assertUniqueCode(), changeUnitStatus(), createUnit(), loadCategory(), loadFloorProperty(), revalidateUnits() (+32 more)

### Community 19 - "enums.ts"
Cohesion: 0.22
Nodes (8): AuditAction, auditActionEnum, auditActions, unitStatusEnum, unitStatuses, userRoleEnum, AuditFilterInput, auditFilterSchema

### Community 20 - "dashboard-screen.tsx"
Cohesion: 0.13
Nodes (31): DashboardPage(), instant, metadata, sql, getDashboardData(), loadDashboard(), DashboardFilters(), handleBlockChange() (+23 more)

### Community 21 - "5. Screen Patterns"
Cohesion: 0.11
Nodes (17): 1. Dashboard (`/dashboard`), 1. Foundations & Tokens, 2. Inventory (`/inventory`), 2. Typography & Numerical Formatting, 3. App Shell Architecture, 3. Unit Detail & Edit Sheet, 4. Building Hierarchy (`/structure`), 4. UI Component Library (`src/components/ui/`) (+9 more)

### Community 22 - "audit-screen.tsx"
Cohesion: 0.14
Nodes (18): FilterBar(), FilterBarProps, FilterChip(), FilterChipOption, FilterChipProps, Tooltip, TooltipContent, TooltipProvider (+10 more)

### Community 23 - "parse.ts"
Cohesion: 0.24
Nodes (10): cell(), HEADER_ALIASES, ImportDraftRow, keyOf(), looksLikeSummary(), mapHeaders(), parseImportGrid(), DECIMAL_PATTERN (+2 more)

### Community 24 - "devDependencies"
Cohesion: 0.12
Nodes (17): dotenv, eslint, devDependencies, dotenv, eslint, @playwright/test, prettier-plugin-tailwindcss, @testing-library/user-event (+9 more)

### Community 25 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, db:cleanup-e2e, db:cleanup-e2e:apply, db:generate, db:migrate, db:seed, db:studio (+8 more)

### Community 26 - "permissions.ts"
Cohesion: 0.19
Nodes (12): instant, metadata, StructurePage(), instant, UsersRedirectPage(), userRoles, getStructureScreenData(), ForbiddenError (+4 more)

### Community 27 - "requireSession"
Cohesion: 0.19
Nodes (17): AuditPage(), instant, metadata, instant, InventoryRoute(), metadata, EditUnitPage(), metadata (+9 more)

### Community 28 - "dependencies"
Cohesion: 0.15
Nodes (13): better-auth, @hookform/resolvers, dependencies, better-auth, @hookform/resolvers, postgres, @radix-ui/react-select, @radix-ui/react-separator (+5 more)

### Community 29 - "UserRole"
Cohesion: 0.22
Nodes (18): Button, ButtonProps, buttonVariants, UserRole, UnitCreateScreenProps, UnitEditScreenProps, toDefaults(), UnitForm() (+10 more)

### Community 30 - "Decisions"
Cohesion: 0.17
Nodes (11): ADR-0001 — Next.js App Router monolith, monorepo-ready, ADR-0002 — Numeric money, frozen sold price, ADR-0003 — Better Auth + Drizzle, ADR-0004 — visx, not Recharts, ADR-0005 — Phosphor light, no Lucide, ADR-0006 — Graphify for the code graph, ADR-0007 — Whole-rupee asking price, ADR-0008 — Optimistic version lock on unit writes (+3 more)

### Community 31 - "skeleton.tsx"
Cohesion: 0.24
Nodes (3): PageSkeleton(), Skeleton(), DashboardSkeleton()

### Community 32 - "units/schema.ts"
Cohesion: 0.12
Nodes (19): ArchiveUnitInput, archiveUnitSchema, areaSchema, ChangeUnitStatusInput, changeUnitStatusSchema, defaultInventoryQuery, InventoryQueryInput, inventoryQuerySchema (+11 more)

### Community 33 - "structure-screen.tsx"
Cohesion: 0.14
Nodes (28): archiveBlock(), archiveFloor(), archiveProperty(), asAuditJson(), countActiveUnitsOnBlock(), countActiveUnitsOnFloor(), countActiveUnitsOnProperty(), createBlock() (+20 more)

### Community 34 - "Handover"
Cohesion: 0.18
Nodes (10): Architecture, Data rules, Handover, How to add a floor, How to add a unit, Known limitations, Neon, Preview deploys (+2 more)

### Community 35 - "dashboard-filters.tsx"
Cohesion: 0.22
Nodes (13): Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue (+5 more)

### Community 36 - "Agent instructions"
Cohesion: 0.20
Nodes (9): Agent instructions, Code graph, Commit attribution, Conventions, File-scoped commands, Layout, Package manager, Stack (+1 more)

### Community 37 - "User guide"
Cohesion: 0.20
Nodes (9): Export, Find a unit, If the page says the database is waking, Import, Reverse a sale, Sell a unit, Sign in, User guide (+1 more)

### Community 38 - "Sardar's Mall ERP"
Cohesion: 0.20
Nodes (9): Code graph, Deploy, Docs, Env, Migrate and seed, Neon point-in-time restore, Sardar's Mall ERP, Scripts (+1 more)

### Community 39 - "users.test.ts"
Cohesion: 0.29
Nodes (9): assertActiveAdminRemains(), assertNotSelfDisable(), assertNotSelfRoleChange(), LAST_ADMIN_MESSAGE, nextActiveAdminCount(), SELF_DEMOTE_MESSAGE, SELF_DISABLE_MESSAGE, ValidationError (+1 more)

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

### Community 44 - "top-bar.tsx"
Cohesion: 0.29
Nodes (8): Breadcrumb, BreadcrumbContext, BreadcrumbProvider(), useBreadcrumbOverride(), BreadcrumbSet(), getBreadcrumbName(), TopBar(), TopBarProps

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

### Community 59 - "app/layout.tsx"
Cohesion: 0.33
Nodes (5): metadata, getQueryClient(), makeQueryClient(), QueryProvider(), Toaster()

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

### Community 70 - "users/route.ts"
Cohesion: 0.27
Nodes (8): GET(), POST(), instant, metadata, UsersSettingsPage(), createUser(), inviteUser(), listUsers()

### Community 75 - "structure.test.ts"
Cohesion: 0.54
Nodes (6): createFloor(), floorLabelForLevel(), normaliseFloorLabel(), ordinalSuffix(), SARDARS_MALL_FLOORS, WORD_LEVELS

### Community 113 - "UsersScreen"
Cohesion: 0.47
Nodes (6): getInitials(), roleBadge(), roleLabel(), UsersScreen(), closeDialog(), run()

### Community 122 - "formatKarachiDateTime"
Cohesion: 0.70
Nodes (3): formatKarachiDate(), formatKarachiDateTime(), part()

### Community 128 - "segmented-control.tsx"
Cohesion: 0.50
Nodes (3): SegmentedControl(), SegmentedControlOption, SegmentedControlProps

## Knowledge Gaps
- **424 isolated node(s):** `eslintConfig`, `lintStagedConfig`, `securityHeaders`, `nextConfig`, `sentryEnabled` (+419 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `segmented-control.tsx`, `money.ts`, `structure-screen.tsx`, `dashboard-filters.tsx`, `sidebar.tsx`, `inventory-screen.tsx`, `data-table.tsx`, `cn.ts`, `users-screen.tsx`, `success-check.tsx`, `audit-screen.tsx`, `UserRole`, `skeleton.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `UserRole` connect `UserRole` to `import/actions.ts`, `lib/auth.ts`, `dashboard-aggregation.test.ts`, `sidebar.tsx`, `units/queries.ts`, `users.test.ts`, `inventory-screen.tsx`, `structure.test.ts`, `top-bar.tsx`, `users-screen.tsx`, `nav.ts`, `cn`, `units/actions.ts`, `enums.ts`, `dashboard-screen.tsx`, `permissions.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `requireSession()` connect `requireSession` to `money.ts`, `import/actions.ts`, `structure-screen.tsx`, `users/actions.ts`, `lib/auth.ts`, `inventory/route.ts`, `users/route.ts`, `units/queries.ts`, `users.test.ts`, `structure/actions.ts`, `inventory-screen.tsx`, `structure.test.ts`, `profile-screen.tsx`, `units/actions.ts`, `dashboard-screen.tsx`, `permissions.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requireSession()` (e.g. with `mockSession()` and `mockSession()`) actually correct?**
  _`requireSession()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `lintStagedConfig`, `securityHeaders` to the rest of the system?**
  _424 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `money.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1411764705882353 - nodes in this community are weakly interconnected._
- **Should `import/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07884615384615384 - nodes in this community are weakly interconnected._