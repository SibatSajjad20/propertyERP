"use client";

import * as React from "react";
import type { UnitStatus } from "@/db/schema/enums";
import { StatusDot } from "./badge";
import { cn } from "@/lib/cn";

export interface UnitStatusBadgeProps {
  status: UnitStatus | string;
  paidPercent?: number | null;
  className?: string;
  showDot?: boolean;
}

export function UnitStatusBadge({
  status,
  paidPercent,
  className,
}: UnitStatusBadgeProps) {
  let label: string;
  switch (status) {
    case "AVAILABLE":
      label = "Available";
      break;
    case "RESERVED":
      label = "Reserved";
      break;
    case "BOOKED":
      label = paidPercent != null ? `Booked ${Math.round(paidPercent)}%` : "Booked";
      break;
    case "SOLD":
      label = "Sold";
      break;
    default:
      label = status;
      break;
  }

  return (
    <StatusDot status={status} className={cn("text-[12.5px]", className)}>
      {label}
    </StatusDot>
  );
}
