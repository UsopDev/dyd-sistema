import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Factory,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/features/admin/components/states";
import { DetalleMaquinaClienteModal } from "@/features/client/components/detalle-maquina-modal";
import { DetalleSolicitudClienteModal } from "@/features/client/components/detalle-solicitud-modal";
import { DonutEstados } from "@/features/client/components/donut-estados";
import {
  useDashboardCliente,
  useMaquinasCliente,
  useSolicitudesCliente,
} from "@/features/client/hooks/use-client-queries";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import {
  ETIQUETA_ESTADO_MAQUINA,
  ETIQUETA_ESTADO_SOLICITUD,
  TONO_ESTADO_MAQUINA,
  TONO_ESTADO_SOLICITUD,
} from "@/lib/admin-labels";
import { formatFecha, formatFechaCalendario, formatNumber } from "@/lib/format";
import { mensajeDeError } from "@/lib/http";
import {
  estadoMantenimiento,
  proximaProgramacion,
} from "@/lib/portal-utils";
import type { KpiCardData } from "@/types/admin-dashboard";
import type { EstadoSolicitud } from "@/types/admin";

export function ClientDashboardPage() {
  const dashboard = useDashboardCliente();
  const solicitudes = useSolicitudesCliente({ limite: 100 });
  const maquinas = useMaquinasCliente({ limite: 100 });
  const [detalleSolicitudId, setDetalleSolicitudId] = useState<string | null>(
    null,
  );
  const [detalleMaquinaId, setDetalleMaquinaId] = useState<string | null>(null);

  const error = dashboard.error ?? solicitudes.error ?? maquinas.error;
  const cargando =
    dashboard.isLoading || solicitudes.isLoading || maquinas.isLoading;

  const reintentar = () => {
    void dashboard.refetch();
    void solicitudes.refetch();
    void maquinas.refetch();
  };

  const kpis: KpiCardData[] = [
    {
      id: "solicitudes-pendientes",
      label: "Solicitudes pendientes",
      value: formatNumber(dashboard.data?.solicitudes.pendientes ?? 0),
      hint: "en espera de atención",
      tone: "blue",
      icon: "clipboard",
    },
    {
      id: "solicitudes-proceso",
      label: "Solicitudes en proceso",
      value: formatNumber(dashboard.data?.solicitudes.en_proceso ?? 0),
      hint: "servicios en ejecución",
      tone: "amber",
      icon: "clock",
    },
    {
      id: "solicitudes-finalizadas",
      label: "Solicitudes finalizadas",
      value: formatNumber(dashboard.data?.solicitudes.finalizadas ?? 0),
      hint: "servicios completados",
      tone: "emerald",
      icon: "check",
    },
    {
      id: "maquinas",
      label: "Máquinas registradas",
      value: formatNumber(dashboard.data?.maquinas.total ?? 0),
      hint: "equipos a tu nombre",
      tone: "indigo",
      icon: "factory",
    },
    {
      id: "maquinas-operativas",
      label: "Máquinas operativas",
      value: formatNumber(dashboard.data?.maquinas.operativas ?? 0),
      hint: "disponibles para servicio",
      tone: "cyan",
      icon: "factory",
    },
    {
      id: "preventivos",
      label: "Preventivos próximos",
      value: formatNumber(dashboard.data?.preventivos_proximos ?? 0),
      hint: "mantenimientos en 7 días",
      tone: "violet",
      icon: "calendar",
    },
  ];

  const listaSolicitudes = solicitudes.data?.solicitudes ?? [];
  const listaMaquinas = maquinas.data?.maquinas ?? [];

  const conteoEstados = new Map<EstadoSolicitud, number>();
  for (const solicitud of listaSolicitudes) {
    conteoEstados.set(
      solicitud.estado,
      (conteoEstados.get(solicitud.estado) ?? 0) + 1,
    );
  }

  const segmentos = Array.from(conteoEstados.entries()).map(
    ([estado, cantidad]) => ({ estado, cantidad }),
  );

  const prioritarias = listaSolicitudes
    .filter(
      (solicitud) =>
        solicitud.estado !== "FINALIZADA" &&
        solicitud.estado !== "CANCELADA",
    )
    .slice(0, 5);

  const mantenimientos = listaMaquinas
    .flatMap((maquina) =>
      maquina.programaciones
        .filter((programacion) => programacion.proximo_mant)
        .map((programacion) => ({ ...programacion, maquina })),
    )
    .sort(
      (a, b) =>
        new Date(a.proximo_mant!).getTime() -
        new Date(b.proximo_mant!).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Panel de cliente"
        description="Resumen de tus solicitudes, máquinas y mantenimientos."
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

          <div className="grid gap-4 xl:grid-cols-3">
            <DonutEstados data={segmentos} loading={cargando} />

            <GlassCard className="p-5 xl:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Solicitudes prioritarias
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Servicios activos ordenados por prioridad.
                  </p>
                </div>
                <Link
                  to="/cliente/solicitudes"
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
              ) : prioritarias.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No tenés solicitudes activas en este momento.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {prioritarias.map((solicitud) => (
                    <li key={solicitud.id_solicitud}>
                      <button
                        type="button"
                        onClick={() =>
                          setDetalleSolicitudId(solicitud.id_solicitud)
                        }
                        className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-blue-50/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {solicitud.codigo ?? "Sin código"}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {solicitud.maquina.nombre} ·{" "}
                            {formatFecha(solicitud.fecha_recepcion)}
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
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <GlassCard className="p-5 xl:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Mis máquinas
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Estado actual de tus equipos.
                  </p>
                </div>
                <Link
                  to="/cliente/maquinas"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Ver todas
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {maquinas.isLoading ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, indice) => (
                    <Skeleton key={indice} className="h-24 w-full" />
                  ))}
                </div>
              ) : listaMaquinas.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Todavía no tenés máquinas registradas.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {listaMaquinas.slice(0, 4).map((maquina) => {
                    const programacion = proximaProgramacion(
                      maquina.programaciones,
                    );
                    const estadoMant = estadoMantenimiento(
                      programacion?.proximo_mant,
                    );

                    return (
                      <button
                        key={maquina.id_maquina}
                        type="button"
                        onClick={() => setDetalleMaquinaId(maquina.id_maquina)}
                        className="rounded-xl border border-slate-200/80 bg-white/70 p-4 text-left transition hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {maquina.nombre}
                            </p>
                            <p className="text-xs text-slate-400">
                              {maquina.codigo ?? "Sin código"}
                            </p>
                          </div>
                          <Badge
                            variant={TONO_ESTADO_MAQUINA[maquina.estado]}
                          >
                            {ETIQUETA_ESTADO_MAQUINA[maquina.estado]}
                          </Badge>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Próximo mantenimiento:{" "}
                          {formatFechaCalendario(programacion?.proximo_mant)}
                        </p>
                        <div className="mt-1">
                          <Badge variant={estadoMant.tono}>
                            {estadoMant.etiqueta}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-4 w-4 text-violet-500" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Próximos mantenimientos
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Programaciones activas de tus equipos.
                  </p>
                </div>
              </div>

              {maquinas.isLoading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, indice) => (
                    <Skeleton key={indice} className="h-14 w-full" />
                  ))}
                </div>
              ) : mantenimientos.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  No hay mantenimientos programados.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {mantenimientos.map((mantenimiento) => {
                    const estadoMant = estadoMantenimiento(
                      mantenimiento.proximo_mant,
                    );

                    return (
                      <li
                        key={mantenimiento.id_programacion}
                        className="py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {mantenimiento.descripcion}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {mantenimiento.maquina.nombre} ·{" "}
                              {formatFechaCalendario(mantenimiento.proximo_mant)}
                            </p>
                          </div>
                          <Badge variant={estadoMant.tono}>
                            {estadoMant.etiqueta}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Link
                to="/cliente/maquinas"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Ver mis máquinas
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </GlassCard>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/cliente/solicitudes" className="group block">
              <GlassCard className="flex items-center gap-3 p-5 transition-colors group-hover:bg-white/80">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Mis solicitudes
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Consultá el estado y detalle de cada servicio.
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:text-blue-600" />
              </GlassCard>
            </Link>

            <Link to="/cliente/maquinas" className="group block">
              <GlassCard className="flex items-center gap-3 p-5 transition-colors group-hover:bg-white/80">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Factory className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Mis máquinas
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Revisá el estado y los mantenimientos de tus equipos.
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:text-indigo-600" />
              </GlassCard>
            </Link>
          </div>
        </>
      )}

      <DetalleSolicitudClienteModal
        id={detalleSolicitudId}
        onClose={() => setDetalleSolicitudId(null)}
      />
      <DetalleMaquinaClienteModal
        id={detalleMaquinaId}
        onClose={() => setDetalleMaquinaId(null)}
      />
    </div>
  );
}
