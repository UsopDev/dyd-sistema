import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-blue-600 text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 active:bg-blue-800",
        secondary:
          "bg-white/80 text-slate-700 ring-1 ring-slate-200 hover:bg-white hover:text-slate-900",
        ghost: "text-slate-600 hover:bg-white/70 hover:text-slate-900",
        danger: "bg-rose-500 text-white shadow-sm shadow-rose-500/25 hover:bg-rose-600",
        outline:
          "border border-blue-200 bg-white/60 text-blue-700 hover:border-blue-300 hover:bg-blue-50/70",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
