"use client";

import Link from "next/link";
import { CaretDown, CalendarCheck, CheckCircle, Clock } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UnitActionDropdownProps {
  unitId: string;
  className?: string;
}

export function UnitActionDropdown({ unitId, className }: UnitActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="md"
          className={cn("h-[36px] w-[195px] justify-center", className)}
        >
          <span>Mark as sold / Action</span>
          <CaretDown weight="bold" className="ml-1.5 size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link
            href={`/sold/new?unitId=${unitId}`}
            className="flex cursor-pointer items-center gap-2 py-2"
          >
            <CheckCircle weight="regular" className="size-4 text-bad" />
            <div className="flex flex-col">
              <span className="font-medium text-ink">Mark as sold</span>
              <span className="text-[11px] text-ink-muted">Direct sale settlement</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={`/bookings/new?unitId=${unitId}`}
            className="flex cursor-pointer items-center gap-2 py-2"
          >
            <CalendarCheck weight="regular" className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="font-medium text-ink">Book unit</span>
              <span className="text-[11px] text-ink-muted">
                Multi-step installment plan
              </span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={`/reservations/new?unitId=${unitId}`}
            className="flex cursor-pointer items-center gap-2 py-2"
          >
            <Clock weight="regular" className="text-accent size-4" />
            <div className="flex flex-col">
              <span className="font-medium text-ink">Reserve unit</span>
              <span className="text-[11px] text-ink-muted">
                Temporary hold with token
              </span>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
