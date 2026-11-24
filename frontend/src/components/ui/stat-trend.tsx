import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { FC } from "react";

interface StatTrendProps {
  value: number;
  label: string;
  positive: boolean;
  className?: string;
}

export const StatTrend: FC<StatTrendProps> = ({
  value,
  label,
  positive,
  className,
}) => (
  <div className={cn("flex items-center gap-1.5 text-sm", className)}>
    {positive ? (
      <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
    ) : (
      <TrendingDown className="h-4 w-4 text-rose-600" aria-hidden="true" />
    )}
    <span className={cn("font-medium", positive ? "text-emerald-600" : "text-rose-600")}>
      {positive ? "+" : ""}{value.toFixed(1)}%
    </span>
    <span className="text-slate-500">{label}</span>
  </div>
);
