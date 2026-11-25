import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  ClipboardList,
  Stethoscope,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/features/admin/components/states";
import { DetalleSolicitudTecnicoModal } from "@/features/technician/components/detalle-solicitud-modal";
import {
  useDashboardTecnico,
  useMisOrdenes,
  useMisSolicitudes,
} from "@/features/technician/hooks/use-technician-queries";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import {
  ETIQUETA_ESTADO_ORDEN,
  ETIQUETA_ESTADO_SOLICITUD,
  TONO_ESTADO_ORDEN,
  TONO_ESTADO_SOLICITUD,
} from "@/lib/admin-labels";
import { formatFecha, formatNumber } from "@/lib/format";
import { mensajeDeError } from "@/lib/http";
import type { KpiCardData } from "@/types/admin-dashboard";

function AccesoRapido({
  to,
  icon: Icono,
  titulo,
  descripcion,
}: {
  to: string;
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
}) {
  return (
    <Link to={to} className="group block h-full">
      <GlassCard className="flex h-full items-start gap-3 p-5 transition-colors group-hover:bg-white/80">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <Icono className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{titulo}</p>
          <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-blue-600" />
      </GlassCard>
    </Link>
  );
}

export function TechnicianDashboardPage() {
  const dashboard = useDashboardTecnico();
  const solicitudes = useMisSolicitudes({ limite: 100 });
  const ordenes = useMisOrdenes({ limite: 100 });
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const error = dashboard.error ?? solicitudes.error ?? ordenes.error;
  const cargando =
    dashboard.isLoading || solicitudes.isLoading || ordenes.isLoading;

  const reintentar = () => {
    void dashboard.refetch();
    void solicitudes.refetch();
    void ordenes.refetch();
  };

  const kpis: KpiCardData[] = [
    {
      id: "solicitudes-pendientes",
      label: "Solicitudes activas",
      value: formatNumber(dashboard.data?.solicitudes.pendientes ?? 0),
      hint: "asignadas o en proceso",
      tone: "blue",
      icon: "clipboard",
    },
    {
      id: "solicitudes-proceso",
      label: "Solicitudes en proceso",
      value: formatNumber(dashboard.data?.solicitudes.en_proceso ?? 0),
      hint: "en ejecución ahora",
      tone: "amber",
      icon: "clock",
    },
    {
      id: "solicitudes-hoy",
      label: "Finalizadas hoy",
      value: formatNumber(dashboard.data?.solicitudes.finalizadas_hoy ?? 0),
      hint: "cerradas en el día",
      tone: "emerald",
      icon: "check",
    },
    {
      id: "ordenes-pendientes",
      label: "Órdenes pendientes",
      value: formatNumber(dashboard.data?.ordenes.pendientes ?? 0),
      hint: "esperando inicio",
      tone: "indigo",
      icon: "wrench",
    },
    {
      id: "ordenes-proceso",
      label: "Órdenes en proceso",
      value: formatNumber(dashboard.data?.ordenes.en_proceso ?? 0),
      hint: "trabajo en curso",
      tone: "sky",
      icon: "clock",
    },
    {
      id: "ordenes-hoy",
      label: "Órdenes finalizadas hoy",
      value: formatNumber(dashboard.data?.ordenes.finalizadas_hoy ?? 0),
      hint: "completadas en el día",
      tone: "emerald",
      icon: "check",
    },
  ];

  const cola = (solicitudes.data?.solicitudes ?? [])
    .filter(
      (solicitud) =>
        solicitud.estado === "ASIGNADA" || solicitud.estado === "EN_PROCESO",
    )
    .slice(0, 5);

  const ordenesActivas = (ordenes.data?.ordenes ?? [])
    .filter(
      (orden) => orden.estado === "PENDIENTE" || orden.estado === "EN_PROCESO",
    )
    .slice(0, 5);

  const diagnosticosPendientes = dashboard.data?.diagnosticos_pendientes ?? 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Panel técnico"
        description="Tus servicios, órdenes y diagnósticos asignados."
      />

      {error ? (
        <GlassCard>
          <ErrorState mensaje={mensajeDeError(error)} onRetry={reintentar} />
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} loading={cargando} />
            ))}
          </div>

          {diagnosticosPendientes > 0 && (
            <GlassCard className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Diagnósticos pendientes
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tenés {formatNumber(diagnosticosPendientes)}{" "}
                    {diagnosticosPendientes === 1 ? "solicitud" : "solicitudes"}{" "}
                    con diagnóstico en curso.
                  </p>
                </div>
              </div>
              <Link
                to="/tecnico/diagnosticos"
                className="inline-flex items-center gap-2 self-start rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/25 transition hover:bg-violet-700 sm:self-auto"
              >
                Ver diagnósticos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GlassCard>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <GlassCard className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Cola de trabajo
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Solicitudes asignadas o en proceso.
                  </p>
                </div>
                <Link
                  to="/tecnico/solicitudes"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Ver todas
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {solicitudes.isLoading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, indice) => (
                    <Skeleton key={indice} className="h-14 w-full" />
                  ))}
                </div>
              ) : cola.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No tenés solicitudes activas en este momento.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {cola.map((solicitud) => (
                    <li key={solicitud.id_solicitud}>
                      <button
                        type="button"
                        onClick={() => setDetalleId(solicitud.id_solicitud)}
                        className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-blue-50/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {solicitud.codigo ?? "Sin código"}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {solicitud.maquina.nombre} ·{" "}
                            {solicitud.cliente?.razon_social ??
                              "Máquina propia de DYD"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={
                              TONO_ESTADO_SOLICITUD[solicitud.estado]
                            }
                          >
                            {ETIQUETA_ESTADO_SOLICITUD[solicitud.estado]}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Órdenes activas
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Órdenes pendientes o en proceso.
                  </p>
                </div>
                <Link
                  to="/tecnico/ordenes"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Ver todas
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {ordenes.isLoading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, indice) => (
                    <Skeleton key={indice} className="h-14 w-full" />
                  ))}
                </div>
              ) : ordenesActivas.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No tenés órdenes activas en este momento.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {ordenesActivas.map((orden) => (
                    <li key={orden.id_orden_trabajo}>
                      <button
                        type="button"
                        onClick={() => setDetalleId(orden.id_solicitud)}
                        className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-blue-50/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {orden.codigo ?? "Sin código"}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {orden.solicitud.codigo ?? "Solicitud sin código"}
                            {orden.fecha_inicio
                              ? ` · Inicio ${formatFecha(orden.fecha_inicio)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={TONO_ESTADO_ORDEN[orden.estado]}>
                            {ETIQUETA_ESTADO_ORDEN[orden.estado]}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <AccesoRapido
              to="/tecnico/solicitudes"
              icon={ClipboardList}
              titulo="Mis solicitudes"
              descripcion="Consultá el detalle y avance de cada servicio."
            />
            <AccesoRapido
              to="/tecnico/ordenes"
              icon={Wrench}
              titulo="Mis órdenes"
              descripcion="Revisá las órdenes de trabajo que tenés asignadas."
            />
            <AccesoRapido
              to="/tecnico/diagnosticos"
              icon={Stethoscope}
              titulo="Diagnósticos"
              descripcion="Solicitudes con diagnóstico en curso."
            />
          </div>
        </>
      )}

      <DetalleSolicitudTecnicoModal
        id={detalleId}
        onClose={() => setDetalleId(null)}
      />
    </div>
  );
}
