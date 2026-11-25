import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Factory,
  Stethoscope,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  IconoKpi,
  KpiCardData,
  TonoKpi,
} from "@/types/admin-dashboard";

const iconos: Record<IconoKpi, typeof Wallet> = {
  wallet: Wallet,
  users: Users,
  clipboard: ClipboardList,
  factory: Factory,
  wrench: Wrench,
  stethoscope: Stethoscope,
  check: CheckCircle2,
  clock: Clock,
  calendar: CalendarClock,
};

const tonos: Record<TonoKpi, string> = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  cyan: "bg-cyan-50 text-cyan-600 ring-cyan-100",
};

export function KpiCard({
  kpi,
  loading = false,
}: {
  kpi: KpiCardData;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-4 w-28" />
        <Skeleton className="mt-2 h-8 w-36" />
        <Skeleton className="mt-3 h-3 w-40" />
      </GlassCard>
    );
  }

  const Icono = iconos[kpi.icon];
  const tendenciaPositiva = kpi.trend?.direccion === "up";

  return (
    <GlassCard className="group p-5 transition-colors hover:bg-white/80">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
            tonos[kpi.tone],
          )}
        >
          <Icono className="h-5 w-5" />
        </div>

        {kpi.trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold",
              tendenciaPositiva
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600",
            )}
          >
            {tendenciaPositiva ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {kpi.trend.valor}
          </span>
        ) : kpi.badge ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
            {kpi.badge}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{kpi.label}</p>
      <p className="mt-1 text-[30px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
        {kpi.value}
      </p>
      <p className="mt-2.5 text-[11px] text-slate-400">{kpi.hint}</p>
    </GlassCard>
  );
}
