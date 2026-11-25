import { CalendarClock, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/features/admin/components/modal";
import { DetailField, ErrorState } from "@/features/admin/components/states";
import { useMaquinaCliente } from "@/features/client/hooks/use-client-queries";
import {
  ETIQUETA_ESTADO_MAQUINA,
  ETIQUETA_ESTADO_SOLICITUD,
  TONO_ESTADO_MAQUINA,
  TONO_ESTADO_SOLICITUD,
} from "@/lib/admin-labels";
import {
  formatCantidad,
  formatFechaCalendario,
  formatFechaHora,
} from "@/lib/format";
import { mensajeDeError } from "@/lib/http";
import { estadoMantenimiento } from "@/lib/portal-utils";

export function DetalleMaquinaClienteModal({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const detalle = useMaquinaCliente(id);

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      title={detalle.data?.nombre ?? "Detalle de la máquina"}
      description="Datos del equipo, mantenimientos y últimas solicitudes."
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
              <Badge variant={TONO_ESTADO_MAQUINA[detalle.data.estado]}>
                {ETIQUETA_ESTADO_MAQUINA[detalle.data.estado]}
              </Badge>
            </DetailField>
            <DetailField label="Código">
              {detalle.data.codigo ?? "—"}
            </DetailField>
            <DetailField label="Tipo">{detalle.data.tipo ?? "—"}</DetailField>
            <DetailField label="Marca / modelo">
              {[detalle.data.marca, detalle.data.modelo]
                .filter(Boolean)
                .join(" · ") || "—"}
            </DetailField>
            <DetailField label="Número de serie">
              {detalle.data.nro_serie ?? "—"}
            </DetailField>
            <DetailField label="Horas de uso">
              {formatCantidad(detalle.data.horas_uso)} h
            </DetailField>
          </dl>

          <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              <CalendarClock className="h-3.5 w-3.5" />
              Mantenimientos programados
            </div>
            {detalle.data.programaciones.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100">
                {detalle.data.programaciones.map((programacion) => {
                  const estado = estadoMantenimiento(
                    programacion.proximo_mant,
                  );

                  return (
                    <li
                      key={programacion.id_programacion}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {programacion.descripcion}
                        </p>
                        <p className="text-xs text-slate-400">
                          Próximo: {formatFechaCalendario(programacion.proximo_mant)}
                        </p>
                      </div>
                      <Badge variant={estado.tono}>{estado.etiqueta}</Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Sin mantenimientos programados
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              <ClipboardList className="h-3.5 w-3.5" />
              Últimas solicitudes
            </div>
            {detalle.data.solicitudes.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100">
                {detalle.data.solicitudes.map((solicitud) => (
                  <li
                    key={solicitud.id_solicitud}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {solicitud.codigo ?? "Sin código"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFechaHora(solicitud.fecha_recepcion)}
                      </p>
                    </div>
                    <Badge
                      variant={TONO_ESTADO_SOLICITUD[solicitud.estado]}
                    >
                      {ETIQUETA_ESTADO_SOLICITUD[solicitud.estado]}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Sin solicitudes registradas para esta máquina
              </p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
