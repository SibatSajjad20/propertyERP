"use client";

import * as React from "react";
import type { UnitStatus } from "@/db/schema/enums";
import { Badge } from "./badge";

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
  showDot = true,
}: UnitStatusBadgeProps) {
  switch (status) {
    case "AVAILABLE":
      return (
        <Badge tone="available" showDot={showDot} className={className}>
          Available
        </Badge>
      );
    case "RESERVED":
      return (
        <Badge tone="reserved" showDot={showDot} className={className}>
          Reserved
        </Badge>
      );
    case "BOOKED":
      return (
        <Badge tone="booked" showDot={showDot} className={className}>
          {paidPercent != null ? `Booked ${Math.round(paidPercent)}%` : "Booked"}
        </Badge>
      );
    case "SOLD":
      return (
        <Badge tone="sold" showDot={showDot} className={className}>
          Sold
        </Badge>
      );
    default:
      return (
        <Badge tone="muted" showDot={showDot} className={className}>
          {status}
        </Badge>
      );
  }
}
