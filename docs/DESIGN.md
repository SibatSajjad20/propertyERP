# Design System — Sardar's Mall ERP

A restrained, high-precision interface modeled after private bank ledgers and modern institutional tools (Mercury, Linear, Stripe Dashboard, Efferd). Calm, tactile, and expensive-feeling. Every element feels deliberate, durable, and measured.

---

## 1. Foundations & Tokens

Defined in `src/styles/globals.css` (`:root` + `@theme inline`). Motion and layout tokens remain in `src/styles/tokens.css`.

### Color Palette

| Token              | Hex       | Role           | Usage                                              |
| :----------------- | :-------- | :------------- | :------------------------------------------------- |
| `--bg`             | `#F3F5F7` | Page ground    | Canvas background                                  |
| `--surface`        | `#FFFFFF` | Surface        | Cards, sheets, dialogs, inputs, table rows         |
| `--border`         | `#E3E7EC` | Border         | Control and card borders                           |
| `--text`           | `#0F172A` | Body text      | Headings, numbers, primary copy (`text-ink` alias) |
| `--text-secondary` | `#334155` | Secondary text | Nav labels, supporting copy                        |
| `--muted`          | `#64748B` | Muted text     | Metadata, table headers (`text-ink-muted`)         |
| `--subtle`         | `#94A3B8` | Faint text     | Placeholders, section labels (`text-ink-faint`)    |
| `--primary`        | `#0B558B` | Brand blue     | Buttons, active nav, links, focus, chart series    |
| `--primary-hover`  | `#084572` | Brand hover    | Primary button hover                               |
| `--primary-active` | `#063A61` | Brand pressed  | Primary button active                              |
| `--primary-soft`   | `#E8F0F7` | Soft blue      | Hover rows, selected chips, “N active” badges      |
| `--primary-muted`  | `#A3BED2` | Light blue     | Secondary chart series, login highlights           |
| `--accent-bright`  | `#0274BE` | Bright blue    | Link hover and chart highlight only                |
| `--booked`         | `#64748B` | Slate          | Booked unit status (kept off brand blue)           |
| `--available`      | `#1F7A4D` | Green          | Available unit status                              |
| `--sold`           | `#9B2C2C` | Red            | Sold unit status, destructive actions              |

### Radii & Elevation

- **Controls**: `6px` (`--radius-sm`) for buttons, inputs, select triggers, filter chips, and badges.
- **Floating Overlays**: `8px` (`--radius-md`) for dialogs, sheets, dropdown menus, and popovers.
- **Shadow Token**: `0 1px 2px rgba(26,26,23,.04), 0 8px 24px rgba(26,26,23,.08)` (`--shadow-floating`).
- **Elevation Rule**: Page content, tables, and rows **never** have drop shadows or elevated card borders. Shadows are strictly restricted to floating layers (menus, popovers, dialogs, sheets, toasts).
- **Focus Ring**: `2px solid` primary at 30% opacity, plus primary border.

### Motion Tokens

Smooth transitions built on custom ledger curves with complete `prefers-reduced-motion` compliance:

- **Hover & Micro-interactions**: `120ms cubic-bezier(0.2, 0.8, 0.2, 1)`
- **Dropdowns & Popovers**: `180ms cubic-bezier(0.2, 0.8, 0.2, 1)` with subtle `4px` vertical translate
- **Side Panels & Sheets**: `240ms cubic-bezier(0.2, 0.8, 0.2, 1)` slide from right
- **Modal Dialogs**: `200ms cubic-bezier(0.2, 0.8, 0.2, 1)` fade and scale

---

## 2. Typography & Numerical Formatting

- **Geist Sans**: Primary interface typeface across all body copy, forms, buttons, and navigation.
- **Geist Mono**: High-density alphanumeric information: unit codes (`10F-PH2`), system IDs, audit hashes, keyboard shortcuts (`⌘K`), and timestamps.
- **Newsreader**: Refined serif typeface reserved **strictly** for the "Sardar's Mall" wordmark in the sidebar and login screen.
- **Type Scale**: `12px` / `13px` / `14px` / `16px` / `20px` / `28px`.
  - **Page Titles**: `20px / 600`, `-0.01em` tracking.
  - **Labels**: `12px / 500`, `text-ink-muted`.
  - **KPI Numerals**: `28px / 500`, Geist Sans tabular.
- **Tabular Figures**: `tabular-nums` and OpenType feature flags (`ss01`, `cv11`) enabled globally across tables, KPI blocks, prices, and areas for vertical alignment.
- **Currency & Area**: Formatted with standard South Asian groupings (Lac, Cr) and explicit suffixes/prefixes (`Rs`, `sq ft`).

---

## 3. App Shell Architecture

- **Fixed Sidebar**:
  - `232px` width, white background, right hairline `#E3E7EC`.
  - Sticky to the viewport (`h-screen`, independent scroll).
  - Top brand unit: SM square (`#0B558B`, white text, `rounded-md`) + "Sardar's Mall" `#0F172A` (no ERP tag).
  - Nav items: `32px` height, `13px` type, Phosphor regular icon (`16px`, `#0B558B` at 80%) + `#334155` label.
  - Hover: `#E8F0F7` with primary text. Active: `#0B558B` pill, white text and white icons, `rounded-md`.
  - Bottom user block: Circle initials avatar on primary blue, staff name, role description, and dropdown menu for Sign out.
- **Sticky Top Bar**:
  - `52px` height, translucent background (`bg-surface/80` with `backdrop-blur-md`), bottom hairline.
  - Dynamic contextual breadcrumbs indicating the actual page (e.g. `Dashboard`, `Inventory`, `Structure`, `Import`, `Users`, `Audit log`).
  - Right utilities: `⌘K` command palette search button styled as a keyboard-accessible field, plus notifications anchor.
- **Scroll Strategy**:
  - The sidebar remains anchored; only the main page body scrolls.
  - Table headers lock stickily to the top of the scrolling view with a reinforced bottom hairline (`border-line-strong`).

---

## 4. UI Component Library (`src/components/ui/`)

Built entirely on accessible **Radix UI** primitives and custom token styling — zero default shadcn templates or native unstyled form elements.

- **`Button`**:
  - Variants: `primary` (navy fill), `secondary` (white surface with hairline border), `outline`, `ghost`, `danger` (oxblood outline), `dangerSolid` (oxblood fill for confirmed deletions).
  - Sizes: `sm` (`28px`), `md` (`32px`).
  - Tactile feedback: Pressed scale `0.98`, loading spinner slot, hover transition `120ms`.
- **`Select` & `Combobox`**:
  - Radix Select trigger mimics an input with a subtle down chevron.
  - Floating popover with checkmark indicator and keyboard focus tracking.
- **`Input`, `Textarea`, `NumberInput`**:
  - Precision `6px` radius, hairline border, `2px` brass focus ring.
  - Prefix / suffix adornments (`Rs`, `sq ft`, search icons).
  - Custom autofill override to prevent default browser yellow/blue backgrounds.
- **`Badge`**:
  - Dot + text format (`available`, `sold`, `accent`, `primary`, `muted`).
- **`DropdownMenu`**:
  - Accessible row-actions menu trigger (`⋯`) with keyboard navigation and floating shadow.
- **`Dialog` & `Sheet`**:
  - `Dialog`: Centered confirmation overlay with backdrop blur.
  - `Sheet`: `480px` drawer sliding from the right (`240ms`), section dividers, and sticky footer.
- **`FilterBar`**:
  - Inline chip-style popovers displaying active filter counts and a one-click "Clear all" button.
- **`Toaster` & `toast`**:
  - Powered by Sonner; positioned `bottom-right` with hairline borders and token styling for all mutations.

---

## 5. Screen Patterns

### 1. Dashboard (`/dashboard`)

- **KPI Strip**: 5 metrics (`Total units`, `Available`, `Sold`, `Available value`, `Sold value`) separated by vertical hairlines. 28px Geist Sans tabular numerals.
- **Ledger Absorption Stack**: Floor-by-floor rows displaying an 8px dual-tone horizontal progress bar (`sold` in oxblood, `available` in forest green) with ratio readouts.
- **Asset Class Breakdown**: Category table showing unit distribution and net valuation.
- **Recent Forensic Activity**: Streamlined audit list linking directly to affected units.

### 2. Inventory (`/inventory`)

- Compact filter toolbar with search, floor chip, category chip, status chip, sellable toggle, missing gross checkbox, and primary "New unit" trigger.
- Virtualized 36px table rows with sticky column headers and sticky summary footer bar.
- Mono unit codes (`10F-PH2`) and right-aligned tabular financial values.

### 3. Unit Detail & Edit Sheet

- `480px` slide-out panel with small-caps section headings (`IDENTITY & LOCATION`, `AREA & VALUATION`, `OWNERSHIP & BOOKING`, `NOTES`).
- Live calculation summary block (`rate × area + adj = total`) rendered in tabular numerals.
- Sticky action bar for Cancel, Save, and status transitions (e.g. Reverse sale).

### 4. Building Hierarchy (`/structure`)

- Two-pane layout: Architectural blocks on the left with unit counters, floor matrix on the right with level re-indexing and action menus.
- Safe archive flow gated by confirmation dialogs.

### 5. Forensic Audit Trail (`/audit`)

- Human-readable event logs ("Administrator performed sale on 10F-PH2").
- Relative timestamps with exact ISO tooltip popovers.
- Expandable mono diff drawer displaying raw JSON payload diffs and entity identifiers.

### 6. User Directory (`/users`)

- Staff accounts with two-letter initials avatars, role pill badges (`Administrator`, `Inventory Manager`, `Sales`), and account status indicators.

### 7. Sign In (`/login`)

- Centered `380px` card on parchment ground with brass top hairline.
- Wordmark rendered in refined serif (Newsreader).
- Integrated credential validation and status toast.

---

## 6. Strict Design Bans

- ❌ **No drop shadows on page content**: Page cards, tables, rows, and widgets are flat, structured purely with hairlines (`#E4E0D6`). Drop shadows are strictly reserved for floating layers (`popover`, `dialog`, `sheet`, `dropdown`, `toast`).
- ❌ **No gradients, glows, or glassmorphism**: Strict flat ink and surface tones.
- ❌ **No emoji or illustrative clip art**: Icons are strictly Phosphor light (`weight="light"`).
- ❌ **No Lucide or Recharts**: Replaced by Phosphor icons and custom SVG/HTML ledger components.
- ❌ **No cards with rounded pillowy shadows**: Clean rectangular structure with disciplined `6px` / `8px` radii.
