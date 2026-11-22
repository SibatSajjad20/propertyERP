# Graph Report - PropertyERP  (2026-11-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2411 nodes · 7337 edges · 188 communities (112 shown, 76 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37e4d231`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- import/actions.ts
- dashboard-screen.tsx
- requireSession
- structure/actions.ts
- direct-sale-screen.tsx
- cn
- button.tsx
- money.ts
- units/schema.ts
- lib/auth.ts
- dashboard/queries.ts
- units/actions.ts
- effectivePricingArea
- login-rate-limit.ts
- guardEnvironment
- errors.ts
- users/actions.ts
- receipts.ts
- enums.ts
- sales/schema.ts
- booking-wizard.tsx
- page-skeleton.tsx
- formatPkr
- UserRole
- installments/actions.ts
- compilerOptions
- reports/queries.ts
- constants.ts
- formatDecimal
- export/queries.ts
- sales/actions.ts
- top-bar.tsx
- documents/actions.ts
- parseDecimal
- sidebar.tsx
- agreements/queries.ts
- form-document.tsx
- getSupabaseServer
- agreements/actions.ts
- render.ts
- users-screen.tsx
- 5. Screen Patterns
- db
- permissions.ts
- installments/calculator.ts
- scripts
- agreement-document.tsx
- client-ledger-document.tsx
- receipt-math.ts
- devDependencies
- dependencies
- error-state.tsx
- document-numbers.ts
- required.ts
- styles.ts
- surcharge.ts
- getAgreementDetail
- (app)/installments/page.tsx
- unit-status-actions.tsx
- use-inventory-query.ts
- db/index.ts
- Decisions
- inventory/page.tsx
- receipt-document.tsx
- Handover
- client-form.tsx
- Agent instructions
- User guide
- edit/page.tsx
- transitions-dev/SKILL.md
- Avatar group hover
- Error state shake
- Sardar's Mall ERP
- units/queries.ts
- app/layout.tsx
- inventory/route.ts
- data-table.tsx
- seed.ts
- client-ledger-screen.tsx
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
- audit-screen.tsx
- auth-origin.ts
- Contributing
- Data model
- CameraCaptureDialog
- Web Interface Guidelines
- Import rules
- next.config.ts
- package.json
- occupancy-chart.tsx
- Roadmap
- lint-staged.config.mjs
- vercel.json
- instrumentation.ts
- setup-storage.ts
- proxy.ts
- @better-auth/drizzle-adapter
- browser-image-compression
- class-variance-authority
- clsx
- cmdk
- PERMISSIONS.md
- dotenv
- drizzle-kit
- drizzle-orm
- eslint
- eslint.config.mjs
- eslint-config-next
- eslint-config-prettier
- exceljs
- @fontsource-variable/geist
- @fontsource-variable/geist-mono
- @hookform/resolvers
- husky
- jsdom
- lint-staged
- motion
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
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-visually-hidden
- react
- react-dom
- react-hook-form
- @react-pdf/renderer
- server-only
- sonner
- @supabase/supabase-js
- tailwind-merge
- @tanstack/react-query
- @tanstack/react-table
- @tanstack/react-virtual
- @visx/curve
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
- prettier-plugin-tailwindcss
- tailwindcss
- @tailwindcss/turbopack
- @types/node
- @types/react-dom
- typescript
- @vitejs/plugin-react
- vitest
- prettier.config.mjs
- instrumentation-client.ts

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 187 edges
2. `assertCan()` - 163 edges
3. `cn()` - 114 edges
4. `parseDecimal()` - 95 edges
5. `formatPkr()` - 77 edges
6. `UserRole` - 58 edges
7. `formatDecimal()` - 58 edges
8. `Button` - 58 edges
9. `errorMessage()` - 54 edges
10. `formatPkrCompact()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/status.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/units.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/users.test.ts → src/lib/auth.ts
- `mockSession()` --indirect_call--> `requireSession()`  [INFERRED]
  tests/unit/structure.test.ts → src/lib/auth.ts
- `cleanupTestData()` --calls--> `isE2eStructureName()`  [EXTRACTED]
  tests/e2e/e2e-guard.ts → src/lib/e2e-records.ts

## Import Cycles
- None detected.

## Communities (188 total, 76 thin omitted)

### Community 0 - "import/actions.ts"
Cohesion: 0.05
Nodes (90): ImportPage(), maxDuration, metadata, UnitStatusBadgeProps, UnitStatus, asAuditJson(), commitImportBatch(), ensureBlock() (+82 more)

### Community 1 - "dashboard-screen.tsx"
Cohesion: 0.06
Nodes (59): GET(), DashboardPage(), maxDuration, metadata, getDashboardData(), DashboardFilters(), handleBlockChange(), handlePropertyChange() (+51 more)

### Community 2 - "requireSession"
Cohesion: 0.08
Nodes (40): POST(), metadata, NewBookingPage(), BookingsPage(), maxDuration, metadata, ClientLedgerPage(), metadata (+32 more)

### Community 3 - "structure/actions.ts"
Cohesion: 0.05
Nodes (69): cell(), HEADER_ALIASES, ImportDraftRow, keyOf(), looksLikeSummary(), mapHeaders(), parseImportGrid(), archiveBlock() (+61 more)

### Community 4 - "direct-sale-screen.tsx"
Cohesion: 0.16
Nodes (24): DevUiScreen(), metadata, Checkbox, Select(), SelectContent, SelectGroup, SelectItem, SelectRoot (+16 more)

### Community 5 - "cn"
Cohesion: 0.07
Nodes (35): AnimatedNumber(), AnimatedNumberProps, DialogOverlay, DropdownMenuCheckboxItem, DropdownMenuSubContent, DropdownMenuSubTrigger, EmptyState(), EmptyStateProps (+27 more)

### Community 6 - "button.tsx"
Cohesion: 0.16
Nodes (29): Button, ButtonProps, buttonVariants, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter() (+21 more)

### Community 7 - "money.ts"
Cohesion: 0.07
Nodes (36): DueThisWeekCard(), DueThisWeekCardProps, DueThisWeekSummary, BookedReportScreen(), BookedReportScreenProps, ChartInner(), ChartInnerProps, CollectionsAreaChart() (+28 more)

### Community 8 - "units/schema.ts"
Cohesion: 0.06
Nodes (36): unitStatuses, ApproveMergeRequestInput, approveMergeRequestSchema, createMergeProofUrlSchema, CreateMergeRequestInput, createMergeRequestSchema, moneyField, positiveArea (+28 more)

### Community 9 - "lib/auth.ts"
Cohesion: 0.10
Nodes (23): GET(), maxDuration, BookedReportPage(), metadata, CollectionsReportPage(), metadata, InstallmentsReportPage(), metadata (+15 more)

### Community 10 - "dashboard/queries.ts"
Cohesion: 0.15
Nodes (23): MergeRequestStatus, blocks, categories, floors, properties, bookings, buybacks, sales (+15 more)

### Community 11 - "units/actions.ts"
Cohesion: 0.09
Nodes (38): invalidateDashboardBundleCache(), archiveUnit(), asAuditJson(), assertUniqueCode(), changeUnitStatus(), createUnit(), loadCategory(), loadFloorProperty() (+30 more)

### Community 12 - "effectivePricingArea"
Cohesion: 0.17
Nodes (25): UnitDetailPage(), SoldDetailScreen(), handleConfirmBuyback(), getUnitOwnershipTimeline(), MergeRequestsScreen(), handleConfirmApprove(), handleConfirmReject(), MergeUnitsDialog() (+17 more)

### Community 13 - "login-rate-limit.ts"
Cohesion: 0.17
Nodes (17): { GET, POST }, auth, isFailedAuthResult(), signInEmail(), assertLoginAllowed(), attempts, clearLoginFailures(), evaluateLoginRateLimit() (+9 more)

### Community 14 - "guardEnvironment"
Cohesion: 0.10
Nodes (10): cleanupTestData(), guardEnvironment(), fillClientIdentity(), fillKinIdentity(), jpegFixture(), selectUnitByCode(), uploadDocSlot(), uploadKinDocs() (+2 more)

### Community 15 - "errors.ts"
Cohesion: 0.11
Nodes (23): GET(), maxDuration, GET(), maxDuration, GET(), maxDuration, GET(), maxDuration (+15 more)

### Community 16 - "users/actions.ts"
Cohesion: 0.06
Nodes (53): PATCH(), GET(), POST(), metadata, ProfilePage(), session, asAuditJson(), changeOwnPassword() (+45 more)

### Community 17 - "receipts.ts"
Cohesion: 0.08
Nodes (35): GET(), maxDuration, GET(), maxDuration, BookingDetailPage(), generateMetadata(), CompanySettingsPage(), metadata (+27 more)

### Community 18 - "enums.ts"
Cohesion: 0.08
Nodes (31): agreementStatusEnum, agreementStatuses, auditActionEnum, auditActions, BookingStatus, bookingStatusEnum, discountTypeEnum, DocumentOwnerType (+23 more)

### Community 19 - "sales/schema.ts"
Cohesion: 0.05
Nodes (36): bookingStatuses, discountTypes, paymentPlans, reservationStatuses, DirectSaleScreen(), handleNextStep(), renderActionButtons(), ReservationWizard() (+28 more)

### Community 20 - "booking-wizard.tsx"
Cohesion: 0.11
Nodes (26): DocumentType, ClientDocumentFields(), DocSlotMap, KinDocumentFields(), ExistingDocument, DocumentListItem, DocumentsSection(), flushSlot() (+18 more)

### Community 21 - "page-skeleton.tsx"
Cohesion: 0.08
Nodes (3): PageSkeleton(), Skeleton(), DashboardSkeleton()

### Community 22 - "formatPkr"
Cohesion: 0.10
Nodes (30): PageHeader(), Badge(), BadgeProps, badgeVariants, dotColors, Label, StatCard(), StatCardProps (+22 more)

### Community 23 - "UserRole"
Cohesion: 0.15
Nodes (19): UserRole, BookingDetailScreenProps, ReservationDetailScreenProps, SoldDetailScreenProps, MergeRequestsScreenProps, MergeUnitsDialogProps, UnitCreateScreen(), handleSubmit() (+11 more)

### Community 24 - "installments/actions.ts"
Cohesion: 0.10
Nodes (31): paymentCategories, paymentMethods, editPayment(), parseInput(), recordInstallmentPayment(), revalidateInstallmentPaths(), toggleBookingSurchargeExemption(), voidPayment() (+23 more)

### Community 25 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 26 - "reports/queries.ts"
Cohesion: 0.17
Nodes (26): GET(), CollectionsReportScreenProps, ExtendedTxRow, applyBrandHeader(), applyDataRowStyles(), applyTableHeaderStyles(), generateBookedUnitsExcel(), generateClientLedgerExcel() (+18 more)

### Community 27 - "constants.ts"
Cohesion: 0.17
Nodes (22): DocumentUpload(), handleFiles(), handlePasteClipboardButton(), handlePasteEvent(), handleRemove(), makeThumb(), prepareFile(), queueFile() (+14 more)

### Community 28 - "formatDecimal"
Cohesion: 0.17
Nodes (26): formatDate(), GET(), maxDuration, sql, withTransientDbRetry(), getBlocksBreakdown(), getDashboardStats(), getDueThisWeekInstallments() (+18 more)

### Community 29 - "export/queries.ts"
Cohesion: 0.22
Nodes (9): auditLog, user, verification, AuditAction, importBatches, AuditLogFilter, subjectUser, fullExportSheets() (+1 more)

### Community 30 - "sales/actions.ts"
Cohesion: 0.23
Nodes (22): buybackSale(), cancelReservation(), createBooking(), createDirectSale(), createReservation(), extendReservation(), formatActionError(), nextBookingNumber() (+14 more)

### Community 31 - "top-bar.tsx"
Cohesion: 0.11
Nodes (22): AppShellProps, Breadcrumb, BreadcrumbContext, BreadcrumbProvider(), useBreadcrumbOverride(), BreadcrumbSet(), formatRole(), getBreadcrumbName() (+14 more)

### Community 32 - "documents/actions.ts"
Cohesion: 0.15
Nodes (30): documentOwnerTypes, documentTypes, assertCanManageDocuments(), assertPathMatches(), assertStorageObjectsExist(), buildStoragePath(), clearCurrentDocument(), completeDocumentUpload() (+22 more)

### Community 33 - "parseDecimal"
Cohesion: 0.16
Nodes (20): InstallmentType, addMonths(), allocatePayment(), calculateBuyback(), CalculatedDiscount, calculateDiscount(), calculateRefund(), DEFAULT_BALLOON_PERCENT (+12 more)

### Community 34 - "sidebar.tsx"
Cohesion: 0.07
Nodes (29): AppGroupLayout(), MustChangePasswordGate(), LoginForm(), loginSchema, LoginValues, fadeUp(), FEATURES, heroEase (+21 more)

### Community 35 - "agreements/queries.ts"
Cohesion: 0.15
Nodes (14): AgreementStatus, agreements, clients, installments, nextOfKin, AgreementsScreenProps, AgreementCandidate, AgreementListItem (+6 more)

### Community 36 - "form-document.tsx"
Cohesion: 0.15
Nodes (14): BOOKING_FORM_CONTENT, COMPANY_LEGAL_NAME, dateLabel(), enclosureLines(), fillBlank(), FormalFormPdf(), FormPdfProps, legalPdfPlainText() (+6 more)

### Community 37 - "getSupabaseServer"
Cohesion: 0.16
Nodes (17): clientDocuments, getDocumentSignedUrls(), thumbnailStoragePath(), downloadImage(), downscale(), EmbeddedImage, embedStorageImage(), loadSignedUrlsForDocumentIds() (+9 more)

### Community 38 - "agreements/actions.ts"
Cohesion: 0.15
Nodes (17): completeSignedAgreementUpload(), createAgreement(), createSignedAgreementUploadUrl(), extForAgreementMime(), nextAgreementNumber(), Tx, updateAgreement(), AgreementDetailScreen() (+9 more)

### Community 39 - "render.ts"
Cohesion: 0.27
Nodes (15): FORM_PDF_LAYOUT_VERSION, memoryCache, pdfCachePath(), readCachedPdf(), receiptCachePath(), rememberPdf(), writeCachedPdf(), registerPdfFonts() (+7 more)

### Community 40 - "users-screen.tsx"
Cohesion: 0.11
Nodes (28): DropdownMenu(), DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuSeparator (+20 more)

### Community 41 - "5. Screen Patterns"
Cohesion: 0.11
Nodes (17): 1. Dashboard (`/dashboard`), 1. Foundations & Tokens, 2. Inventory (`/inventory`), 2. Typography & Numerical Formatting, 3. App Shell Architecture, 3. Unit Detail & Edit Sheet, 4. Building Hierarchy (`/structure`), 4. UI Component Library (`src/components/ui/`) (+9 more)

### Community 42 - "db"
Cohesion: 0.19
Nodes (15): looksLikeProduction(), main(), db, refunds, rateHistory, unitStatusHistory, E2E_STRUCTURE_NAME_PATTERN, E2E_UNIT_CODE_PATTERN (+7 more)

### Community 43 - "permissions.ts"
Cohesion: 0.15
Nodes (16): AuditPage(), metadata, metadata, UsersSettingsPage(), metadata, StructurePage(), UsersRedirectPage(), userRoles (+8 more)

### Community 44 - "installments/calculator.ts"
Cohesion: 0.14
Nodes (13): rescheduleInstallments(), calculateClientLedger(), ClientLedgerStatement, LedgerRawEntry, RecalculateAllocationsParams, RecalculateAllocationsResult, RecalculatedInstallment, recalculateInstallmentAllocations() (+5 more)

### Community 45 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, db:cleanup-e2e, db:cleanup-e2e:apply, db:generate, db:migrate, db:seed, db:studio (+9 more)

### Community 46 - "agreement-document.tsx"
Cohesion: 0.18
Nodes (12): AgreementPdfProps, AgreementPdfScheduleRow, formatDateParts(), relationLong(), renderFormattedParagraph(), SalePurchaseAgreementPdf(), styles, AGREEMENT_BANK_DETAILS (+4 more)

### Community 47 - "client-ledger-document.tsx"
Cohesion: 0.17
Nodes (13): SARDARS_MALL_LOGO_DATA_URL, SARDARS_MALL_MARK_DATA_URL, formatDate(), InstallmentSchedulePdf(), InstallmentSchedulePdfProps, styles, ClientLedgerScreenProps, ClientLedgerPdf() (+5 more)

### Community 48 - "receipt-math.ts"
Cohesion: 0.21
Nodes (17): computeDownPaymentPlan(), computeReceiptTotals(), DEFAULT_DOWN_PAYMENT_PERCENT, divRoundHalfUp(), DownPaymentPlanKind, EXCESS_NOTE, isPositiveAmount(), PAYMENT_MODE_LABELS (+9 more)

### Community 49 - "devDependencies"
Cohesion: 0.13
Nodes (16): devDependencies, @playwright/test, prettier, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, tsx (+8 more)

### Community 50 - "dependencies"
Cohesion: 0.13
Nodes (15): better-auth, dependencies, better-auth, @radix-ui/react-tooltip, react-easy-crop, @sentry/nextjs, sharp, @visx/axis (+7 more)

### Community 52 - "document-numbers.ts"
Cohesion: 0.20
Nodes (9): documentCounters, payments, BOOKING_COUNTER_KEY, DOCUMENT_COUNTER_KEY, DocumentNumbers, PAYMENT_RECEIPT_COUNTER_KEY, RECEIPT_COUNTER_KEY, TOKEN_COUNTER_KEY (+1 more)

### Community 53 - "required.ts"
Cohesion: 0.26
Nodes (12): CLIENT_REQUIRED_DOC_TYPES, KIN_REQUIRED_DOC_TYPES, currentDocuments(), DocumentPresence, missingClientDocTypes(), missingKinDocTypes(), requiredDocumentErrorMessage(), requireClientDocuments() (+4 more)

### Community 54 - "styles.ts"
Cohesion: 0.14
Nodes (13): BG_WHITE, BRAND, BRAND_DARK, BRAND_SOFT, DANGER_BG, DANGER_TEXT, LINE_STRONG, SUCCESS_BG (+5 more)

### Community 55 - "surcharge.ts"
Cohesion: 0.20
Nodes (13): calculateInstallmentSurcharge(), divRoundHalfUp(), summarizeBookingSurcharges(), SURCHARGE_DAILY_PERCENT, SURCHARGE_GRACE_DAYS, SurchargeBreakdown, SurchargeInput, utcDayTimestamp() (+5 more)

### Community 56 - "getAgreementDetail"
Cohesion: 0.21
Nodes (11): AgreementDetailPage(), maxDuration, metadata, AgreementsPage(), maxDuration, metadata, getAgreementDetail(), listAgreementCandidates() (+3 more)

### Community 57 - "(app)/installments/page.tsx"
Cohesion: 0.18
Nodes (8): InstallmentsPage(), maxDuration, metadata, getClientProfileAction(), autoFormatCnic(), InstallmentsScreen(), handleSearchInputChange(), getClientProfileWithBookings()

### Community 58 - "unit-status-actions.tsx"
Cohesion: 0.17
Nodes (16): formatStatusLabel(), StatusHistory(), StatusHistoryProps, titleFor(), UnitPanel(), UnitPanelMode, UnitPanelProps, UnitReadProps (+8 more)

### Community 59 - "use-inventory-query.ts"
Cohesion: 0.17
Nodes (18): getInventoryData(), getInventoryOptions(), getUnitDetail(), hrefFor(), InventoryScreen(), handleClearAllFilters(), handleSelectSection(), handleSort() (+10 more)

### Community 60 - "db/index.ts"
Cohesion: 0.15
Nodes (12): hasFlag(), INVENTORY_AUDIT_ENTITIES, main(), maskDatabaseTarget(), NamedTable, preloadEnv(), runReset(), STRUCTURE_AUDIT_ENTITIES (+4 more)

### Community 61 - "Decisions"
Cohesion: 0.17
Nodes (11): ADR-0001 — Next.js App Router monolith, monorepo-ready, ADR-0002 — Numeric money, frozen sold price, ADR-0003 — Better Auth + Drizzle, ADR-0004 — visx, not Recharts, ADR-0005 — Phosphor light, no Lucide, ADR-0006 — Graphify for the code graph, ADR-0007 — Whole-rupee asking price, ADR-0008 — Optimistic version lock on unit writes (+3 more)

### Community 62 - "inventory/page.tsx"
Cohesion: 0.19
Nodes (12): InventoryMergesPage(), metadata, InventoryRoute(), maxDuration, metadata, maxDuration, metadata, NewUnitPage() (+4 more)

### Community 63 - "receipt-document.tsx"
Cohesion: 0.26
Nodes (10): DownPaymentReceiptPdf(), money(), receiptPdfPlainText(), INK, LINE, MUTED, pdfStyles, paymentModeLabel() (+2 more)

### Community 64 - "Handover"
Cohesion: 0.18
Nodes (10): Architecture, Data rules, Handover, How to add a floor, How to add a unit, Known limitations, Preview deploys, Roles (+2 more)

### Community 65 - "client-form.tsx"
Cohesion: 0.22
Nodes (7): SegmentedControl(), SegmentedControlOption, SegmentedControlProps, ClientForm(), handleSearchCnic(), formatCnicInput(), MatchedClientDocs

### Community 66 - "Agent instructions"
Cohesion: 0.20
Nodes (9): Agent instructions, Code graph, Commit attribution, Conventions, File-scoped commands, Layout, Package manager, Stack (+1 more)

### Community 67 - "User guide"
Cohesion: 0.20
Nodes (9): Export, Find a unit, If the page says the database is waking, Import, Reverse a sale, Sell a unit, Sign in, User guide (+1 more)

### Community 68 - "edit/page.tsx"
Cohesion: 0.24
Nodes (8): EditUnitPage(), generateMetadata(), generateMetadata(), UnitEditScreen(), handleArchive(), handleSubmit(), computedPriceExpr(), getUnitById

### Community 69 - "transitions-dev/SKILL.md"
Cohesion: 0.22
Nodes (7): Calibrating `stroke-dasharray` for your path, CSS, HTML usage, JavaScript orchestration, Success check, Tunable variables, When to use

### Community 70 - "Avatar group hover"
Cohesion: 0.22
Nodes (8): Avatar group hover, CSS, HTML usage, JavaScript orchestration, React form, Tunable variables, When to use, Why the timing-function is set inline before the variable writes

### Community 71 - "Error state shake"
Cohesion: 0.22
Nodes (8): CSS, Error state shake, HTML usage, JavaScript orchestration, Recomputing the keyframe stops, Tunable variables, When to use, Why three classes (`.is-error` on wrap + input, `.is-shaking` on input)

### Community 72 - "Sardar's Mall ERP"
Cohesion: 0.22
Nodes (8): Code graph, Deploy, Docs, Env, Migrate and seed, Sardar's Mall ERP, Scripts, Setup

### Community 73 - "units/queries.ts"
Cohesion: 0.17
Nodes (12): GET(), reservations, expireReservationsCron(), bookPriceExpr(), inventorySelect, inventoryWhere(), listInventory(), listInventoryRows() (+4 more)

### Community 74 - "app/layout.tsx"
Cohesion: 0.33
Nodes (5): metadata, getQueryClient(), makeQueryClient(), QueryProvider(), Toaster()

### Community 75 - "inventory/route.ts"
Cohesion: 0.36
Nodes (7): GET(), GET(), inventoryExportRows(), sheetFromRows(), workbookToBuffer(), firstParam(), parseInventorySearchParams()

### Community 76 - "data-table.tsx"
Cohesion: 0.25
Nodes (7): DataTable(), DataTableProps, helper, inventoryColumns, InventoryRow, inventoryTableFeatures, numericAccessors

### Community 77 - "seed.ts"
Cohesion: 0.25
Nodes (9): account, DEFAULT_CATEGORIES, ensureUser(), envOr(), seed(), SeedUser, DEV_SEED_UNITS, seedDevUnits() (+1 more)

### Community 78 - "client-ledger-screen.tsx"
Cohesion: 0.18
Nodes (5): ClientLedgerScreenInner(), formatDate(), PRESET_LABELS, ReportPreset, reportPresets

### Community 79 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 80 - "Card resize"
Cohesion: 0.29
Nodes (6): Card resize, CSS, HTML usage, JavaScript orchestration, Tunable variables, When to use

### Community 81 - "Number pop-in"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Number pop-in, Tunable variables, When to use

### Community 82 - "Notification badge"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Notification badge, Tunable variables, When to use

### Community 83 - "Text states swap"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Text states swap, Tunable variables, When to use

### Community 84 - "Menu dropdown"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Menu dropdown, Tunable variables, When to use

### Community 85 - "Modal open / close"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Modal open / close, Tunable variables, When to use

### Community 86 - "Panel reveal"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Panel reveal, Tunable variables, When to use

### Community 87 - "Page side-by-side"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, JavaScript orchestration, Page side-by-side, Tunable variables, When to use

### Community 88 - "Icon swap"
Cohesion: 0.29
Nodes (6): CSS, HTML usage, Icon swap, JavaScript orchestration, Tunable variables, When to use

### Community 89 - "Transitions.dev"
Cohesion: 0.29
Nodes (7): Common mistakes to avoid, Decision rules, Output format, Quick reference, Reference files, Transitions.dev, Universal install

### Community 90 - "Architecture"
Cohesion: 0.29
Nodes (6): Architecture, Auth and jobs, Caching, Feature-folder pattern, How to add a module, Layers

### Community 91 - "audit-screen.tsx"
Cohesion: 0.16
Nodes (17): Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, actionTone(), AuditScreen(), AuditScreenProps, diffFields() (+9 more)

### Community 92 - "auth-origin.ts"
Cohesion: 0.67
Nodes (5): EnvLike, resolveAuthBaseURL(), resolveTrustedOrigins(), stripProtocol(), vercelOrigin()

### Community 93 - "Contributing"
Cohesion: 0.33
Nodes (5): Commits, Contributing, Hooks, Setup, Workflow

### Community 94 - "Data model"
Cohesion: 0.33
Nodes (5): Data model, Entities, ER diagram, Invariants, Unit fields

### Community 96 - "Web Interface Guidelines"
Cohesion: 0.40
Nodes (4): Guidelines Source, How It Works, Usage, Web Interface Guidelines

### Community 97 - "Import rules"
Cohesion: 0.40
Nodes (4): Cleaning, Import rules, Money, Re-import (diff mode)

### Community 98 - "next.config.ts"
Cohesion: 0.40
Nodes (4): cspDirectives, nextConfig, securityHeaders, sentryEnabled

### Community 99 - "package.json"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 100 - "occupancy-chart.tsx"
Cohesion: 0.40
Nodes (3): margin, OccupancyChartProps, OccupancyPoint

### Community 101 - "Roadmap"
Cohesion: 0.50
Nodes (3): MVP (this scaffold), Next, Roadmap

### Community 103 - "vercel.json"
Cohesion: 0.50
Nodes (3): sin1, crons, regions

## Knowledge Gaps
- **609 isolated node(s):** `RecordedUnitChange`, `Tx`, `ImportStep`, `ParsedUpload`, `RowValidationStatus` (+604 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **76 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `structure/actions.ts`, `direct-sale-screen.tsx`, `button.tsx`, `money.ts`, `effectivePricingArea`, `sales/schema.ts`, `booking-wizard.tsx`, `page-skeleton.tsx`, `formatPkr`, `constants.ts`, `top-bar.tsx`, `sidebar.tsx`, `users-screen.tsx`, `surcharge.ts`, `(app)/installments/page.tsx`, `client-form.tsx`, `data-table.tsx`, `client-ledger-screen.tsx`, `audit-screen.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `requireSession()` connect `requireSession` to `import/actions.ts`, `dashboard-screen.tsx`, `structure/actions.ts`, `lib/auth.ts`, `dashboard/queries.ts`, `units/actions.ts`, `effectivePricingArea`, `errors.ts`, `users/actions.ts`, `receipts.ts`, `installments/actions.ts`, `reports/queries.ts`, `formatDecimal`, `export/queries.ts`, `sales/actions.ts`, `documents/actions.ts`, `sidebar.tsx`, `getSupabaseServer`, `agreements/actions.ts`, `permissions.ts`, `installments/calculator.ts`, `getAgreementDetail`, `(app)/installments/page.tsx`, `use-inventory-query.ts`, `inventory/page.tsx`, `edit/page.tsx`, `inventory/route.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `parseDecimal()` connect `parseDecimal` to `import/actions.ts`, `dashboard-screen.tsx`, `direct-sale-screen.tsx`, `button.tsx`, `money.ts`, `units/schema.ts`, `dashboard/queries.ts`, `effectivePricingArea`, `errors.ts`, `booking-wizard.tsx`, `formatPkr`, `UserRole`, `installments/actions.ts`, `reports/queries.ts`, `formatDecimal`, `sales/actions.ts`, `agreements/queries.ts`, `installments/calculator.ts`, `agreement-document.tsx`, `receipt-math.ts`, `surcharge.ts`, `(app)/installments/page.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requireSession()` (e.g. with `mockSession()` and `mockSession()`) actually correct?**
  _`requireSession()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RecordedUnitChange`, `Tx`, `ImportStep` to the rest of the system?**
  _609 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `import/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05003734129947722 - nodes in this community are weakly interconnected._
- **Should `dashboard-screen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.061088485746019994 - nodes in this community are weakly interconnected._