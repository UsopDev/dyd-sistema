import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { attention, bestPeriod } from "../mock-data";

function MiniBars({ valores }: { valores: number[] }) {
  const maximo = Math.max(...valores, 1);

  return (
    <div className="flex h-12 items-end gap-1" aria-hidden="true">
      {valores.map((valor, indice) => (
        <span
          key={indice}
          className={cn(
            "w-2 rounded-t-[3px]",
            indice === valores.length - 1 ? "bg-emerald-500" : "bg-emerald-300/80",
          )}
          style={{ height: `${Math.max((valor / maximo) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}

function Sparkline({ valores }: { valores: number[] }) {
  const ancho = 96;
  const alto = 46;
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  const rango = maximo - minimo || 1;

  const puntos = valores
    .map((valor, indice) => {
      const x = (indice / Math.max(valores.length - 1, 1)) * ancho;
      const y = alto - 4 - ((valor - minimo) / rango) * (alto - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className="h-12 w-24 overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={puntos}
        fill="none"
        stroke="#f43f5e"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HighlightCards() {
  return (
    <div className="flex h-full flex-col gap-4">
      <GlassCard className="relative flex-1 overflow-hidden border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white/80 to-white/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-200/70">
              {bestPeriod.titulo}
            </span>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {bestPeriod.periodo}
            </p>
            <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
              {bestPeriod.monto}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {bestPeriod.delta} vs. mes anterior
            </p>
          </div>
          <MiniBars valores={bestPeriod.barras} />
        </div>
      </GlassCard>

      <GlassCard className="relative flex-1 overflow-hidden border-rose-100/80 bg-gradient-to-br from-rose-50/90 via-white/80 to-white/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 ring-1 ring-rose-200/70">
              <TriangleAlert className="h-3 w-3" />
              {attention.titulo}
            </span>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {attention.detalle}
            </p>
            <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
              {attention.valor}
            </p>
            <p className="mt-2 text-[11px] font-medium text-rose-600">
              Revisá el stock de materiales
            </p>
          </div>
          <Sparkline valores={attention.sparkline} />
        </div>
      </GlassCard>
    </div>
  );
}
