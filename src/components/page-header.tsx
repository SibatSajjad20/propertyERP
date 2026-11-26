"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  back?: {
    href: Route | string;
    label: string;
  };
  meta?: React.ReactNode[];
  badge?: React.ReactNode;
  idTitle?: boolean;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  back,
  meta,
  badge,
  idTitle = false,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-5 flex flex-col", className)}>
      {back && (
        <Link
          href={back.href as Route}
          className="mb-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft weight="bold" className="size-3.5" />
          <span>{back.label}</span>
        </Link>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className={cn(
                "leading-tight font-semibold text-ink",
                idTitle
                  ? "id text-[24px] tracking-[-0.005em]"
                  : "text-[22px] tracking-[-0.022em]",
              )}
            >
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}

          {meta && meta.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
              {meta.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="text-line-strong select-none" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {actions && (
          <div data-header-actions="true" className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
