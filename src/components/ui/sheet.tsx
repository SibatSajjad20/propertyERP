"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--ink)_28%,transparent)] backdrop-blur-[2px] transition-all",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideCloseButton?: boolean;
    widthClass?: string;
    side?: "left" | "right";
  }
>(
  (
    {
      className,
      children,
      hideCloseButton = false,
      widthClass = "w-full max-w-[480px]",
      side = "right",
      ...props
    },
    ref,
  ) => (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "shadow-floating fixed inset-y-0 z-50 flex h-full flex-col bg-surface outline-none",
          side === "left"
            ? "data-[state=open]:animate-panel-in-left data-[state=closed]:animate-panel-out-left left-0 border-r border-line"
            : "data-[state=open]:animate-panel-in data-[state=closed]:animate-panel-out right-0 border-l border-line",
          widthClass,
          className,
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close className="absolute top-3.5 right-4 rounded-[4px] p-1 text-ink-muted transition-colors hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
            <X weight="light" className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  ),
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex h-[52px] shrink-0 items-center justify-between border-b border-line px-5",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

export const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-[16px] font-semibold tracking-tight text-ink", className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

export const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-[12px] text-ink-muted", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)} {...props} />
);
SheetBody.displayName = "SheetBody";

export const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex h-[56px] shrink-0 items-center justify-between border-t border-line bg-surface px-5",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";
