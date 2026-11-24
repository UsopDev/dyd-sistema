import { formatNumber, formatSoles } from "@/lib/format";

export interface ChartTooltipItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipItem[];
  ocultarLabel?: boolean;
}

const CLAVES_MONEDA = new Set(["ingresos", "total", "monto"]);

export function ChartTooltip({
  active,
  label,
  payload,
  ocultarLabel = false,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[170px] rounded-xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur-md">
      {!ocultarLabel && label !== undefined && label !== "" && (
        <p className="mb-2 text-xs font-semibold capitalize text-slate-500">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((item, index) => {
          const clave = String(item.dataKey ?? index);
          const valor =
            typeof item.value === "number"
              ? item.value
              : Number(item.value ?? 0);

          return (
            <div
              key={`${clave}-${index}`}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <span className="flex items-center gap-1.5 text-slate-500">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color ?? "#2563eb" }}
                />
                {item.name ?? clave}
              </span>
              <span className="font-bold tabular-nums text-slate-900">
                {CLAVES_MONEDA.has(clave) ? formatSoles(valor) : formatNumber(valor)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
