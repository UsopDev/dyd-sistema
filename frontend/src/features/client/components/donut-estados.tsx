import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartLegend } from "@/components/charts/chart-legend";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COLOR_ESTADO_SOLICITUD,
  ETIQUETA_ESTADO_SOLICITUD,
} from "@/lib/admin-labels";
import { formatNumber } from "@/lib/format";
import type { EstadoSolicitud } from "@/types/admin";

export interface SegmentoEstado {
  estado: EstadoSolicitud;
  cantidad: number;
}

export function DonutEstados({
  data,
  loading = false,
}: {
  data: SegmentoEstado[];
  loading?: boolean;
}) {
  const total = data.reduce((suma, item) => suma + item.cantidad, 0);

  const segmentos = data.map((item) => ({
    name: ETIQUETA_ESTADO_SOLICITUD[item.estado],
    cantidad: item.cantidad,
    color: COLOR_ESTADO_SOLICITUD[item.estado],
  }));

  if (loading) {
    return (
      <GlassCard className="p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-56" />
        <Skeleton className="mx-auto mt-6 h-[220px] w-[220px] rounded-full" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <div>
        <h2 className="text-sm font-bold text-slate-900">
          Solicitudes por estado
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Distribución de tus solicitudes registradas.
        </p>
      </div>

      {total === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">
          Todavía no tenés solicitudes registradas.
        </p>
      ) : (
        <>
          <div className="relative mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentos}
                  dataKey="cantidad"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {segmentos.map((segmento) => (
                    <Cell key={segmento.name} fill={segmento.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip ocultarLabel />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {formatNumber(total)}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                solicitudes
              </span>
            </div>
          </div>

          <ChartLegend
            layout="vertical"
            items={segmentos.map((segmento) => ({
              label: segmento.name,
              color: segmento.color,
              value: segmento.cantidad,
            }))}
          />
        </>
      )}
    </GlassCard>
  );
}
