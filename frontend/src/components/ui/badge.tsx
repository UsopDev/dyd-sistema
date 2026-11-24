import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
        info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/70",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
        danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/70",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
