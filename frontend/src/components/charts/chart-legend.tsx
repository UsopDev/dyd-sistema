import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface LegendItem {
  label: string;
  color: string;
  value?: number;
}

interface ChartLegendProps {
  items: LegendItem[];
  layout?: "horizontal" | "vertical";
  size?: "sm" | "md";
  className?: string;
}

export function ChartLegend({
  items,
  layout = "horizontal",
  size = "sm",
  className,
}: ChartLegendProps) {
  const vertical = layout === "vertical";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2",
        vertical && "flex-col items-stretch gap-2.5",
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.label}
          className={cn(
            "inline-flex items-center gap-2",
            vertical && "w-full justify-between",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className={cn(
                "rounded-full",
                size === "md" ? "h-2.5 w-2.5" : "h-2 w-2",
              )}
              style={{ backgroundColor: item.color }}
            />
            <span
              className={cn(
                "font-medium text-slate-600",
                size === "md" ? "text-sm" : "text-xs",
              )}
            >
              {item.label}
            </span>
          </span>
          {item.value !== undefined && (
            <span
              className={cn(
                "font-bold tabular-nums text-slate-900",
                size === "md" ? "text-sm" : "text-xs",
              )}
            >
              {formatNumber(item.value)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
