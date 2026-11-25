import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartLegend } from "@/components/charts/chart-legend";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactSoles } from "@/lib/format";
import type { PuntoRendimiento } from "@/types/admin-dashboard";

export function PerformanceTrend({
  data,
  loading = false,
}: {
  data: PuntoRendimiento[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-5 w-52" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="mt-5 h-[300px] w-full rounded-2xl" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Tendencia del rendimiento
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ingresos y solicitudes del período seleccionado
          </p>
        </div>
        <ChartLegend
          items={[
            { label: "Ingresos", color: "#2563eb" },
            { label: "Solicitudes", color: "#38bdf8" },
          ]}
        />
      </div>

      {data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
          Sin datos para el período seleccionado
        </div>
      ) : (
        <div className="mt-5 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="fillSolicitudes"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="etiqueta"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(valor: number) => formatCompactSoles(valor)}
                width={54}
              />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                cursor={{ stroke: "#bfdbfe", strokeWidth: 1 }}
                content={<ChartTooltip />}
              />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#fillIngresos)"
                dot={{
                  r: 3,
                  fill: "#ffffff",
                  stroke: "#2563eb",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "#2563eb",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="solicitudes"
                name="Solicitudes"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fill="url(#fillSolicitudes)"
                dot={{
                  r: 3,
                  fill: "#ffffff",
                  stroke: "#38bdf8",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "#38bdf8",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
