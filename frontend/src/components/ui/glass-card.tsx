import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/60 bg-white/70 shadow-glass ring-1 ring-slate-900/[0.03] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
