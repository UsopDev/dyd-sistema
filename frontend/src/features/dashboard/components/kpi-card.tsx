import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Users,
  Wallet,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { KpiMock, TonoKpi } from "../mock-data";

const iconos = {
  wallet: Wallet,
  users: Users,
  clipboard: ClipboardList,
};

const tonos: Record<TonoKpi, string> = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
};

export function KpiCard({ kpi }: { kpi: KpiMock }) {
  const Icono = iconos[kpi.icon];
  const esPositivo = kpi.direction === "up";

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
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold",
            esPositivo
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600",
          )}
        >
          {esPositivo ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {kpi.trend}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{kpi.label}</p>
      <p className="mt-1 text-[30px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
        {kpi.value}
      </p>
      <p className="mt-2.5 text-[11px] text-slate-400">{kpi.hint}</p>
    </GlassCard>
  );
}
