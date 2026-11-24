import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartLegend } from "@/components/charts/chart-legend";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { GlassCard } from "@/components/ui/glass-card";
import type { SegmentoInventario } from "../mock-data";

interface InventoryStatusProps {
  data: SegmentoInventario[];
  porcentajeEnStock: number;
}

export function InventoryStatus({ data, porcentajeEnStock }: InventoryStatusProps) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Estado del inventario
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Materiales por nivel de stock
        </p>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-[186px] w-[186px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="72%"
                outerRadius="100%"
                paddingAngle={3}
                cornerRadius={6}
                stroke="none"
              >
                {data.map((segmento) => (
                  <Cell key={segmento.name} fill={segmento.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip ocultarLabel />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
              {porcentajeEnStock}%
            </span>
            <span className="mt-1.5 text-xs font-medium text-slate-500">
              En stock
            </span>
          </div>
        </div>

        <div className="w-full flex-1">
          <ChartLegend
            layout="vertical"
            size="md"
            items={data.map((segmento) => ({
              label: segmento.name,
              color: segmento.color,
              value: segmento.value,
            }))}
          />
          <div className="mt-4 rounded-xl bg-slate-50/80 px-3 py-2 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/70">
            {Math.max(0, 100 - porcentajeEnStock)}% entre bajo stock y agotado
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
