import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Ban,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Select, Textarea } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { mensajeDeError } from "@/lib/http";
import { formatFecha, formatFechaHora } from "@/lib/format";
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
import {
  useActualizarSolicitud,
  useCancelarSolicitud,
  useCrearSolicitud,
  useMaquinasOpciones,
  useSolicitudDetalle,
  useSolicitudes,
} from "@/features/admin/hooks/use-admin-queries";
import { useDebouncedValue } from "@/features/admin/hooks/use-debounced-value";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";
import { DataTable, type Column } from "@/features/admin/components/data-table";
import {
  FiltersBar,
  SearchFilter,
  SelectFilter,
} from "@/features/admin/components/filters";
import { FormField } from "@/features/admin/components/form-field";
import { Modal } from "@/features/admin/components/modal";
import { DetailField } from "@/features/admin/components/states";
import { TablePagination } from "@/features/admin/components/table-pagination";
import type {
  EstadoSolicitud,
  Prioridad,
  Solicitud,
  SolicitudPayload,
  TipoServicio,
} from "@/types/admin";

const LIMITE = 20;

const ESTADOS: Array<{ value: EstadoSolicitud; label: string }> = [
  { value: "RECIBIDA", label: "Recibida" },
  { value: "EN_DIAGNOSTICO", label: "En diagnóstico" },
  { value: "COTIZADA", label: "Cotizada" },
  { value: "ASIGNADA", label: "Asignada" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const PRIORIDADES: Array<{ value: Prioridad; label: string }> = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

const TIPOS: Array<{ value: TipoServicio; label: string }> = [
  { value: "PREVENTIVO", label: "Preventivo" },
  { value: "CORRECTIVO", label: "Correctivo" },
];

const ESTADOS_CANCELABLES: EstadoSolicitud[] = [
  "RECIBIDA",
  "EN_DIAGNOSTICO",
  "COTIZADA",
  "ASIGNADA",
];

const solicitudSchema = z.object({
  id_maquina: z.string().min(1, "Seleccioná una máquina"),
  tipo_servicio: z.enum(["PREVENTIVO", "CORRECTIVO"]),
  descripcion: z
    .string()
    .trim()
    .min(5, "Describí el problema con al menos 5 caracteres")
    .max(2000, "Máximo 2000 caracteres"),
  prioridad: z.enum(["ALTA", "MEDIA", "BAJA"]),
});

type SolicitudFormValues = z.infer<typeof solicitudSchema>;

const VACIOS: SolicitudFormValues = {
  id_maquina: "",
  tipo_servicio: "CORRECTIVO",
  descripcion: "",
  prioridad: "MEDIA",
};

function SolicitudFormDialog({
  open,
  solicitud,
  onClose,
}: {
  open: boolean;
  solicitud: Solicitud | null;
  onClose: () => void;
}) {
  const crear = useCrearSolicitud();
  const actualizar = useActualizarSolicitud();
  const maquinas = useMaquinasOpciones();
  const { toast } = useToast();
  const editando = Boolean(solicitud);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudFormValues>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: VACIOS,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      solicitud
        ? {
            id_maquina: solicitud.id_maquina,
            tipo_servicio: solicitud.tipo_servicio,
            descripcion: solicitud.descripcion,
            prioridad: solicitud.prioridad,
          }
        : VACIOS,
    );
  }, [open, solicitud, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (solicitud) {
        await actualizar.mutateAsync({
          id: solicitud.id_solicitud,
          payload: {
            descripcion: values.descripcion.trim(),
            prioridad: values.prioridad,
          },
        });
        toast({
          title: "Solicitud actualizada",
          description: solicitud.codigo ?? solicitud.id_solicitud,
          variant: "success",
        });
      } else {
        const payload: SolicitudPayload = {
          id_maquina: values.id_maquina,
          tipo_servicio: values.tipo_servicio,
          descripcion: values.descripcion.trim(),
          prioridad: values.prioridad,
        };
        await crear.mutateAsync(payload);
        toast({
          title: "Solicitud registrada",
          description: "Quedó en estado Recibida.",
          variant: "success",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar la solicitud",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  });

  const guardando = isSubmitting || crear.isPending || actualizar.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? "Editar solicitud" : "Nueva solicitud"}
      description={
        editando
          ? "Solo se puede editar una solicitud en estado Recibida."
          : "Registrá el pedido de servicio para una máquina."
      }
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button type="submit" form="solicitud-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Registrar solicitud"}
          </Button>
        </>
      }
    >
      <form id="solicitud-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Máquina"
          htmlFor="id_maquina"
          error={errors.id_maquina?.message}
          required
          className="sm:col-span-2"
        >
          <Select
            id="id_maquina"
            disabled={editando}
            {...register("id_maquina")}
          >
            <option value="">Seleccioná una máquina</option>
            {(maquinas.data ?? []).map((maquina) => (
              <option key={maquina.id_maquina} value={maquina.id_maquina}>
                {maquina.nombre}
                {maquina.codigo ? ` (${maquina.codigo})` : ""}
                {maquina.cliente ? ` · ${maquina.cliente.razon_social}` : ""}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Tipo de servicio"
          htmlFor="tipo_servicio"
          error={errors.tipo_servicio?.message}
        >
          <Select
            id="tipo_servicio"
            disabled={editando}
            {...register("tipo_servicio")}
          >
            {TIPOS.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Prioridad"
          htmlFor="prioridad"
          error={errors.prioridad?.message}
        >
          <Select id="prioridad" {...register("prioridad")}>
            {PRIORIDADES.map((prioridad) => (
              <option key={prioridad.value} value={prioridad.value}>
                {prioridad.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Descripción"
          htmlFor="descripcion"
          error={errors.descripcion?.message}
          required
          className="sm:col-span-2"
        >
          <Textarea
            id="descripcion"
            rows={4}
            placeholder="Detallá el problema o el servicio solicitado..."
            {...register("descripcion")}
          />
        </FormField>
      </form>
    </Modal>
  );
}

export function SolicitudesPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [tipo, setTipo] = useState("");
  const qDebounced = useDebouncedValue(q);
  const { toast } = useToast();

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, estado, prioridad, tipo]);

  const consulta = useSolicitudes({
    q: qDebounced || undefined,
    estado: estado || undefined,
    prioridad: prioridad || undefined,
    tipo_servicio: tipo || undefined,
    pagina,
    limite: LIMITE,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [solicitudEditando, setSolicitudEditando] = useState<Solicitud | null>(
    null,
  );
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [solicitudACancelar, setSolicitudACancelar] =
    useState<Solicitud | null>(null);

  const detalle = useSolicitudDetalle(detalleId);
  const cancelar = useCancelarSolicitud();
  const solicitudes = consulta.data?.solicitudes ?? [];
  const total = consulta.data?.total ?? 0;

  const abrirCrear = () => {
    setSolicitudEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (solicitud: Solicitud) => {
    setSolicitudEditando(solicitud);
    setFormOpen(true);
  };

  const confirmarCancelacion = async () => {
    if (!solicitudACancelar) return;

    try {
      await cancelar.mutateAsync(solicitudACancelar.id_solicitud);
      toast({
        title: "Solicitud cancelada",
        description:
          solicitudACancelar.codigo ?? solicitudACancelar.id_solicitud,
        variant: "success",
      });
      setSolicitudACancelar(null);
    } catch (error) {
      toast({
        title: "No se pudo cancelar la solicitud",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  };

  const columnas: Column<Solicitud>[] = [
    {
      key: "solicitud",
      header: "Solicitud",
      cell: (solicitud) => (
        <div className="min-w-[210px] max-w-[320px]">
          <p className="font-semibold text-slate-900">
            {solicitud.codigo ?? "Sin código"}
          </p>
          <p className="truncate text-xs text-slate-400">
            {solicitud.descripcion}
          </p>
        </div>
      ),
    },
    {
      key: "maquina",
      header: "Máquina / cliente",
      cell: (solicitud) => (
        <div className="min-w-[160px]">
          <p className="font-medium text-slate-800">
            {solicitud.maquina.nombre}
          </p>
          <p className="text-xs text-slate-400">
            {solicitud.cliente?.razon_social ?? "Máquina propia de DYD"}
          </p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (solicitud) => (
        <Badge variant={TONO_TIPO_SERVICIO[solicitud.tipo_servicio]}>
          {ETIQUETA_TIPO_SERVICIO[solicitud.tipo_servicio]}
        </Badge>
      ),
    },
    {
      key: "prioridad",
      header: "Prioridad",
      cell: (solicitud) => (
        <Badge variant={TONO_PRIORIDAD[solicitud.prioridad]}>
          {ETIQUETA_PRIORIDAD[solicitud.prioridad]}
        </Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (solicitud) => (
        <Badge variant={TONO_ESTADO_SOLICITUD[solicitud.estado]}>
          {ETIQUETA_ESTADO_SOLICITUD[solicitud.estado]}
        </Badge>
      ),
    },
    {
      key: "fecha",
      header: "Recepción",
      cell: (solicitud) => formatFecha(solicitud.fecha_recepcion),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (solicitud) => {
        const puedeCancelar = ESTADOS_CANCELABLES.includes(solicitud.estado);

        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDetalleId(solicitud.id_solicitud)}
              aria-label={`Ver ${solicitud.codigo ?? "solicitud"}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {solicitud.estado === "RECIBIDA" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => abrirEditar(solicitud)}
                aria-label="Editar solicitud"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {puedeCancelar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSolicitudACancelar(solicitud)}
                aria-label="Cancelar solicitud"
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Solicitudes"
        description="Pedidos de servicio recibidos y su avance."
      >
        <Button type="button" onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </Button>
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por código o descripción"
          />
          <SelectFilter
            value={estado}
            onChange={setEstado}
            placeholder="Todos los estados"
            options={ESTADOS}
          />
          <SelectFilter
            value={prioridad}
            onChange={setPrioridad}
            placeholder="Toda prioridad"
            options={PRIORIDADES}
          />
          <SelectFilter
            value={tipo}
            onChange={setTipo}
            placeholder="Todo tipo"
            options={TIPOS}
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={solicitudes}
          getRowKey={(solicitud) => solicitud.id_solicitud}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(consulta.error, "No se pudieron cargar las solicitudes")
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(solicitud) => setDetalleId(solicitud.id_solicitud)}
          emptyTitle="Todavía no hay solicitudes"
          emptyDescription="Registrá la primera solicitud para iniciar el flujo de diagnóstico y cotización."
          minWidth="1040px"
          footer={
            <TablePagination
              pagina={pagina}
              limite={LIMITE}
              total={total}
              onPageChange={setPagina}
              cargando={consulta.isFetching}
            />
          }
        />
      </GlassCard>

      <SolicitudFormDialog
        open={formOpen}
        solicitud={solicitudEditando}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={Boolean(detalleId)}
        onClose={() => setDetalleId(null)}
        title={detalle.data?.codigo ?? "Detalle de la solicitud"}
        description="Estado del servicio y documentos asociados."
        size="lg"
        footer={
          detalle.data ? (
            <>
              {detalle.data.estado === "RECIBIDA" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDetalleId(null);
                    abrirEditar(detalle.data!);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {ESTADOS_CANCELABLES.includes(detalle.data.estado) && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setSolicitudACancelar(detalle.data!);
                    setDetalleId(null);
                  }}
                >
                  <Ban className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                onClick={() => setDetalleId(null)}
              >
                Cerrar
              </Button>
            </>
          ) : null
        }
      >
        {detalle.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 10 }).map((_, indice) => (
              <div key={indice} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full max-w-[220px]" />
              </div>
            ))}
          </div>
        ) : detalle.error ? (
          <p className="text-sm text-rose-600">{mensajeDeError(detalle.error)}</p>
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
              <DetailField label="Fecha de recepción">
                {formatFechaHora(detalle.data.fecha_recepcion)}
              </DetailField>
              <DetailField label="Máquina">
                {detalle.data.maquina.nombre}
                {detalle.data.maquina.codigo
                  ? ` (${detalle.data.maquina.codigo})`
                  : ""}
              </DetailField>
              <DetailField label="Cliente">
                {detalle.data.cliente?.razon_social ?? "Máquina propia de DYD"}
              </DetailField>
              <DetailField label="Registrada por">
                {detalle.data.usuario.nombres} {detalle.data.usuario.apellidos}
              </DetailField>
              <DetailField label="Última actualización">
                {formatFechaHora(detalle.data.actualizado_en)}
              </DetailField>
              <div className="sm:col-span-2">
                <DetailField label="Descripción">
                  <span className="whitespace-pre-line font-normal leading-relaxed text-slate-600">
                    {detalle.data.descripcion}
                  </span>
                </DetailField>
              </div>
            </dl>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Diagnóstico
                </div>
                {detalle.data.diagnostico ? (
                  <div className="mt-2 space-y-1">
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
                    <p className="text-xs text-slate-500">
                      {formatFechaHora(detalle.data.diagnostico.fecha)}
                    </p>
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
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {detalle.data.orden_trabajo.codigo ?? "Sin código"}
                    </p>
                    <Badge
                      variant={
                        TONO_ESTADO_ORDEN[detalle.data.orden_trabajo.estado]
                      }
                    >
                      {
                        ETIQUETA_ESTADO_ORDEN[
                          detalle.data.orden_trabajo.estado
                        ]
                      }
                    </Badge>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Sin orden asignada
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Cotizaciones registradas: {detalle.data._count.cotizaciones}
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(solicitudACancelar)}
        onClose={() => setSolicitudACancelar(null)}
        onConfirm={() => void confirmarCancelacion()}
        title="Cancelar solicitud"
        description={`La solicitud ${solicitudACancelar?.codigo ?? ""} quedará cancelada y no podrá continuar con diagnóstico, cotización ni orden. Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar solicitud"
        loading={cancelar.isPending}
      />
    </div>
  );
}
