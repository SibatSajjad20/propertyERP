# Graph Report - PropertyERP  (2026-11-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1814 nodes · 4968 edges · 169 communities (95 shown, 74 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c909e95b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- dashboard-screen.tsx
- formatPkr
- errorMessage
- errors.ts
- formatPkrCompact
- structure/actions.ts
- import-screen.tsx
- enums.ts
- e2e-guard.ts
- assertCan
- requireSession
- direct-sale-screen.tsx
- page-skeleton.tsx
- booked-report-screen.tsx
- units/actions.ts
- compilerOptions
- users/actions.ts
- sales/actions.ts
- formatDecimal
- import/actions.ts
- lib/auth.ts
- audit-screen.tsx
- units.ts
- computeTotalPrice
- parseDecimal
- badge.tsx
- installments/actions.ts
- units/schema.ts
- 5. Screen Patterns
- inventory/page.tsx
- sales/calculator.ts
- devDependencies
- scripts
- dashboard/queries.ts
- nav.ts
- money.ts
- top-bar.tsx
- dependencies
- (app)/installments/page.tsx
- sheet.tsx
- Decisions
- import/page.tsx
- parse.ts
- Handover
- use-inventory-query.ts
- Agent instructions
- User guide
- Sardar's Mall ERP
- bookings/[id]/page.tsx
- login-form.tsx
- units.test.ts
- transitions-dev/SKILL.md
- Avatar group hover
- Error state shake
- app/layout.tsx
- (app)/layout.tsx
- sidebar.tsx
- data-table.tsx
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
- auth-origin.ts
- Contributing
- Data model
- filter-bar.tsx
- ClientLedgerScreen
- InventoryScreen
- Web Interface Guidelines
- Import rules
- package.json
- reservations/page.tsx
- (app)/sold/page.tsx
- structure/page.tsx
- occupancy-chart.tsx
- BookingWizard
- Roadmap
- lint-staged.config.mjs
- next.config.ts
- instrumentation.ts
- ui/page.tsx
- dashboard/page.tsx
- proxy.ts
- better-auth
- @better-auth/drizzle-adapter
- class-variance-authority
- clsx
- cmdk
- PERMISSIONS.md
- dotenv
- drizzle-kit
- drizzle-orm
- eslint.config.mjs
- eslint-config-next
- eslint-config-prettier
- exceljs
- @fontsource-variable/geist-mono
- @hookform/resolvers
- husky
- jsdom
- lint-staged
- next
- pg-boss
- @phosphor-icons/react
- pino
- postgres
- @radix-ui/react-checkbox
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-scroll-area
- @radix-ui/react-separator
- @radix-ui/react-slot
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
- @tanstack/react-query
- @tanstack/react-table
- @visx/axis
- @visx/curve
- @visx/event
- @visx/grid
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
- @testing-library/react
- @testing-library/user-event
- @types/node
- @types/react
- @vitejs/plugin-react
- vitest
- prettier.config.mjs
- instrumentation-client.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 128 edges
2. `assertCan()` - 114 edges
3. `cn()` - 107 edges
4. `parseDecimal()` - 52 edges
5. `formatPkr()` - 50 edges
6. `Button` - 46 edges
7. `formatPkrCompact()` - 45 edges
8. `UserRole` - 41 edges
9. `formatDecimal()` - 35 edges
10. `errorMessage()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/status.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/structure.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/units.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/users.test.ts → src/lib/auth.ts
- `DataTable()` --calls--> `cn()`  [EXTRACTED]
  src/components/data-table/data-table.tsx → src/lib/cn.ts

## Import Cycles
- None detected.

## Communities (169 total, 74 thin omitted)

### Community 0 - "cn"
Cohesion: 0.07
Nodes (60): PageHeader(), AnimatedNumber(), AnimatedNumberProps, Checkbox, DropdownMenu(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup (+52 more)

### Community 1 - "dashboard-screen.tsx"
Cohesion: 0.06
Nodes (59): GET(), DashboardPage(), instant, metadata, getDashboardData(), DashboardFilters(), handleBlockChange(), handlePropertyChange() (+51 more)

### Community 2 - "formatPkr"
Cohesion: 0.10
Nodes (44): Button, ButtonProps, buttonVariants, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter() (+36 more)

### Community 3 - "errorMessage"
Cohesion: 0.06
Nodes (39): ErrorState(), NotFoundState(), initialLevel(), initialName(), panelKey(), StructurePanel(), StructurePanelForm(), handleArchive() (+31 more)

### Community 4 - "errors.ts"
Cohesion: 0.06
Nodes (40): instant, metadata, ProfilePage(), userRoles, asAuditJson(), changeOwnPassword(), updateOwnName(), ProfileScreen() (+32 more)

### Community 5 - "formatPkrCompact"
Cohesion: 0.10
Nodes (37): instant, UnitDetailPage(), SheetHeader(), Textarea, UnitStatusBadge(), UnitStatusBadgeProps, UserRole, ReservationDetailScreenProps (+29 more)

### Community 6 - "structure/actions.ts"
Cohesion: 0.09
Nodes (45): archiveBlock(), archiveFloor(), archiveProperty(), asAuditJson(), AuditAction, countActiveUnitsOnBlock(), countActiveUnitsOnFloor(), countActiveUnitsOnProperty() (+37 more)

### Community 7 - "import-screen.tsx"
Cohesion: 0.11
Nodes (39): POST(), UnitStatus, cleanArea(), cleanCategoryName(), cleanFloorName(), cleanMoneyNumber(), cleanRow(), cleanStatus() (+31 more)

### Community 8 - "enums.ts"
Cohesion: 0.08
Nodes (40): AuditAction, auditActionEnum, auditActions, BookingStatus, bookingStatusEnum, bookingStatuses, discountTypeEnum, discountTypes (+32 more)

### Community 9 - "e2e-guard.ts"
Cohesion: 0.10
Nodes (12): looksLikeProduction(), main(), E2E_STRUCTURE_NAME_PATTERN, E2E_UNIT_CODE_PATTERN, isE2eStructureName(), isE2eUnitCode(), assertTestDatabase(), isAllowProductionFlag() (+4 more)

### Community 10 - "assertCan"
Cohesion: 0.12
Nodes (25): instant, metadata, NewBookingPage(), generateMetadata(), instant, ReservationDetailPage(), instant, metadata (+17 more)

### Community 11 - "requireSession"
Cohesion: 0.10
Nodes (30): AuditPage(), instant, metadata, BookedReportPage(), instant, metadata, ClientLedgerPage(), instant (+22 more)

### Community 12 - "direct-sale-screen.tsx"
Cohesion: 0.12
Nodes (25): Input, InputProps, Label, NumberInput, NumberInputProps, DiscountType, PaymentMethod, PaymentPlan (+17 more)

### Community 13 - "page-skeleton.tsx"
Cohesion: 0.08
Nodes (3): PageSkeleton(), Skeleton(), DashboardSkeleton()

### Community 14 - "booked-report-screen.tsx"
Cohesion: 0.10
Nodes (22): BookedReportScreen(), BookedReportScreenProps, ChartInner(), ChartInnerProps, CollectionsAreaChart(), MonthlyCollectionPoint, InstallmentsReportScreen(), InstallmentsReportScreenProps (+14 more)

### Community 15 - "units/actions.ts"
Cohesion: 0.11
Nodes (27): unitStatusHistory, getInventoryData(), Tx, useInventoryQuery(), bookPriceExpr(), inventorySelect, inventoryWhere(), listInventory() (+19 more)

### Community 16 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 17 - "users/actions.ts"
Cohesion: 0.14
Nodes (26): PATCH(), GET(), POST(), instant, metadata, UsersSettingsPage(), session, asAuditJson() (+18 more)

### Community 18 - "sales/actions.ts"
Cohesion: 0.10
Nodes (24): GET(), expireReservationsCron(), findClientByCnic(), Tx, handleConfirmSale(), BuybackSaleInput, buybackSaleSchema, cancelReservationSchema (+16 more)

### Community 19 - "formatDecimal"
Cohesion: 0.11
Nodes (24): editPayment(), parseInput(), recordInstallmentPayment(), rescheduleInstallments(), revalidateInstallmentPaths(), voidPayment(), calculateClientLedger(), ClientLedgerStatement (+16 more)

### Community 20 - "import/actions.ts"
Cohesion: 0.17
Nodes (15): db, auditLog, user, verification, importBatches, units, AuditLogFilter, subjectUser (+7 more)

### Community 21 - "lib/auth.ts"
Cohesion: 0.16
Nodes (20): { GET, POST }, auth, isFailedAuthResult(), RequireSessionOptions, Session, SessionUser, signInEmail(), assertLoginAllowed() (+12 more)

### Community 22 - "audit-screen.tsx"
Cohesion: 0.13
Nodes (19): Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, actionTone(), AuditScreen(), AuditScreenProps, diffFields() (+11 more)

### Community 23 - "units.ts"
Cohesion: 0.16
Nodes (19): account, blocks, categories, floors, properties, rateHistory, unitPricing, DEFAULT_CATEGORIES (+11 more)

### Community 24 - "computeTotalPrice"
Cohesion: 0.13
Nodes (23): buybackSale(), cancelReservation(), createDirectSale(), createReservation(), extendReservation(), nextReceiptNumber(), parseInput(), recordPayment() (+15 more)

### Community 25 - "parseDecimal"
Cohesion: 0.28
Nodes (21): GET(), ClientLedgerScreenProps, applyBrandHeader(), applyDataRowStyles(), applyTableHeaderStyles(), generateBookedUnitsExcel(), generateClientLedgerExcel(), generateInstallmentsExcel() (+13 more)

### Community 26 - "badge.tsx"
Cohesion: 0.13
Nodes (15): Badge(), BadgeProps, badgeVariants, dotColors, FilterTab, ImportPreviewTable(), ImportPreviewTableProps, PRESET_LABELS (+7 more)

### Community 27 - "installments/actions.ts"
Cohesion: 0.13
Nodes (15): nextReceiptNumber(), Tx, EditPaymentInput, editPaymentSchema, moneyPattern, RecordInstallmentPaymentInput, recordInstallmentPaymentSchema, RescheduleInstallmentsInput (+7 more)

### Community 28 - "units/schema.ts"
Cohesion: 0.11
Nodes (18): unitStatuses, ArchiveUnitInput, archiveUnitSchema, areaSchema, ChangeUnitStatusInput, changeUnitStatusSchema, defaultInventoryQuery, InventoryQueryInput (+10 more)

### Community 29 - "5. Screen Patterns"
Cohesion: 0.11
Nodes (17): 1. Dashboard (`/dashboard`), 1. Foundations & Tokens, 2. Inventory (`/inventory`), 2. Typography & Numerical Formatting, 3. App Shell Architecture, 3. Unit Detail & Edit Sheet, 4. Building Hierarchy (`/structure`), 4. UI Component Library (`src/components/ui/`) (+9 more)

### Community 30 - "inventory/page.tsx"
Cohesion: 0.17
Nodes (14): GET(), instant, GET(), instant, instant, InventoryRoute(), metadata, fullExportSheets() (+6 more)

### Community 31 - "sales/calculator.ts"
Cohesion: 0.17
Nodes (15): createBooking(), nextBookingNumber(), addMonths(), calculateBuyback(), CalculatedDiscount, calculateDiscount(), generateSchedule(), InstallmentAllocation (+7 more)

### Community 32 - "devDependencies"
Cohesion: 0.13
Nodes (16): eslint, devDependencies, eslint, @playwright/test, @tailwindcss/turbopack, @testing-library/dom, @testing-library/jest-dom, tsx (+8 more)

### Community 33 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, db:cleanup-e2e, db:cleanup-e2e:apply, db:generate, db:migrate, db:seed, db:studio (+8 more)

### Community 34 - "dashboard/queries.ts"
Cohesion: 0.21
Nodes (12): GET(), Database, globalForDb, pingDatabase(), sql, DashboardBundle, getBlocksBreakdown(), getDashboardStats() (+4 more)

### Community 35 - "nav.ts"
Cohesion: 0.21
Nodes (11): CommandMenu(), icons, UnitJumpTarget, adminNav, allNavItems, AppNavItem, inventoryNav, reportsNav (+3 more)

### Community 36 - "money.ts"
Cohesion: 0.25
Nodes (10): countNonCommas(), getCursorPosForNonCommas(), MoneyInput, MoneyInputProps, cleanMoneyInput(), divRoundHalfUp(), formatMoneyInput(), FormatMoneyOptions (+2 more)

### Community 37 - "top-bar.tsx"
Cohesion: 0.23
Nodes (10): Breadcrumb, BreadcrumbContext, BreadcrumbProvider(), useBreadcrumbOverride(), BreadcrumbSet(), formatRole(), getBreadcrumbName(), getInitials() (+2 more)

### Community 38 - "dependencies"
Cohesion: 0.15
Nodes (13): @fontsource-variable/geist, motion, dependencies, @fontsource-variable/geist, motion, @radix-ui/react-select, @radix-ui/react-switch, @tanstack/react-virtual (+5 more)

### Community 39 - "(app)/installments/page.tsx"
Cohesion: 0.19
Nodes (9): InstallmentsPage(), instant, metadata, getClientProfileAction(), autoFormatCnic(), InstallmentsScreen(), handleSearchInputChange(), getClientProfileWithBookings() (+1 more)

### Community 40 - "sheet.tsx"
Cohesion: 0.19
Nodes (11): AppShellProps, Sheet, SheetBody(), SheetClose, SheetContent, SheetDescription, SheetFooter(), SheetOverlay (+3 more)

### Community 41 - "Decisions"
Cohesion: 0.17
Nodes (11): ADR-0001 — Next.js App Router monolith, monorepo-ready, ADR-0002 — Numeric money, frozen sold price, ADR-0003 — Better Auth + Drizzle, ADR-0004 — visx, not Recharts, ADR-0005 — Phosphor light, no Lucide, ADR-0006 — Graphify for the code graph, ADR-0007 — Whole-rupee asking price, ADR-0008 — Optimistic version lock on unit writes (+3 more)

### Community 42 - "import/page.tsx"
Cohesion: 0.23
Nodes (11): ImportPage(), instant, metadata, asAuditJson(), commitImportBatch(), getImportBatches(), rollbackLatestBatch(), uploadAndParseSpreadsheet() (+3 more)

### Community 43 - "parse.ts"
Cohesion: 0.24
Nodes (10): cell(), HEADER_ALIASES, ImportDraftRow, keyOf(), looksLikeSummary(), mapHeaders(), parseImportGrid(), DECIMAL_PATTERN (+2 more)

### Community 44 - "Handover"
Cohesion: 0.18
Nodes (10): Architecture, Data rules, Handover, How to add a floor, How to add a unit, Known limitations, Neon, Preview deploys (+2 more)

### Community 45 - "use-inventory-query.ts"
Cohesion: 0.22
Nodes (10): generateMetadata(), generateMetadata(), getUnitDetail(), InventoryQueryResult, useInventoryOptionsQuery(), useUnitDetailQuery(), computedPriceExpr(), getUnitById() (+2 more)

### Community 46 - "Agent instructions"
Cohesion: 0.20
Nodes (9): Agent instructions, Code graph, Commit attribution, Conventions, File-scoped commands, Layout, Package manager, Stack (+1 more)

### Community 47 - "User guide"
Cohesion: 0.20
Nodes (9): Export, Find a unit, If the page says the database is waking, Import, Reverse a sale, Sell a unit, Sign in, User guide (+1 more)

### Community 48 - "Sardar's Mall ERP"
Cohesion: 0.20
Nodes (9): Code graph, Deploy, Docs, Env, Migrate and seed, Neon point-in-time restore, Sardar's Mall ERP, Scripts (+1 more)

### Community 49 - "bookings/[id]/page.tsx"
Cohesion: 0.17
Nodes (12): BookingDetailPage(), generateMetadata(), instant, BookingsPage(), instant, metadata, generateMetadata(), instant (+4 more)

### Community 50 - "login-form.tsx"
Cohesion: 0.24
Nodes (6): LoginForm(), loginSchema, LoginValues, instant, metadata, authClient

### Community 51 - "units.test.ts"
Cohesion: 0.22
Nodes (9): createUnitSchema, STALE_UNIT_MESSAGE, unitCodeSchema, updateUnitSchema, baseFields, currentUnit(), mockSession(), mockTx() (+1 more)

### Community 52 - "transitions-dev/SKILL.md"
Cohesion: 0.22
Nodes (7): Calibrating `stroke-dasharray` for your path, CSS, HTML usage, JavaScript orchestration, Success check, Tunable variables, When to use

### Community 53 - "Avatar group hover"
Cohesion: 0.22
Nodes (8): Avatar group hover, CSS, HTML usage, JavaScript orchestration, React form, Tunable variables, When to use, Why the timing-function is set inline before the variable writes

### Community 54 - "Error state shake"
Cohesion: 0.22
Nodes (8): CSS, Error state shake, HTML usage, JavaScript orchestration, Recomputing the keyframe stops, Tunable variables, When to use, Why three classes (`.is-error` on wrap + input, `.is-shaking` on input)

### Community 55 - "app/layout.tsx"
Cohesion: 0.33
Nodes (5): metadata, getQueryClient(), makeQueryClient(), QueryProvider(), Toaster()

### Community 56 - "(app)/layout.tsx"
Cohesion: 0.32
Nodes (6): AppGroupLayout(), instant, MustChangePasswordGate(), LoginPage(), AppShell(), getSession

### Community 57 - "sidebar.tsx"
Cohesion: 0.32
Nodes (6): formatRole(), getInitials(), navIcons, Sidebar(), SidebarProps, DropdownMenuSeparator

### Community 58 - "data-table.tsx"
Cohesion: 0.25
Nodes (7): DataTable(), DataTableProps, helper, inventoryColumns, InventoryRow, inventoryTableFeatures, numericAccessors

### Community 59 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 60 - "Card resize"
Cohesion: 0.29
Nodes (6): Card resize, CSS, HTML usage, JavaScript orchestration, Tunable variables, When to use

### Community 61 - "Number pop-in"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Number pop-in, Tunable variables, When to use

### Community 62 - "Notification badge"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Notification badge, Tunable variables, When to use

### Community 63 - "Text states swap"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Text states swap, Tunable variables, When to use

### Community 64 - "Menu dropdown"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Menu dropdown, Tunable variables, When to use

### Community 65 - "Modal open / close"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Modal open / close, Tunable variables, When to use

### Community 66 - "Panel reveal"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Panel reveal, Tunable variables, When to use

### Community 67 - "Page side-by-side"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Page side-by-side, Tunable variables, When to use

### Community 68 - "Icon swap"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, Icon swap, JavaScript orchestration, Tunable variables, When to use

### Community 69 - "Transitions.dev"
Cohesion: 0.29
Nodes (7): Common mistakes to avoid, Decision rules, Output format, Quick reference, Reference files, Transitions.dev, Universal install

### Community 70 - "Architecture"
Cohesion: 0.29
Nodes (6): Architecture, Auth and jobs, Caching, Feature-folder pattern, How to add a module, Layers

### Community 71 - "auth-origin.ts"
Cohesion: 0.67
Nodes (5): EnvLike, resolveAuthBaseURL(), resolveTrustedOrigins(), stripProtocol(), vercelOrigin()

### Community 72 - "Contributing"
Cohesion: 0.33
Nodes (5): Commits, Contributing, Hooks, Setup, Workflow

### Community 73 - "Data model"
Cohesion: 0.33
Nodes (5): Data model, Entities, ER diagram, Invariants, Unit fields

### Community 74 - "filter-bar.tsx"
Cohesion: 0.33
Nodes (5): FilterBar(), FilterBarProps, FilterChip(), FilterChipOption, FilterChipProps

### Community 76 - "InventoryScreen"
Cohesion: 0.53
Nodes (6): hrefFor(), InventoryScreen(), handleClearAllFilters(), handleSort(), updateQuery(), inventoryQueryString()

### Community 77 - "Web Interface Guidelines"
Cohesion: 0.40
Nodes (4): Guidelines Source, How It Works, Usage, Web Interface Guidelines

### Community 78 - "Import rules"
Cohesion: 0.40
Nodes (4): Cleaning, Import rules, Money, Re-import (diff mode)

### Community 79 - "package.json"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 80 - "reservations/page.tsx"
Cohesion: 0.50
Nodes (4): instant, metadata, ReservationsPage(), listReservations()

### Community 81 - "(app)/sold/page.tsx"
Cohesion: 0.50
Nodes (4): instant, metadata, SoldPage(), listSoldUnits()

### Community 82 - "structure/page.tsx"
Cohesion: 0.50
Nodes (4): instant, metadata, StructurePage(), getStructureScreenData()

### Community 83 - "occupancy-chart.tsx"
Cohesion: 0.40
Nodes (3): margin, OccupancyChartProps, OccupancyPoint

### Community 85 - "Roadmap"
Cohesion: 0.50
Nodes (3): MVP (this scaffold), Next, Roadmap

### Community 87 - "next.config.ts"
Cohesion: 0.50
Nodes (3): nextConfig, securityHeaders, sentryEnabled

## Knowledge Gaps
- **527 isolated node(s):** `EmptyStateProps`, `SuccessCheckProps`, `ImportUploadDropzoneProps`, `SegmentedControlOption`, `SegmentedControlProps` (+522 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `formatPkr`, `badge.tsx`, `money.ts`, `formatPkrCompact`, `structure/actions.ts`, `(app)/installments/page.tsx`, `sheet.tsx`, `filter-bar.tsx`, `ClientLedgerScreen`, `direct-sale-screen.tsx`, `page-skeleton.tsx`, `booked-report-screen.tsx`, `BookingWizard`, `audit-screen.tsx`, `computeTotalPrice`, `sidebar.tsx`, `data-table.tsx`, `sales/calculator.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `requireSession()` connect `requireSession` to `dashboard-screen.tsx`, `errorMessage`, `errors.ts`, `formatPkrCompact`, `structure/actions.ts`, `import-screen.tsx`, `assertCan`, `units/actions.ts`, `users/actions.ts`, `sales/actions.ts`, `formatDecimal`, `import/actions.ts`, `lib/auth.ts`, `computeTotalPrice`, `parseDecimal`, `installments/actions.ts`, `inventory/page.tsx`, `sales/calculator.ts`, `(app)/installments/page.tsx`, `import/page.tsx`, `use-inventory-query.ts`, `bookings/[id]/page.tsx`, `units.test.ts`, `(app)/layout.tsx`, `reservations/page.tsx`, `(app)/sold/page.tsx`, `structure/page.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `assertCan()` connect `assertCan` to `dashboard-screen.tsx`, `errorMessage`, `errors.ts`, `formatPkrCompact`, `structure/actions.ts`, `import-screen.tsx`, `requireSession`, `units/actions.ts`, `users/actions.ts`, `sales/actions.ts`, `formatDecimal`, `import/actions.ts`, `computeTotalPrice`, `parseDecimal`, `installments/actions.ts`, `inventory/page.tsx`, `sales/calculator.ts`, `(app)/installments/page.tsx`, `import/page.tsx`, `use-inventory-query.ts`, `bookings/[id]/page.tsx`, `units.test.ts`, `reservations/page.tsx`, `(app)/sold/page.tsx`, `structure/page.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requireSession()` (e.g. with `mockSession()` and `mockSession()`) actually correct?**
  _`requireSession()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `EmptyStateProps`, `SuccessCheckProps`, `ImportUploadDropzoneProps` to the rest of the system?**
  _527 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06511761331038439 - nodes in this community are weakly interconnected._
- **Should `dashboard-screen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06219918548685672 - nodes in this community are weakly interconnected._