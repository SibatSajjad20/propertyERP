"use client";

import * as React from "react";
import { DownloadSimple, MagnifyingGlass, Plus, DotsThree } from "@phosphor-icons/react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitStatusBadge } from "@/components/ui/unit-status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { formatPkrCompact } from "@/lib/money";

export function DevUiScreen() {
  const [selectVal, setSelectVal] = React.useState("option1");
  const [dateVal, setDateVal] = React.useState("2026-11-02");

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="UI Controls & Design System"
        description="Dev-only gallery asserting exact 36px/32px scale, status colours, and control alignment."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md">
              <DownloadSimple weight="light" className="size-4" />
              <span>Export</span>
            </Button>
            <Button variant="primary" size="md">
              <Plus weight="light" className="size-4" />
              <span>New Action</span>
            </Button>
          </div>
        }
      />

      {/* Section 1: Side-by-Side Control Alignment (36px / md) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">
            1. Control Sizing Alignment (md = 36px, radius 8px, text-[13px])
          </h2>
          <p className="text-[12px] text-ink-muted">
            All controls in header actions and forms share the same 36px height, font
            size, and border radius.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Button */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-ink-muted">
                Button (md: 36px)
              </span>
              <Button variant="primary" size="md">
                <Plus weight="light" className="size-4" />
                <span>Primary</span>
              </Button>
            </div>

            {/* Secondary Button */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-ink-muted">
                Secondary (36px)
              </span>
              <Button variant="secondary" size="md">
                <DownloadSimple weight="light" className="size-4" />
                <span>Secondary</span>
              </Button>
            </div>

            {/* Input */}
            <div className="flex w-44 flex-col gap-1">
              <span className="text-[11px] font-medium text-ink-muted">Input (36px)</span>
              <Input placeholder="Type text…" defaultValue="Sample text" />
            </div>

            {/* Select Trigger */}
            <div className="flex w-44 flex-col gap-1">
              <span className="text-[11px] font-medium text-ink-muted">
                Select (36px)
              </span>
              <Select value={selectVal} onValueChange={setSelectVal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">First choice</SelectItem>
                  <SelectItem value="option2">Second choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="flex w-40 flex-col gap-1">
              <span className="text-[11px] font-medium text-ink-muted">Date (36px)</span>
              <input
                type="date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="h-9 w-full rounded-[8px] border border-line bg-surface px-2.5 text-[13px] text-ink outline-none hover:border-line-strong focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              />
            </div>

            {/* Search Box */}
            <div className="flex w-52 flex-col gap-1">
              <span className="text-[11px] font-medium text-ink-muted">
                Search Box (36px)
              </span>
              <div className="relative">
                <MagnifyingGlass
                  weight="light"
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-muted"
                />
                <input
                  type="text"
                  placeholder="Search…"
                  className="h-9 w-full rounded-[8px] border border-line bg-surface pr-2.5 pl-8 text-[13px] text-ink placeholder:text-ink-faint hover:border-line-strong focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                />
              </div>
            </div>

            {/* Icon Button (size-9: 36px) */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-ink-muted">Icon (36px)</span>
              <Button variant="secondary" size="icon" aria-label="Action">
                <DotsThree weight="bold" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Table Row Actions (sm = 32px) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">
            2. Table Row Actions Scale (sm = 32px, text-[13px])
          </h2>
          <p className="text-[12px] text-ink-muted">
            Compact scale for in-table buttons, dropdown triggers, and row action icons.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">Button (sm: 32px):</span>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
              <Button variant="primary" size="sm">
                Save
              </Button>
              <Button variant="danger" size="sm">
                Delete
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">
                Row Action Icon (size-8: 32px):
              </span>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-[8px] border border-line bg-surface text-ink-muted hover:bg-subtle hover:text-ink"
                aria-label="Row options"
              >
                <DotsThree weight="bold" className="size-4" />
              </button>
            </div>

            <div className="flex w-48 items-center gap-2">
              <span className="text-[12px] text-ink-muted">Select (sm: 32px):</span>
              <Select defaultValue="sm1">
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm1">Small option</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Status Colours Palette */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">
            3. Status Colours Palette &amp; Strict Tokens
          </h2>
          <p className="text-[12px] text-ink-muted">
            Available #1F7A4D · Reserved #B7791F · Booked #0B558B · Sold #9B2C2C. Brass
            #9A7B4F reserved strictly for Hallmark and Active Nav bar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Available */}
          <div className="card flex flex-col justify-between border-l-4 border-l-available p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink">Available</span>
              <span className="size-2.5 rounded-full bg-available" />
            </div>
            <div className="mt-2 font-mono text-[11px] text-ink-muted">#1F7A4D</div>
            <div className="mt-3 flex items-center gap-2">
              <UnitStatusBadge status="AVAILABLE" />
            </div>
          </div>

          {/* Reserved */}
          <div className="card flex flex-col justify-between border-l-4 border-l-reserved p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink">Reserved</span>
              <span className="size-2.5 rounded-full bg-reserved" />
            </div>
            <div className="mt-2 font-mono text-[11px] text-ink-muted">#B7791F</div>
            <div className="mt-3 flex items-center gap-2">
              <UnitStatusBadge status="RESERVED" />
            </div>
          </div>

          {/* Booked */}
          <div className="card flex flex-col justify-between border-l-4 border-l-booked p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink">Booked</span>
              <span className="size-2.5 rounded-full bg-booked" />
            </div>
            <div className="mt-2 font-mono text-[11px] text-ink-muted">#0B558B</div>
            <div className="mt-3 flex items-center gap-2">
              <UnitStatusBadge status="BOOKED" paidPercent={60} />
            </div>
          </div>

          {/* Sold */}
          <div className="card flex flex-col justify-between border-l-4 border-l-sold p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink">Sold</span>
              <span className="size-2.5 rounded-full bg-sold" />
            </div>
            <div className="mt-2 font-mono text-[11px] text-ink-muted">#9B2C2C</div>
            <div className="mt-3 flex items-center gap-2">
              <UnitStatusBadge status="SOLD" />
            </div>
          </div>

          {/* Brass (Hallmark & Nav ONLY) */}
          <div className="card flex flex-col justify-between border-l-4 border-l-accent p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink">
                Brass (Brand Only)
              </span>
              <span className="size-2.5 rounded-[2px] bg-accent" />
            </div>
            <div className="mt-2 font-mono text-[11px] text-ink-muted">#9A7B4F</div>
            <p className="mt-2 text-[10px] text-ink-muted">
              Logo mark &amp; active sidebar bar only
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Stat Cards with Count-up Animation & Lac/Cr Format */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">
            4. Stat Cards &amp; Lac/Cr Money Formatting
          </h2>
          <p className="text-[12px] text-ink-muted">
            Tabs-dev count-up animation, status dot alignment, and single formatPkrCompact
            helper.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Available"
            value={85}
            indicator="available"
            tone="available"
            caption={formatPkrCompact("42500000.00")}
          />
          <StatCard
            label="Reserved"
            value={14}
            indicator="reserved"
            tone="reserved"
            caption={formatPkrCompact("12000000.00")}
          />
          <StatCard
            label="Booked"
            value={38}
            indicator="booked"
            tone="booked"
            caption={formatPkrCompact("68000000.00")}
          />
          <StatCard
            label="Sold"
            value={120}
            indicator="sold"
            tone="sold"
            caption={`46% (${formatPkrCompact("140000000.00")})`}
          />
          <StatCard
            label="Net Collected"
            value={formatPkrCompact("125000000.00")}
            caption="net of refunds"
          />
          <StatCard
            label="Reversals this month"
            value={formatPkrCompact("4500000.00")}
            caption="refunds & buybacks"
          />
        </div>
      </section>
    </div>
  );
}
