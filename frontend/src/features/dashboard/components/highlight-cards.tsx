import { ArrowUpRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  MejorPeriodo,
  RequiereAtencion,
} from "@/types/admin-dashboard";

function MiniBars({ valores }: { valores: number[] }) {
  const maximo = Math.max(...valores, 1);

  return (
    <div className="flex h-12 items-end gap-1" aria-hidden="true">
      {valores.map((valor, indice) => (
        <span
          key={indice}
          className={cn(
            "w-2 rounded-t-[3px]",
            indice === valores.length - 1
              ? "bg-emerald-500"
              : "bg-emerald-300/80",
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

interface HighlightCardsProps {
  mejorPeriodo: MejorPeriodo | null;
  atencion: RequiereAtencion | null;
  loading?: boolean;
}

export function HighlightCards({
  mejorPeriodo,
  atencion,
  loading = false,
}: HighlightCardsProps) {
  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4">
        <GlassCard className="flex-1 p-5">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="mt-4 h-3 w-24" />
          <Skeleton className="mt-2 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-36" />
        </GlassCard>
        <GlassCard className="flex-1 p-5">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="mt-4 h-3 w-32" />
          <Skeleton className="mt-2 h-7 w-28" />
          <Skeleton className="mt-3 h-3 w-40" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <GlassCard className="relative flex-1 overflow-hidden border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white/80 to-white/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-200/70">
              Mejor período
            </span>
            {mejorPeriodo ? (
              <>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {mejorPeriodo.periodo}
                </p>
                <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
                  {mejorPeriodo.monto}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {mejorPeriodo.delta} vs. mes anterior
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Todavía no hay ingresos registrados en el período.
              </p>
            )}
          </div>
          {mejorPeriodo && <MiniBars valores={mejorPeriodo.barras} />}
        </div>
      </GlassCard>

      <GlassCard className="relative flex-1 overflow-hidden border-rose-100/80 bg-gradient-to-br from-rose-50/90 via-white/80 to-white/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 ring-1 ring-rose-200/70">
              <TriangleAlert className="h-3 w-3" />
              Requiere atención
            </span>
            {atencion ? (
              <>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {atencion.detalle}
                </p>
                <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
                  {atencion.valor}
                </p>
                <p className="mt-2 text-[11px] font-medium text-rose-600">
                  Revisá el stock de materiales
                </p>
              </>
            ) : (
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Todo el stock está en orden
              </p>
            )}
          </div>
          {atencion && <Sparkline valores={atencion.sparkline} />}
        </div>
      </GlassCard>
    </div>
  );
}
