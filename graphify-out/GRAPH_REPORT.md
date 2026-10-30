# Graph Report - PropertyERP  (2026-10-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 455 nodes · 680 edges · 96 communities (25 shown, 71 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f2fbadd3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 85
- Community 86
- Community 89

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 18 edges
2. `compilerOptions` - 18 edges
3. `cn()` - 15 edges
4. `assertCan()` - 14 edges
5. `scripts` - 14 edges
6. `db` - 11 edges
7. `can()` - 8 edges
8. `getSession()` - 8 edges
9. `AppError` - 7 edges
10. `computeTotalPrice()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `changeUnitStatus()` --calls--> `computeTotalPrice()`  [EXTRACTED]
  src/features/units/actions.ts → src/lib/money.ts
- `loadDashboard()` --calls--> `requireSession()`  [EXTRACTED]
  src/features/dashboard/actions.ts → src/lib/auth.ts
- `loadDashboard()` --calls--> `assertCan()`  [EXTRACTED]
  src/features/dashboard/actions.ts → src/lib/permissions.ts
- `Sidebar()` --calls--> `can()`  [EXTRACTED]
  src/components/app-shell/sidebar.tsx → src/lib/permissions.ts
- `DataTable()` --calls--> `cn()`  [EXTRACTED]
  src/components/data-table/data-table.tsx → src/lib/cn.ts

## Import Cycles
- None detected.

## Communities (96 total, 71 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (26): ImportPage(), metadata, Database, db, globalForDb, auditLog, account, session (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (24): { GET, POST }, AuditPage(), metadata, metadata, UsersPage(), userRoles, loadAuditLog(), listAuditLog() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (25): InventoryRoute(), metadata, metadata, UnitDetailPage(), DataTable(), DataTableProps, helper, inventoryColumns (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (23): AppGroupLayout(), instant, LoginForm(), instant, LoginPage(), metadata, HomePage(), instant (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (15): loginSchema, LoginValues, CommandMenu(), routes, TopBarProps, Badge(), badgeVariants, Button (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (18): name, packageManager, private, scripts, build, db:generate, db:migrate, db:seed (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.21
Nodes (9): DashboardPage(), metadata, loadDashboard(), margin, OccupancyChart(), OccupancyChartProps, OccupancyPoint, getDashboardStats() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.20
Nodes (6): AppError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (13): clsx, dependencies, clsx, pg-boss, @radix-ui/react-checkbox, @radix-ui/react-popover, @radix-ui/react-scroll-area, @radix-ui/react-tooltip (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.28
Nodes (7): metadata, StructurePage(), Block, Floor, PropertyNode, StructureTree(), getStructureTree()

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (5): geistMono, geistSans, metadata, newsreader, Toaster()

### Community 12 - "Community 12"
Cohesion: 0.40
Nodes (6): devDependencies, @playwright/test, @testing-library/dom, @testing-library/jest-dom, @playwright/test, @testing-library/dom

## Knowledge Gaps
- **173 isolated node(s):** `Database`, `Session`, `SessionUser`, `Action`, `Block` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 9` to `Community 6`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 24`, `Community 29`, `Community 30`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 66`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 12` to `Community 6`, `Community 22`, `Community 23`, `Community 25`, `Community 27`, `Community 28`, `Community 31`, `Community 32`, `Community 33`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 80`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `db` connect `Community 0` to `Community 1`, `Community 7`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `Database`, `Session`, `SessionUser` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0858843537414966 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11553030303030302 - nodes in this community are weakly interconnected._