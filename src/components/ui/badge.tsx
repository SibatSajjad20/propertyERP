import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex h-6 items-center rounded-sm border px-1.5 text-[11px] font-medium tracking-wide",
  {
    variants: {
      tone: {
        available: "border-available text-available",
        sold: "border-sold text-sold",
        muted: "border-line text-ink-muted",
      },
    },
    defaultVariants: {
      tone: "muted",
    },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
