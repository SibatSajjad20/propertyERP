"use client";

import { Slot } from "@radix-ui/react-slot";
import { CircleNotch } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-[var(--duration-hover)] ease-[var(--ease-ledger)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 whitespace-nowrap [&_svg]:size-[15px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary hover:bg-primary-hover active:bg-primary-active text-white border border-primary shadow-[0_1px_2px_rgba(11,85,139,0.25)] [&_svg]:text-white",
        default:
          "bg-surface hover:bg-[#FAFBFC] active:bg-[#F1F3F6] text-ink border border-border shadow-[0_1px_1px_rgba(15,23,42,0.04)] [&_svg]:text-muted",
        secondary:
          "bg-surface hover:bg-[#FAFBFC] active:bg-[#F1F3F6] text-ink border border-border shadow-[0_1px_1px_rgba(15,23,42,0.04)] [&_svg]:text-muted",
        outline:
          "bg-surface hover:bg-[#FAFBFC] active:bg-[#F1F3F6] text-ink border border-border shadow-[0_1px_1px_rgba(15,23,42,0.04)] [&_svg]:text-muted",
        ghost:
          "bg-transparent hover:bg-primary-soft text-muted hover:text-ink border border-transparent shadow-none [&_svg]:text-muted",
        danger:
          "bg-surface hover:bg-bad-soft active:bg-[#FCE8E6] text-bad border border-border shadow-[0_1px_1px_rgba(15,23,42,0.04)] [&_svg]:text-bad",
        dangerSolid:
          "bg-bad hover:bg-[#9B1C10] text-white border border-transparent shadow-[0_1px_2px_rgba(180,35,24,0.25)] [&_svg]:text-white",
      },
      size: {
        sm: "h-[28px] px-[10px] text-[12.5px] gap-1.5 rounded-[7px]",
        md: "h-[34px] px-[13px] text-[13px] gap-1.5 rounded-[8px]",
        lg: "h-[40px] px-4 text-[13.5px] gap-2 rounded-[8px]",
        icon: "size-[34px] p-0 rounded-[8px] justify-center",
        iconSm: "size-[28px] p-0 rounded-[7px] justify-center",
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
            weight="regular"
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
