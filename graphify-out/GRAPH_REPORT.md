# Graph Report - PropertyERP  (2026-11-06)

## Corpus Check
- 396 files · ~315,868 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2178 nodes · 6154 edges · 181 communities (100 shown, 81 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10e9e7a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- documents/actions.ts
- button.tsx
- better-auth
- enums.ts
- errorMessage
- structure/actions.ts
- validation.ts
- computeTotalPrice
- cleanup-e2e.ts
- installments/actions.ts
- documents/queries.ts
- sales/calculator.ts
- required.ts
- dotenv
- form-document.tsx
- compilerOptions
- requireSession
- sales/schema.ts
- bookings/new/page.tsx
- formatPkr
- render.ts
- audit-screen.tsx
- pingDatabase
- page-skeleton.tsx
- lib/auth.ts
- booking-detail-screen.tsx
- client-ledger/page.tsx
- units/actions.ts
- 5. Screen Patterns
- money.ts
- parseDecimal
- devDependencies
- scripts
- top-bar.tsx
- sidebar.tsx
- can
- skeleton.tsx
- browser-image-compression
- login-form.tsx
- ReportHeaderActions
- Decisions
- import/actions.ts
- users/actions.ts
- Handover
- unit-panel.tsx
- Agent instructions
- User guide
- Sardar's Mall ERP
- use-dashboard-query.ts
- UserRole
- receipts.ts
- transitions-dev/SKILL.md
- Avatar group hover
- Error state shake
- app/layout.tsx
- login-rate-limit.ts
- unit-form.tsx
- eslint
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
- sales/actions.ts
- Contributing
- Data model
- ReservationWizard
- error-state.tsx
- reports/queries.ts
- Web Interface Guidelines
- Import rules
- package.json
- @playwright/test
- prettier-plugin-tailwindcss
- (app)/page.tsx
- occupancy-chart.tsx
- reset-inventory.ts
- Roadmap
- lint-staged.config.mjs
- next.config.ts
- instrumentation.ts
- next
- dashboard/page.tsx
- proxy.ts
- @fontsource-variable/geist
- @types/react
- @radix-ui/react-scroll-area
- clsx
- (app)/layout.tsx
- PERMISSIONS.md
- exceljs
- assertCan
- drizzle-orm
- eslint.config.mjs
- structure/page.tsx
- eslint-config-prettier
- DocumentUpload
- @fontsource-variable/geist-mono
- husky
- jsdom
- lint-staged
- dependencies
- pg-boss
- @phosphor-icons/react
- pino
- postgres
- @radix-ui/react-checkbox
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-popover
- react-hook-form
- @radix-ui/react-separator
- @radix-ui/react-slot
- @radix-ui/react-tabs
- tailwind-merge
- @radix-ui/react-visually-hidden
- react
- react-dom
- setup-storage.ts
- parse.ts
- server-only
- sonner
- motion
- @tanstack/react-query
- @radix-ui/react-select
- @tanstack/react-table
- @visx/curve
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
- @testing-library/dom
- tailwindcss
- @testing-library/react
- DashboardFilters
- recordPayment
- cmdk
- @vitejs/plugin-react
- vitest
- prettier.config.mjs
- reports/schema.ts
- instrumentation-client.ts
- vercel.json
- @radix-ui/react-switch
- data-table.tsx
- auth-origin.ts
- @react-pdf/renderer
- @supabase/supabase-js
- @tanstack/react-virtual
- class-variance-authority
- @visx/group
- dashboard-aggregation.test.ts
- booking-wizard.tsx
- @better-auth/drizzle-adapter
- drizzle-kit

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 148 edges
2. `assertCan()` - 126 edges
3. `cn()` - 113 edges
4. `parseDecimal()` - 61 edges
5. `formatPkr()` - 56 edges
6. `UserRole` - 53 edges
7. `Button` - 51 edges
8. `formatPkrCompact()` - 45 edges
9. `can()` - 44 edges
10. `formatDecimal()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/structure.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/users.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/status.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/units.test.ts → src/lib/auth.ts
- `main()` --calls--> `isE2eStructureName()`  [EXTRACTED]
  scripts/cleanup-e2e.ts → src/lib/e2e-records.ts

## Import Cycles
- None detected.

## Communities (181 total, 81 thin omitted)

### Community 0 - "cn"
Cohesion: 0.05
Nodes (46): AnimatedNumber(), AnimatedNumberProps, DialogOverlay, DropdownMenu(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem (+38 more)

### Community 1 - "documents/actions.ts"
Cohesion: 0.14
Nodes (33): documentOwnerTypes, documentTypes, assertCanManageDocuments(), assertPathMatches(), assertStorageObjectsExist(), buildStoragePath(), clearCurrentDocument(), completeDocumentUpload() (+25 more)

### Community 2 - "button.tsx"
Cohesion: 0.11
Nodes (40): Button, ButtonProps, buttonVariants, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter() (+32 more)

### Community 4 - "enums.ts"
Cohesion: 0.07
Nodes (27): UnitStatusBadgeProps, AuditAction, auditActionEnum, auditActions, BookingStatus, bookingStatusEnum, discountTypeEnum, DocumentOwnerType (+19 more)

### Community 5 - "errorMessage"
Cohesion: 0.14
Nodes (16): initialLevel(), initialName(), StructurePanelForm(), handleArchive(), handleSubmit(), titleFor(), changeUnitStatus(), UnitCreateScreen() (+8 more)

### Community 6 - "structure/actions.ts"
Cohesion: 0.10
Nodes (39): archiveBlock(), archiveFloor(), archiveProperty(), asAuditJson(), AuditAction, countActiveUnitsOnBlock(), countActiveUnitsOnFloor(), countActiveUnitsOnProperty() (+31 more)

### Community 7 - "validation.ts"
Cohesion: 0.06
Nodes (66): POST(), ensureCategory(), cleanArea(), cleanCategoryName(), cleanFloorName(), cleanMoneyNumber(), cleanRow(), cleanStatus() (+58 more)

### Community 8 - "computeTotalPrice"
Cohesion: 0.19
Nodes (20): sql, getBlocksBreakdown(), buybackSale(), cancelReservation(), createBooking(), createDirectSale(), createReservation(), extendReservation() (+12 more)

### Community 9 - "cleanup-e2e.ts"
Cohesion: 0.07
Nodes (21): looksLikeProduction(), main(), E2E_STRUCTURE_NAME_PATTERN, E2E_UNIT_CODE_PATTERN, isE2eStructureName(), isE2eUnitCode(), assertTestDatabase(), isAllowProductionFlag() (+13 more)

### Community 10 - "installments/actions.ts"
Cohesion: 0.17
Nodes (13): paymentMethods, Tx, EditPaymentInput, editPaymentSchema, moneyPattern, RecordInstallmentPaymentInput, recordInstallmentPaymentSchema, RescheduleInstallmentsInput (+5 more)

### Community 11 - "documents/queries.ts"
Cohesion: 0.11
Nodes (20): clientDocuments, getDocumentSignedUrls(), DocumentsSection(), flushSlot(), ALLOWED_DOCUMENT_MIMES, ALLOWED_IMAGE_MIMES, CLIENT_DOCUMENTS_BUCKET, CLIENT_REQUIRED_DOC_TYPES (+12 more)

### Community 12 - "sales/calculator.ts"
Cohesion: 0.20
Nodes (12): addMonths(), calculateBuyback(), CalculatedDiscount, calculateDiscount(), generateSchedule(), InstallmentAllocation, InstallmentDraft, MAX_SALES_DISCOUNT_PERCENT (+4 more)

### Community 13 - "required.ts"
Cohesion: 0.40
Nodes (8): assertRequiredDocumentsForClient(), currentDocuments(), DocumentPresence, missingClientDocTypes(), missingKinDocTypes(), requiredDocumentErrorMessage(), createBookingSchema, requiredNextOfKinSchema

### Community 15 - "form-document.tsx"
Cohesion: 0.16
Nodes (13): BOOKING_FORM_CONTENT, COMPANY_LEGAL_NAME, dateLabel(), enclosureLines(), fillBlank(), FormalFormPdf(), FormPdfProps, legalPdfPlainText() (+5 more)

### Community 16 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 17 - "requireSession"
Cohesion: 0.11
Nodes (23): AuditPage(), instant, metadata, instant, metadata, ReservationsPage(), instant, metadata (+15 more)

### Community 18 - "sales/schema.ts"
Cohesion: 0.08
Nodes (23): bookingStatuses, discountTypes, paymentPlans, reservationStatuses, findClientByCnic(), handleSearchCnic(), BuybackSaleInput, clientRelationPrefixes (+15 more)

### Community 19 - "bookings/new/page.tsx"
Cohesion: 0.14
Nodes (16): instant, metadata, NewBookingPage(), generateMetadata(), instant, ReservationDetailPage(), instant, metadata (+8 more)

### Community 20 - "formatPkr"
Cohesion: 0.07
Nodes (40): Badge(), BadgeProps, badgeVariants, dotColors, BookedReportScreen(), BookedReportScreenProps, ClientLedgerScreenInner(), PRESET_LABELS (+32 more)

### Community 21 - "render.ts"
Cohesion: 0.28
Nodes (15): memoryCache, pdfCachePath(), readCachedPdf(), receiptCachePath(), rememberPdf(), writeCachedPdf(), registerPdfFonts(), embedDocs() (+7 more)

### Community 22 - "audit-screen.tsx"
Cohesion: 0.13
Nodes (20): Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, actionTone(), AuditScreen(), AuditScreenProps, diffFields() (+12 more)

### Community 25 - "lib/auth.ts"
Cohesion: 0.10
Nodes (21): maxDuration, maxDuration, instant, instant, userRoles, fullExportSheets(), serialize(), sheetFromRows() (+13 more)

### Community 26 - "booking-detail-screen.tsx"
Cohesion: 0.17
Nodes (24): PageHeader(), Checkbox, Select(), SelectContent, SelectGroup, SelectItem, SelectRoot, SelectTrigger (+16 more)

### Community 27 - "client-ledger/page.tsx"
Cohesion: 0.15
Nodes (10): ClientLedgerPage(), instant, metadata, getClientProfileAction(), searchClientsAction(), autoFormatCnic(), InstallmentsScreen(), handleSearchInputChange() (+2 more)

### Community 28 - "units/actions.ts"
Cohesion: 0.06
Nodes (55): auditLog, unitStatuses, archiveUnit(), asAuditJson(), assertUniqueCode(), createUnit(), loadCategory(), loadFloorProperty() (+47 more)

### Community 29 - "5. Screen Patterns"
Cohesion: 0.11
Nodes (17): 1. Dashboard (`/dashboard`), 1. Foundations & Tokens, 2. Inventory (`/inventory`), 2. Typography & Numerical Formatting, 3. App Shell Architecture, 3. Unit Detail & Edit Sheet, 4. Building Hierarchy (`/structure`), 4. UI Component Library (`src/components/ui/`) (+9 more)

### Community 30 - "money.ts"
Cohesion: 0.09
Nodes (29): DevUiScreen(), metadata, countNonCommas(), getCursorPosForNonCommas(), MoneyInput, MoneyInputProps, DashboardScreen(), formatRelativeTime() (+21 more)

### Community 31 - "parseDecimal"
Cohesion: 0.05
Nodes (82): GET(), InstallmentsPage(), instant, metadata, getDashboardStats(), DownPaymentReceiptPdf(), DownPaymentReceiptProps, money() (+74 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint-config-next, devDependencies, eslint-config-next, @tailwindcss/turbopack, @testing-library/jest-dom, @testing-library/user-event, tsx, @types/node (+9 more)

### Community 33 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, db:cleanup-e2e, db:cleanup-e2e:apply, db:generate, db:migrate, db:seed, db:studio (+9 more)

### Community 34 - "top-bar.tsx"
Cohesion: 0.18
Nodes (11): Breadcrumb, BreadcrumbContext, BreadcrumbProvider(), useBreadcrumbOverride(), BreadcrumbSet(), CommandMenu(), formatRole(), getBreadcrumbName() (+3 more)

### Community 35 - "sidebar.tsx"
Cohesion: 0.21
Nodes (13): formatRole(), getInitials(), navIcons, Sidebar(), SidebarProps, adminNav, allNavItems, AppNavItem (+5 more)

### Community 36 - "can"
Cohesion: 0.16
Nodes (15): ImportPage(), instant, metadata, instant, UsersRedirectPage(), asAuditJson(), commitImportBatch(), ensureBlock() (+7 more)

### Community 39 - "login-form.tsx"
Cohesion: 0.16
Nodes (8): LoginForm(), loginSchema, LoginValues, fadeUp(), FEATURES, heroEase, LoginScreen(), authClient

### Community 41 - "Decisions"
Cohesion: 0.17
Nodes (11): ADR-0001 — Next.js App Router monolith, monorepo-ready, ADR-0002 — Numeric money, frozen sold price, ADR-0003 — Better Auth + Drizzle, ADR-0004 — visx, not Recharts, ADR-0005 — Phosphor light, no Lucide, ADR-0006 — Graphify for the code graph, ADR-0007 — Whole-rupee asking price, ADR-0008 — Optimistic version lock on unit writes (+3 more)

### Community 42 - "import/actions.ts"
Cohesion: 0.17
Nodes (11): ensureFloor(), floorLevelFromName(), RecordedUnitChange, Tx, cleanedRowSchema, commitImportSchema, importColumnMappingSchema, importPreviewSchema (+3 more)

### Community 43 - "users/actions.ts"
Cohesion: 0.06
Nodes (49): PATCH(), GET(), POST(), instant, metadata, UsersSettingsPage(), session, ProfileScreenProps (+41 more)

### Community 44 - "Handover"
Cohesion: 0.18
Nodes (10): Architecture, Data rules, Handover, How to add a floor, How to add a unit, Known limitations, Preview deploys, Roles (+2 more)

### Community 45 - "unit-panel.tsx"
Cohesion: 0.14
Nodes (19): AppShellProps, Sheet, SheetBody(), SheetClose, SheetContent, SheetDescription, SheetFooter(), SheetHeader() (+11 more)

### Community 46 - "Agent instructions"
Cohesion: 0.20
Nodes (9): Agent instructions, Code graph, Commit attribution, Conventions, File-scoped commands, Layout, Package manager, Stack (+1 more)

### Community 47 - "User guide"
Cohesion: 0.20
Nodes (9): Export, Find a unit, If the page says the database is waking, Import, Reverse a sale, Sell a unit, Sign in, User guide (+1 more)

### Community 48 - "Sardar's Mall ERP"
Cohesion: 0.22
Nodes (8): Code graph, Deploy, Docs, Env, Migrate and seed, Sardar's Mall ERP, Scripts, Setup

### Community 49 - "use-dashboard-query.ts"
Cohesion: 0.15
Nodes (20): DashboardScreenProps, getDisplaySalesData(), SalesChartInner(), SalesChartInnerProps, SalesOverTimeChart(), DashboardData, useDashboardQuery(), BlockBreakdownRow (+12 more)

### Community 50 - "UserRole"
Cohesion: 0.08
Nodes (46): generateMetadata(), instant, generateMetadata(), icons, UserRole, inventoryExportRows(), BookingDetailScreenProps, ReservationDetailScreenProps (+38 more)

### Community 51 - "receipts.ts"
Cohesion: 0.05
Nodes (55): GET(), maxDuration, GET(), GET(), maxDuration, GET(), generateMetadata(), instant (+47 more)

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
Cohesion: 0.29
Nodes (6): metadata, preferredRegion, getQueryClient(), makeQueryClient(), QueryProvider(), Toaster()

### Community 56 - "login-rate-limit.ts"
Cohesion: 0.23
Nodes (13): assertLoginAllowed(), attempts, clearLoginFailures(), evaluateLoginRateLimit(), LOGIN_MAX_ATTEMPTS, LOGIN_RATE_LIMIT_MESSAGE, LOGIN_WINDOW_MS, LoginAttemptState (+5 more)

### Community 57 - "unit-form.tsx"
Cohesion: 0.09
Nodes (27): instant, UnitDetailPage(), Input, InputProps, Label, NumberInput, NumberInputProps, Textarea (+19 more)

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

### Community 71 - "sales/actions.ts"
Cohesion: 0.20
Nodes (10): GET(), expireReservationsCron(), Tx, buybackSaleSchema, cancelReservationSchema, createDirectSaleSchema, createReservationSchema, extendReservationSchema (+2 more)

### Community 72 - "Contributing"
Cohesion: 0.33
Nodes (5): Commits, Contributing, Hooks, Setup, Workflow

### Community 73 - "Data model"
Cohesion: 0.33
Nodes (5): Data model, Entities, ER diagram, Invariants, Unit fields

### Community 76 - "reports/queries.ts"
Cohesion: 0.11
Nodes (45): Database, db, globalForDb, account, user, verification, importBatches, blocks (+37 more)

### Community 77 - "Web Interface Guidelines"
Cohesion: 0.40
Nodes (4): Guidelines Source, How It Works, Usage, Web Interface Guidelines

### Community 78 - "Import rules"
Cohesion: 0.40
Nodes (4): Cleaning, Import rules, Money, Re-import (diff mode)

### Community 79 - "package.json"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 82 - "(app)/page.tsx"
Cohesion: 0.26
Nodes (11): DashboardPage(), instant, metadata, getDashboardData(), loadDashboard(), getDashboardBundle(), getDashboardFilterOptions(), getFloorsLedger() (+3 more)

### Community 83 - "occupancy-chart.tsx"
Cohesion: 0.40
Nodes (3): margin, OccupancyChartProps, OccupancyPoint

### Community 84 - "reset-inventory.ts"
Cohesion: 0.23
Nodes (8): hasFlag(), INVENTORY_AUDIT_ENTITIES, main(), maskDatabaseTarget(), NamedTable, preloadEnv(), runReset(), STRUCTURE_AUDIT_ENTITIES

### Community 85 - "Roadmap"
Cohesion: 0.50
Nodes (3): MVP (this scaffold), Next, Roadmap

### Community 87 - "next.config.ts"
Cohesion: 0.50
Nodes (3): nextConfig, securityHeaders, sentryEnabled

### Community 96 - "(app)/layout.tsx"
Cohesion: 0.20
Nodes (8): { GET, POST }, AppGroupLayout(), instant, MustChangePasswordGate(), AppShell(), auth, isFailedAuthResult(), signInEmail()

### Community 99 - "assertCan"
Cohesion: 0.12
Nodes (22): GET(), GET(), BookingDetailPage(), BookingsPage(), instant, metadata, instant, InventoryRoute() (+14 more)

### Community 102 - "structure/page.tsx"
Cohesion: 0.24
Nodes (10): instant, metadata, StructurePage(), hrefFor(), isArchiveResult(), StructureScreen(), handleArchiveFromPanel(), handleArchiveTarget() (+2 more)

### Community 104 - "DocumentUpload"
Cohesion: 0.48
Nodes (7): DocumentUpload(), handleFiles(), handleRemove(), makeThumb(), prepareFile(), queueFile(), isPassportPhotoType()

### Community 110 - "dependencies"
Cohesion: 0.13
Nodes (15): @hookform/resolvers, dependencies, @hookform/resolvers, @radix-ui/react-tooltip, react-easy-crop, @sentry/nextjs, sharp, @visx/axis (+7 more)

### Community 129 - "parse.ts"
Cohesion: 0.18
Nodes (14): cell(), HEADER_ALIASES, ImportDraftRow, keyOf(), looksLikeSummary(), mapHeaders(), parseImportGrid(), floorLabelForLevel() (+6 more)

### Community 151 - "DashboardFilters"
Cohesion: 0.60
Nodes (4): DashboardFilters(), handleBlockChange(), handlePropertyChange(), updateQuery()

### Community 152 - "recordPayment"
Cohesion: 0.38
Nodes (7): recordPayment(), returnBooking(), allocatePayment(), calculateRefund(), BookingDetailScreen(), handleRecordPayment(), handleReturnBooking()

### Community 157 - "reports/schema.ts"
Cohesion: 0.10
Nodes (22): BookedReportPage(), instant, metadata, InstallmentsReportPage(), instant, metadata, instant, metadata (+14 more)

### Community 164 - "vercel.json"
Cohesion: 0.50
Nodes (3): bom1, crons, regions

### Community 171 - "data-table.tsx"
Cohesion: 0.25
Nodes (7): DataTable(), DataTableProps, helper, inventoryColumns, InventoryRow, inventoryTableFeatures, numericAccessors

### Community 172 - "auth-origin.ts"
Cohesion: 0.67
Nodes (5): EnvLike, resolveAuthBaseURL(), resolveTrustedOrigins(), stripProtocol(), vercelOrigin()

### Community 179 - "dashboard-aggregation.test.ts"
Cohesion: 0.16
Nodes (23): GET(), applyDataRowStyles(), applyHeaderStyles(), escapeCsvField(), formatExportDate(), generateFloorSummaryCsv(), generateFloorSummaryExcel(), generateInventoryCsv() (+15 more)

### Community 180 - "booking-wizard.tsx"
Cohesion: 0.09
Nodes (32): DiscountType, DocumentType, PaymentPlan, ClientDocumentFields(), DocSlotMap, KinDocumentFields(), ExistingDocument, OwnerType (+24 more)

## Knowledge Gaps
- **574 isolated node(s):** `eslintConfig`, `lintStagedConfig`, `securityHeaders`, `nextConfig`, `sentryEnabled` (+569 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **81 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireSession()` connect `requireSession` to `documents/actions.ts`, `errorMessage`, `structure/actions.ts`, `validation.ts`, `computeTotalPrice`, `installments/actions.ts`, `documents/queries.ts`, `bookings/new/page.tsx`, `recordPayment`, `lib/auth.ts`, `client-ledger/page.tsx`, `units/actions.ts`, `reports/schema.ts`, `parseDecimal`, `can`, `import/actions.ts`, `users/actions.ts`, `UserRole`, `receipts.ts`, `unit-form.tsx`, `sales/actions.ts`, `(app)/page.tsx`, `assertCan`, `structure/page.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `button.tsx`, `sidebar.tsx`, `skeleton.tsx`, `structure/page.tsx`, `login-form.tsx`, `DocumentUpload`, `ReservationWizard`, `data-table.tsx`, `unit-panel.tsx`, `formatPkr`, `booking-wizard.tsx`, `audit-screen.tsx`, `recordPayment`, `unit-form.tsx`, `booking-detail-screen.tsx`, `client-ledger/page.tsx`, `money.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `assertCan()` connect `assertCan` to `documents/actions.ts`, `structure/actions.ts`, `validation.ts`, `computeTotalPrice`, `installments/actions.ts`, `documents/queries.ts`, `requireSession`, `bookings/new/page.tsx`, `recordPayment`, `lib/auth.ts`, `client-ledger/page.tsx`, `units/actions.ts`, `reports/schema.ts`, `parseDecimal`, `can`, `import/actions.ts`, `users/actions.ts`, `UserRole`, `receipts.ts`, `unit-form.tsx`, `sales/actions.ts`, `(app)/page.tsx`, `structure/page.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requireSession()` (e.g. with `mockSession()` and `mockSession()`) actually correct?**
  _`requireSession()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `lintStagedConfig`, `securityHeaders` to the rest of the system?**
  _574 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.04918032786885246 - nodes in this community are weakly interconnected._
- **Should `documents/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1411764705882353 - nodes in this community are weakly interconnected._