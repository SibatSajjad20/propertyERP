# Graph Report - PropertyERP  (2026-11-18)

## Corpus Check
- 424 files · ~365,095 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2350 nodes · 7048 edges · 187 communities (109 shown, 78 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2c9f8f65`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- documents/actions.ts
- button.tsx
- units/schema.ts
- enums.ts
- errorMessage
- structure/actions.ts
- validation.ts
- parseDecimal
- guardEnvironment
- db
- getSupabaseServer
- merge-actions.ts
- required.ts
- export/queries.ts
- form-document.tsx
- compilerOptions
- requireSession
- sales/schema.ts
- BookingWizard
- formatPkrCompact
- render.ts
- audit-screen.tsx
- edit/page.tsx
- page-skeleton.tsx
- permissions.ts
- booking-detail-screen.tsx
- client-ledger/page.tsx
- units/actions.ts
- 5. Screen Patterns
- agreements/actions.ts
- installments/actions.ts
- devDependencies
- scripts
- UserRole
- sidebar.tsx
- can
- receipt-math.ts
- browser-image-compression
- getSession
- ReportHeaderActions
- Decisions
- import/actions.ts
- users/actions.ts
- Handover
- unit-panel.tsx
- Agent instructions
- User guide
- Sardar's Mall ERP
- InventoryScreen
- units/types.ts
- receipts.ts
- transitions-dev/SKILL.md
- Avatar group hover
- Error state shake
- app/layout.tsx
- lib/auth.ts
- money.ts
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
- agreement-document.tsx
- Contributing
- Data model
- formatPkr
- error-state.tsx
- units.ts
- Web Interface Guidelines
- Import rules
- package.json
- @playwright/test
- prettier-plugin-tailwindcss
- dashboard/queries.ts
- occupancy-chart.tsx
- db/index.ts
- Roadmap
- lint-staged.config.mjs
- next.config.ts
- instrumentation.ts
- next
- proxy.ts
- @fontsource-variable/geist
- @types/react
- @radix-ui/react-scroll-area
- clsx
- units/queries.ts
- PERMISSIONS.md
- exceljs
- inventory/page.tsx
- drizzle-orm
- eslint.config.mjs
- booking/[id]/pdf/route.ts
- eslint-config-prettier
- constants.ts
- @fontsource-variable/geist-mono
- load-summary.ts
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
- agreement/[id]/pdf/route.ts
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
- agreements/queries.ts
- CameraCaptureDialog
- cmdk
- @vitejs/plugin-react
- vitest
- prettier.config.mjs
- [type]/route.ts
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
- ClientLedgerScreenInner
- dashboard-screen.tsx
- booking-wizard.tsx
- MergeUnitsDialog
- agreements/page.tsx
- @better-auth/drizzle-adapter
- drizzle-kit
- @hookform/resolvers
- @tailwindcss/turbopack

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 168 edges
2. `assertCan()` - 146 edges
3. `cn()` - 113 edges
4. `parseDecimal()` - 93 edges
5. `formatPkr()` - 67 edges
6. `Button` - 57 edges
7. `UserRole` - 57 edges
8. `formatDecimal()` - 55 edges
9. `can()` - 48 edges
10. `formatPkrCompact()` - 46 edges

## Surprising Connections (you probably didn't know these)
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/status.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/structure.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/units.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/users.test.ts → src/lib/auth.ts
- `cleanupTestData()` --calls--> `isE2eUnitCode()`  [EXTRACTED]
  tests/e2e/e2e-guard.ts → src/lib/e2e-records.ts

## Import Cycles
- None detected.

## Communities (187 total, 78 thin omitted)

### Community 0 - "cn"
Cohesion: 0.05
Nodes (51): LoginForm(), loginSchema, LoginValues, AnimatedNumber(), AnimatedNumberProps, DialogOverlay, DropdownMenu(), DropdownMenuCheckboxItem (+43 more)

### Community 1 - "documents/actions.ts"
Cohesion: 0.15
Nodes (29): DocumentType, assertCanManageDocuments(), assertPathMatches(), assertStorageObjectsExist(), buildStoragePath(), clearCurrentDocument(), completeDocumentUpload(), createDocumentUploadUrl() (+21 more)

### Community 2 - "button.tsx"
Cohesion: 0.19
Nodes (25): Button, ButtonProps, buttonVariants, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter() (+17 more)

### Community 3 - "units/schema.ts"
Cohesion: 0.07
Nodes (28): unitStatuses, ArchiveUnitInput, archiveUnitSchema, areaSchema, ChangeUnitStatusInput, changeUnitStatusSchema, createUnitSchema, defaultInventoryQuery (+20 more)

### Community 4 - "enums.ts"
Cohesion: 0.06
Nodes (43): agreementStatusEnum, agreementStatuses, auditActionEnum, auditActions, BookingStatus, bookingStatusEnum, discountTypeEnum, DocumentOwnerType (+35 more)

### Community 5 - "errorMessage"
Cohesion: 0.15
Nodes (18): initialLevel(), initialName(), panelKey(), StructurePanel(), StructurePanelForm(), handleArchive(), handleSubmit(), StructurePanelProps (+10 more)

### Community 6 - "structure/actions.ts"
Cohesion: 0.06
Nodes (59): cell(), HEADER_ALIASES, ImportDraftRow, keyOf(), looksLikeSummary(), mapHeaders(), parseImportGrid(), archiveBlock() (+51 more)

### Community 7 - "validation.ts"
Cohesion: 0.06
Nodes (67): POST(), UnitStatusBadgeProps, UnitStatus, cleanArea(), cleanCategoryName(), cleanFloorName(), cleanMoneyNumber(), cleanRow() (+59 more)

### Community 8 - "parseDecimal"
Cohesion: 0.10
Nodes (52): GET(), sql, InstallmentType, getDashboardStats(), summarizeBookingSurcharges(), buybackSale(), cancelReservation(), createBooking() (+44 more)

### Community 9 - "guardEnvironment"
Cohesion: 0.10
Nodes (10): cleanupTestData(), guardEnvironment(), fillClientIdentity(), fillKinIdentity(), jpegFixture(), selectUnitByCode(), uploadDocSlot(), uploadKinDocs() (+2 more)

### Community 10 - "db"
Cohesion: 0.14
Nodes (19): looksLikeProduction(), main(), db, documentCounters, DOCUMENT_COUNTER_KEY, DocumentNumbers, formatReceiptNo(), padReceiptSerial() (+11 more)

### Community 11 - "getSupabaseServer"
Cohesion: 0.19
Nodes (15): clientDocuments, CLIENT_DOCUMENTS_BUCKET, thumbnailStoragePath(), downloadImage(), downscale(), EmbeddedImage, embedStorageImage(), loadSignedUrlsForDocumentIds() (+7 more)

### Community 12 - "merge-actions.ts"
Cohesion: 0.12
Nodes (18): rateHistory, extFromMime(), Tx, ApproveMergeRequestInput, approveMergeRequestSchema, createMergeProofUrlSchema, CreateMergeRequestInput, createMergeRequestSchema (+10 more)

### Community 13 - "required.ts"
Cohesion: 0.22
Nodes (14): assertRequiredDocumentsForClient(), CLIENT_REQUIRED_DOC_TYPES, KIN_REQUIRED_DOC_TYPES, currentDocuments(), DocumentPresence, missingClientDocTypes(), missingKinDocTypes(), requiredDocumentErrorMessage() (+6 more)

### Community 14 - "export/queries.ts"
Cohesion: 0.24
Nodes (8): auditLog, user, verification, AuditAction, importBatches, properties, AuditLogFilter, subjectUser

### Community 15 - "form-document.tsx"
Cohesion: 0.07
Nodes (40): BOOKING_FORM_CONTENT, COMPANY_LEGAL_NAME, dateLabel(), enclosureLines(), fillBlank(), FormalFormPdf(), FormPdfProps, legalPdfPlainText() (+32 more)

### Community 16 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 17 - "requireSession"
Cohesion: 0.07
Nodes (49): AuditPage(), metadata, NewBookingPage(), BookingsPage(), metadata, generateMetadata(), ReservationDetailPage(), metadata (+41 more)

### Community 18 - "sales/schema.ts"
Cohesion: 0.07
Nodes (26): bookingStatuses, discountTypes, paymentPlans, reservationStatuses, BuybackSaleInput, buybackSaleSchema, cancelReservationSchema, clientRelationPrefixes (+18 more)

### Community 19 - "BookingWizard"
Cohesion: 0.15
Nodes (15): DocumentsSection(), flushSlot(), collectPending(), flushPendingUploads(), BookingWizard(), flushWizardDocs(), handleConfirmBooking(), nextStep() (+7 more)

### Community 20 - "formatPkrCompact"
Cohesion: 0.05
Nodes (55): DevUiScreen(), metadata, Badge(), BadgeProps, badgeVariants, dotColors, FilterTab, ImportPreviewTable() (+47 more)

### Community 21 - "render.ts"
Cohesion: 0.26
Nodes (16): FORM_PDF_LAYOUT_VERSION, memoryCache, pdfCachePath(), readCachedPdf(), receiptCachePath(), rememberPdf(), writeCachedPdf(), registerPdfFonts() (+8 more)

### Community 22 - "audit-screen.tsx"
Cohesion: 0.11
Nodes (22): metadata, Tooltip, TooltipProvider, TooltipTrigger, actionTone(), AuditScreen(), AuditScreenProps, diffFields() (+14 more)

### Community 23 - "edit/page.tsx"
Cohesion: 0.16
Nodes (13): InventoryMergesPage(), metadata, EditUnitPage(), generateMetadata(), generateMetadata(), metadata, NewUnitPage(), UnitCreateScreen() (+5 more)

### Community 24 - "page-skeleton.tsx"
Cohesion: 0.08
Nodes (3): PageSkeleton(), Skeleton(), DashboardSkeleton()

### Community 25 - "permissions.ts"
Cohesion: 0.16
Nodes (11): userRoles, listSchema, AppError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError (+3 more)

### Community 26 - "booking-detail-screen.tsx"
Cohesion: 0.24
Nodes (17): PageHeader(), Select(), SelectContent, SelectGroup, SelectItem, SelectRoot, SelectTrigger, SelectValue (+9 more)

### Community 27 - "client-ledger/page.tsx"
Cohesion: 0.13
Nodes (14): InstallmentsPage(), metadata, ClientLedgerPage(), metadata, getClientProfileAction(), searchClientsAction(), autoFormatCnic(), InstallmentsScreen() (+6 more)

### Community 28 - "units/actions.ts"
Cohesion: 0.12
Nodes (29): archiveUnit(), asAuditJson(), assertUniqueCode(), createUnit(), loadCategory(), loadFloorProperty(), revalidateUnits(), soldFieldsLocked() (+21 more)

### Community 29 - "5. Screen Patterns"
Cohesion: 0.11
Nodes (17): 1. Dashboard (`/dashboard`), 1. Foundations & Tokens, 2. Inventory (`/inventory`), 2. Typography & Numerical Formatting, 3. App Shell Architecture, 3. Unit Detail & Edit Sheet, 4. Building Hierarchy (`/structure`), 4. UI Component Library (`src/components/ui/`) (+9 more)

### Community 30 - "agreements/actions.ts"
Cohesion: 0.16
Nodes (15): createAgreement(), createSignedAgreementUploadUrl(), extForAgreementMime(), nextAgreementNumber(), Tx, AgreementDetailScreen(), handleSaveDetails(), handleUploadSignedFile() (+7 more)

### Community 31 - "installments/actions.ts"
Cohesion: 0.05
Nodes (53): paymentCategories, paymentMethods, editPayment(), nextReceiptNumber(), parseInput(), recordInstallmentPayment(), rescheduleInstallments(), revalidateInstallmentPaths() (+45 more)

### Community 32 - "devDependencies"
Cohesion: 0.12
Nodes (17): dotenv, eslint-config-next, devDependencies, dotenv, eslint-config-next, @testing-library/jest-dom, @testing-library/user-event, tsx (+9 more)

### Community 33 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, db:cleanup-e2e, db:cleanup-e2e:apply, db:generate, db:migrate, db:seed, db:studio (+9 more)

### Community 34 - "UserRole"
Cohesion: 0.13
Nodes (22): Breadcrumb, BreadcrumbContext, BreadcrumbProvider(), useBreadcrumbOverride(), BreadcrumbSet(), SidebarProps, UserRole, BookingDetailScreenProps (+14 more)

### Community 35 - "sidebar.tsx"
Cohesion: 0.11
Nodes (22): CommandMenu(), icons, formatRole(), getInitials(), navIcons, Sidebar(), formatRole(), getBreadcrumbName() (+14 more)

### Community 36 - "can"
Cohesion: 0.17
Nodes (13): ImportPage(), metadata, CompanySettingsPage(), metadata, metadata, StructurePage(), UsersRedirectPage(), listImportBatches() (+5 more)

### Community 37 - "receipt-math.ts"
Cohesion: 0.24
Nodes (15): computeDownPaymentPlan(), computeReceiptTotals(), DEFAULT_DOWN_PAYMENT_PERCENT, divRoundHalfUp(), DownPaymentPlanKind, EXCESS_NOTE, isPositiveAmount(), PAYMENT_MODE_LABELS (+7 more)

### Community 39 - "getSession"
Cohesion: 0.14
Nodes (11): GET(), maxDuration, GET(), maxDuration, fadeUp(), FEATURES, heroEase, LoginScreen() (+3 more)

### Community 41 - "Decisions"
Cohesion: 0.17
Nodes (11): ADR-0001 — Next.js App Router monolith, monorepo-ready, ADR-0002 — Numeric money, frozen sold price, ADR-0003 — Better Auth + Drizzle, ADR-0004 — visx, not Recharts, ADR-0005 — Phosphor light, no Lucide, ADR-0006 — Graphify for the code graph, ADR-0007 — Whole-rupee asking price, ADR-0008 — Optimistic version lock on unit writes (+3 more)

### Community 42 - "import/actions.ts"
Cohesion: 0.20
Nodes (14): asAuditJson(), commitImportBatch(), ensureBlock(), ensureCategory(), ensureFloor(), floorLevelFromName(), RecordedUnitChange, Tx (+6 more)

### Community 43 - "users/actions.ts"
Cohesion: 0.07
Nodes (48): PATCH(), GET(), POST(), metadata, UsersSettingsPage(), session, ProfileScreenProps, ChangeOwnPasswordInput (+40 more)

### Community 44 - "Handover"
Cohesion: 0.18
Nodes (10): Architecture, Data rules, Handover, How to add a floor, How to add a unit, Known limitations, Preview deploys, Roles (+2 more)

### Community 45 - "unit-panel.tsx"
Cohesion: 0.13
Nodes (18): AppGroupLayout(), MustChangePasswordGate(), AppShell(), AppShellProps, Sheet, SheetBody(), SheetClose, SheetContent (+10 more)

### Community 46 - "Agent instructions"
Cohesion: 0.20
Nodes (9): Agent instructions, Code graph, Commit attribution, Conventions, File-scoped commands, Layout, Package manager, Stack (+1 more)

### Community 47 - "User guide"
Cohesion: 0.20
Nodes (9): Export, Find a unit, If the page says the database is waking, Import, Reverse a sale, Sell a unit, Sign in, User guide (+1 more)

### Community 48 - "Sardar's Mall ERP"
Cohesion: 0.22
Nodes (8): Code graph, Deploy, Docs, Env, Migrate and seed, Sardar's Mall ERP, Scripts, Setup

### Community 49 - "InventoryScreen"
Cohesion: 0.48
Nodes (7): hrefFor(), InventoryScreen(), handleClearAllFilters(), handleSelectSection(), handleSort(), updateQuery(), inventoryQueryString()

### Community 50 - "units/types.ts"
Cohesion: 0.15
Nodes (21): getInventoryData(), getInventoryOptions(), getUnitDetail(), InventoryTableProps, MergeUnitsDialogProps, UnitReadProps, UnitStatusActionsProps, inventoryKey() (+13 more)

### Community 51 - "receipts.ts"
Cohesion: 0.13
Nodes (26): BookingDetailPage(), generateMetadata(), generateMetadata(), SoldDetailPage(), companySettings, receipts, DEFAULT_BOOKING_OFFICE, installmentTypeLabel() (+18 more)

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

### Community 56 - "lib/auth.ts"
Cohesion: 0.16
Nodes (20): { GET, POST }, auth, isFailedAuthResult(), RequireSessionOptions, Session, SessionUser, signInEmail(), assertLoginAllowed() (+12 more)

### Community 57 - "money.ts"
Cohesion: 0.15
Nodes (17): Input, InputProps, Label, countNonCommas(), getCursorPosForNonCommas(), MoneyInput, MoneyInputProps, NumberInput (+9 more)

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

### Community 71 - "agreement-document.tsx"
Cohesion: 0.19
Nodes (11): AgreementPdfProps, AgreementPdfScheduleRow, formatDateParts(), relationLong(), SalePurchaseAgreementPdf(), styles, AGREEMENT_BANK_DETAILS, AGREEMENT_CLAUSES (+3 more)

### Community 72 - "Contributing"
Cohesion: 0.33
Nodes (5): Commits, Contributing, Hooks, Setup, Workflow

### Community 73 - "Data model"
Cohesion: 0.33
Nodes (5): Data model, Entities, ER diagram, Invariants, Unit fields

### Community 74 - "formatPkr"
Cohesion: 0.09
Nodes (39): UnitDetailPage(), UnitStatusBadge(), AgreementsScreen(), PrintableBookingFormDialog(), PrintableReceiptDialog(), PrintableReceiptProps, ReservationDetailScreen(), ReservationWizard() (+31 more)

### Community 76 - "units.ts"
Cohesion: 0.15
Nodes (21): account, MergeRequestStatus, categories, floors, MergeSourceSnapshot, unitMergeRequests, unitMergeSources, unitPricing (+13 more)

### Community 77 - "Web Interface Guidelines"
Cohesion: 0.40
Nodes (4): Guidelines Source, How It Works, Usage, Web Interface Guidelines

### Community 78 - "Import rules"
Cohesion: 0.40
Nodes (4): Cleaning, Import rules, Money, Re-import (diff mode)

### Community 79 - "package.json"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 82 - "dashboard/queries.ts"
Cohesion: 0.23
Nodes (15): blocks, bookings, buybacks, installments, payments, refunds, reservations, sales (+7 more)

### Community 83 - "occupancy-chart.tsx"
Cohesion: 0.40
Nodes (3): margin, OccupancyChartProps, OccupancyPoint

### Community 84 - "db/index.ts"
Cohesion: 0.15
Nodes (12): hasFlag(), INVENTORY_AUDIT_ENTITIES, main(), maskDatabaseTarget(), NamedTable, preloadEnv(), runReset(), STRUCTURE_AUDIT_ENTITIES (+4 more)

### Community 85 - "Roadmap"
Cohesion: 0.50
Nodes (3): MVP (this scaffold), Next, Roadmap

### Community 87 - "next.config.ts"
Cohesion: 0.50
Nodes (3): nextConfig, securityHeaders, sentryEnabled

### Community 96 - "units/queries.ts"
Cohesion: 0.26
Nodes (9): bookPriceExpr(), inventorySelect, inventoryWhere(), listInventory(), listInventoryRows(), sectionSqlCondition(), sortColumn(), globalForBoss (+1 more)

### Community 99 - "inventory/page.tsx"
Cohesion: 0.18
Nodes (14): GET(), GET(), InventoryRoute(), maxDuration, metadata, fullExportSheets(), inventoryExportRows(), serialize() (+6 more)

### Community 102 - "booking/[id]/pdf/route.ts"
Cohesion: 0.36
Nodes (6): GET(), maxDuration, GET(), maxDuration, enclosureFromDownPayment(), paymentModeLabel()

### Community 104 - "constants.ts"
Cohesion: 0.14
Nodes (26): DocumentUpload(), handleFiles(), handlePasteClipboardButton(), handlePasteEvent(), makeThumb(), prepareFile(), queueFile(), ExistingDocument (+18 more)

### Community 106 - "load-summary.ts"
Cohesion: 0.36
Nodes (6): metadata, ReportsPage(), metadata, SummaryReportPage(), loadSummaryReport(), getSummaryReport()

### Community 110 - "dependencies"
Cohesion: 0.13
Nodes (15): better-auth, dependencies, better-auth, @radix-ui/react-tooltip, react-easy-crop, @sentry/nextjs, sharp, @visx/axis (+7 more)

### Community 129 - "agreement/[id]/pdf/route.ts"
Cohesion: 0.38
Nodes (5): GET(), maxDuration, AgreementDetailPage(), metadata, getAgreementDetail()

### Community 151 - "agreements/queries.ts"
Cohesion: 0.38
Nodes (6): AgreementStatus, agreements, AgreementsScreenProps, AgreementCandidate, AgreementListItem, SIGNED_READ_SECONDS

### Community 157 - "[type]/route.ts"
Cohesion: 0.13
Nodes (32): GET(), BookedReportPage(), metadata, CollectionsReportPage(), metadata, InstallmentsReportPage(), metadata, metadata (+24 more)

### Community 164 - "vercel.json"
Cohesion: 0.50
Nodes (3): sin1, crons, regions

### Community 171 - "data-table.tsx"
Cohesion: 0.25
Nodes (7): DataTable(), DataTableProps, helper, inventoryColumns, InventoryRow, inventoryTableFeatures, numericAccessors

### Community 172 - "auth-origin.ts"
Cohesion: 0.67
Nodes (5): EnvLike, resolveAuthBaseURL(), resolveTrustedOrigins(), stripProtocol(), vercelOrigin()

### Community 179 - "dashboard-screen.tsx"
Cohesion: 0.06
Nodes (59): GET(), DashboardPage(), maxDuration, metadata, getDashboardData(), DashboardFilters(), handleBlockChange(), handlePropertyChange() (+51 more)

### Community 180 - "booking-wizard.tsx"
Cohesion: 0.14
Nodes (25): Checkbox, DiscountType, PaymentMethod, PaymentPlan, ClientDocumentFields(), DocSlotMap, KinDocumentFields(), isDocReady() (+17 more)

### Community 181 - "MergeUnitsDialog"
Cohesion: 0.47
Nodes (6): MergeUnitsDialog(), applyAutoDefaults(), handleSubmit(), resetForm(), toggleUnit(), createMergeProofUploadUrl()

### Community 182 - "agreements/page.tsx"
Cohesion: 0.60
Nodes (4): AgreementsPage(), metadata, listAgreementCandidates(), listAgreements()

## Knowledge Gaps
- **584 isolated node(s):** `eslintConfig`, `lintStagedConfig`, `securityHeaders`, `nextConfig`, `sentryEnabled` (+579 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **78 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `button.tsx`, `sidebar.tsx`, `structure/actions.ts`, `constants.ts`, `parseDecimal`, `formatPkr`, `data-table.tsx`, `unit-panel.tsx`, `ClientLedgerScreenInner`, `BookingWizard`, `formatPkrCompact`, `booking-wizard.tsx`, `audit-screen.tsx`, `page-skeleton.tsx`, `money.ts`, `booking-detail-screen.tsx`, `client-ledger/page.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `requireSession()` connect `requireSession` to `agreement/[id]/pdf/route.ts`, `documents/actions.ts`, `errorMessage`, `structure/actions.ts`, `validation.ts`, `parseDecimal`, `merge-actions.ts`, `export/queries.ts`, `audit-screen.tsx`, `edit/page.tsx`, `permissions.ts`, `client-ledger/page.tsx`, `units/actions.ts`, `[type]/route.ts`, `agreements/actions.ts`, `installments/actions.ts`, `sidebar.tsx`, `can`, `getSession`, `import/actions.ts`, `users/actions.ts`, `units/types.ts`, `receipts.ts`, `dashboard-screen.tsx`, `MergeUnitsDialog`, `agreements/page.tsx`, `lib/auth.ts`, `formatPkr`, `inventory/page.tsx`, `load-summary.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `assertCan()` connect `requireSession` to `agreement/[id]/pdf/route.ts`, `documents/actions.ts`, `structure/actions.ts`, `validation.ts`, `parseDecimal`, `merge-actions.ts`, `export/queries.ts`, `edit/page.tsx`, `permissions.ts`, `client-ledger/page.tsx`, `units/actions.ts`, `[type]/route.ts`, `agreements/actions.ts`, `installments/actions.ts`, `sidebar.tsx`, `can`, `import/actions.ts`, `users/actions.ts`, `units/types.ts`, `receipts.ts`, `dashboard-screen.tsx`, `MergeUnitsDialog`, `agreements/page.tsx`, `formatPkr`, `inventory/page.tsx`, `load-summary.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requireSession()` (e.g. with `mockSession()` and `mockSession()`) actually correct?**
  _`requireSession()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `lintStagedConfig`, `securityHeaders` to the rest of the system?**
  _584 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.04975124378109453 - nodes in this community are weakly interconnected._
- **Should `units/schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07258064516129033 - nodes in this community are weakly interconnected._