import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex h-8 items-center justify-center gap-2 rounded-sm border px-3 text-[13px] font-medium transition-[background-color,border-color,color] duration-[var(--duration)] ease-[var(--ease-ledger)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-surface hover:bg-[color-mix(in_srgb,var(--primary)_92%,black)]",
        ghost:
          "border-transparent bg-transparent text-ink hover:bg-[color-mix(in_srgb,var(--line)_55%,transparent)]",
        outline: "border-line bg-surface text-ink hover:border-ink-muted",
        danger:
          "border-sold bg-sold text-surface hover:bg-[color-mix(in_srgb,var(--sold)_92%,black)]",
        dangerOutline:
          "border-sold bg-surface text-sold hover:bg-[color-mix(in_srgb,var(--sold)_8%,var(--surface))]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant }), className)}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
