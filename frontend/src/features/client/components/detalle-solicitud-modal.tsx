import { Receipt, Stethoscope, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/features/admin/components/modal";
import { DetailField, ErrorState } from "@/features/admin/components/states";
import { useSolicitudCliente } from "@/features/client/hooks/use-client-queries";
import {
  ETIQUETA_ESTADO_GENERAL,
  ETIQUETA_ESTADO_ORDEN,
  ETIQUETA_ESTADO_SOLICITUD,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_SERVICIO,
  TONO_ESTADO_GENERAL,
  TONO_ESTADO_ORDEN,
  TONO_ESTADO_SOLICITUD,
  TONO_PRIORIDAD,
  TONO_TIPO_SERVICIO,
} from "@/lib/admin-labels";
import { formatFechaHora, formatSoles } from "@/lib/format";
import { mensajeDeError } from "@/lib/http";

export function DetalleSolicitudClienteModal({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const detalle = useSolicitudCliente(id);

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      title={detalle.data?.codigo ?? "Detalle de la solicitud"}
      description="Estado del servicio, diagnóstico, orden y cotizaciones."
      size="lg"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {detalle.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, indice) => (
            <div key={indice} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full max-w-[220px]" />
            </div>
          ))}
        </div>
      ) : detalle.error ? (
        <ErrorState
          compacto
          mensaje={mensajeDeError(detalle.error)}
          onRetry={() => void detalle.refetch()}
        />
      ) : detalle.data ? (
        <div className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Estado">
              <Badge variant={TONO_ESTADO_SOLICITUD[detalle.data.estado]}>
                {ETIQUETA_ESTADO_SOLICITUD[detalle.data.estado]}
              </Badge>
            </DetailField>
            <DetailField label="Prioridad">
              <Badge variant={TONO_PRIORIDAD[detalle.data.prioridad]}>
                {ETIQUETA_PRIORIDAD[detalle.data.prioridad]}
              </Badge>
            </DetailField>
            <DetailField label="Tipo de servicio">
              <Badge variant={TONO_TIPO_SERVICIO[detalle.data.tipo_servicio]}>
                {ETIQUETA_TIPO_SERVICIO[detalle.data.tipo_servicio]}
              </Badge>
            </DetailField>
            <DetailField label="Recepción">
              {formatFechaHora(detalle.data.fecha_recepcion)}
            </DetailField>
            <DetailField label="Máquina">
              {detalle.data.maquina.nombre}
              {detalle.data.maquina.codigo
                ? ` (${detalle.data.maquina.codigo})`
                : ""}
            </DetailField>
            <DetailField label="Última actualización">
              {formatFechaHora(detalle.data.actualizado_en)}
            </DetailField>
          </dl>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Descripción
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {detalle.data.descripcion}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                <Stethoscope className="h-3.5 w-3.5" />
                Diagnóstico
              </div>
              {detalle.data.diagnostico ? (
                <div className="mt-2 space-y-2">
                  <Badge
                    variant={
                      TONO_ESTADO_GENERAL[
                        detalle.data.diagnostico.estado_general
                      ]
                    }
                  >
                    {
                      ETIQUETA_ESTADO_GENERAL[
                        detalle.data.diagnostico.estado_general
                      ]
                    }
                  </Badge>
                  <p className="text-xs text-slate-400">
                    {formatFechaHora(detalle.data.diagnostico.fecha)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {detalle.data.diagnostico.fallas_detectadas}
                  </p>
                  {detalle.data.diagnostico.observaciones && (
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold">Observaciones:</span>{" "}
                      {detalle.data.diagnostico.observaciones}
                    </p>
                  )}
                  {detalle.data.diagnostico.recomendaciones && (
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold">Recomendaciones:</span>{" "}
                      {detalle.data.diagnostico.recomendaciones}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Sin diagnóstico registrado
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                <Wrench className="h-3.5 w-3.5" />
                Orden de trabajo
              </div>
              {detalle.data.orden_trabajo ? (
                <div className="mt-2 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {detalle.data.orden_trabajo.codigo ?? "Sin código"}
                  </p>
                  <Badge
                    variant={
                      TONO_ESTADO_ORDEN[detalle.data.orden_trabajo.estado]
                    }
                  >
                    {ETIQUETA_ESTADO_ORDEN[detalle.data.orden_trabajo.estado]}
                  </Badge>
                  {detalle.data.orden_trabajo.trabajo_realizado && (
                    <p className="text-xs text-slate-500">
                      {detalle.data.orden_trabajo.trabajo_realizado}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Monto:{" "}
                    {detalle.data.orden_trabajo.monto
                      ? formatSoles(detalle.data.orden_trabajo.monto)
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Inicio:{" "}
                    {formatFechaHora(detalle.data.orden_trabajo.fecha_inicio)}
                    {" · "}Fin:{" "}
                    {formatFechaHora(detalle.data.orden_trabajo.fecha_fin)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Sin orden asignada
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              <Receipt className="h-3.5 w-3.5" />
              Cotizaciones
            </div>
            {detalle.data.cotizaciones.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100">
                {detalle.data.cotizaciones.map((cotizacion) => (
                  <li
                    key={cotizacion.id_cotizacion}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {cotizacion.codigo ?? "Sin código"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFechaHora(cotizacion.fecha)}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {formatSoles(cotizacion.total)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Sin cotizaciones registradas
              </p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
