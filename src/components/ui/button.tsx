"use client";

import { Slot } from "@radix-ui/react-slot";
import { CircleNotch } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-[var(--duration-hover)] ease-[var(--ease-ledger)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-primary hover:bg-primary-hover text-surface border border-transparent",
        secondary: "bg-surface hover:bg-subtle text-ink border border-line-strong",
        outline: "bg-surface hover:bg-subtle text-ink border border-line-strong",
        ghost: "bg-transparent hover:bg-subtle text-ink border border-transparent",
        danger:
          "bg-surface hover:bg-[color-mix(in_srgb,var(--sold)_10%,transparent)] text-sold border border-sold",
        dangerSolid:
          "bg-sold hover:bg-[color-mix(in_srgb,var(--sold)_90%,black)] text-surface border border-transparent",
      },
      size: {
        sm: "h-7 px-2.5 text-[12px] gap-1.5 rounded-[6px]",
        md: "h-8 px-3 text-[13px] gap-2 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <CircleNotch
            weight="light"
            className="size-3.5 animate-spin text-current"
            aria-hidden="true"
          />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
