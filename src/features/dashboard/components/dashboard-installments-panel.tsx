"use client";

import * as React from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatPkrCompact } from "@/lib/money";
import type { DashboardInstallmentItem } from "../queries";

export interface DashboardInstallmentsPanelProps {
  overdueInstallments: DashboardInstallmentItem[];
  dueNext7DaysInstallments: DashboardInstallmentItem[];
  className?: string;
}

export function DashboardInstallmentsPanel({
  overdueInstallments,
  dueNext7DaysInstallments,
  className,
}: DashboardInstallmentsPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"overdue" | "upcoming">(
    overdueInstallments.length > 0 ? "overdue" : "upcoming",
  );

  const [nowMs] = React.useState(() => Date.now());

  const items = (
    activeTab === "overdue" ? overdueInstallments : dueNext7DaysInstallments
  ).slice(0, 5);

  return (
    <Panel
      title="Installments"
      actions={
        <Link
          href="/installments"
          className="text-[12.5px] font-medium text-primary transition-colors hover:text-primary-hover"
        >
          View all
        </Link>
      }
      className={className}
      bodyClassName="p-5 flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Segmented Control */}
        <SegmentedControl
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "overdue" | "upcoming")}
          size="sm"
          options={[
            {
              value: "overdue",
              label: `Overdue (${overdueInstallments.length})`,
            },
            {
              value: "upcoming",
              label: `Next 7 days (${dueNext7DaysInstallments.length})`,
            },
          ]}
        />

        {/* List of installments */}
        {items.length === 0 ? (
          <div className="py-8 text-center text-[12.5px] text-muted">
            {activeTab === "overdue"
              ? "No overdue installments."
              : "No installments due in the next 7 days."}
          </div>
        ) : (
          <ul className="divide-y divide-line/60">
            {items.map((item) => {
              const isOverdue = activeTab === "overdue";
              let daysLate = 1;
              if (isOverdue) {
                const diffMs = nowMs - new Date(item.dueDate).getTime();
                daysLate = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
              }

              const formattedDate = new Date(item.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        isOverdue ? "bg-bad" : "bg-accent"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] leading-snug font-medium text-ink">
                        {item.clientName}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted">
                        <span className="font-sans font-medium text-primary">
                          {item.unitCode}
                        </span>
                        <span className="text-subtle"> · </span>
                        <span>#{item.seq}</span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[13px] leading-snug font-semibold text-ink tabular-nums">
                      {formatPkrCompact(item.amount)}
                    </p>
                    <p className="mt-0.5 text-[11px]">
                      {isOverdue ? (
                        <span className="font-medium text-bad">{daysLate}d late</span>
                      ) : (
                        <span className="text-muted">Due {formattedDate}</span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
