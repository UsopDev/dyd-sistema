import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Ban,
  CheckCircle2,
  Eye,
  Loader2,
  PackagePlus,
  Play,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { mensajeDeError } from "@/lib/http";
import {
  formatCantidad,
  formatFechaHora,
  formatSoles,
  formatSolesDecimal,
} from "@/lib/format";
import {
  ETIQUETA_ESTADO_GENERAL,
  ETIQUETA_ESTADO_ORDEN,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_SERVICIO,
  TONO_ESTADO_GENERAL,
  TONO_ESTADO_ORDEN,
  TONO_PRIORIDAD,
  TONO_TIPO_SERVICIO,
} from "@/lib/admin-labels";
import {
  useAgregarMaterialOrden,
  useCancelarOrden,
  useCrearOrden,
  useFinalizarOrden,
  useIniciarOrden,
  useMaterialesOpciones,
  useOrdenDetalle,
  useOrdenes,
  useSolicitudesOpciones,
  useUsuariosOpciones,
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
  EstadoOrden,
  FinalizarOrdenPayload,
  OrdenDetalle,
  OrdenMaterialPayload,
  OrdenPayload,
  OrdenTrabajo,
} from "@/types/admin";

const LIMITE = 20;
const MAXIMO = 99999999.99;

const ESTADOS: Array<{ value: EstadoOrden; label: string }> = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const montoOpcional = z
  .number("Ingresá un número")
  .min(0, "No puede ser negativo")
  .max(MAXIMO)
  .optional();

const ordenSchema = z.object({
  id_solicitud: z.string().min(1, "Seleccioná una solicitud"),
  id_tecnico: z.string().min(1, "Seleccioná un técnico"),
  monto: montoOpcional,
});

type OrdenFormValues = z.infer<typeof ordenSchema>;

const VACIOS: OrdenFormValues = {
  id_solicitud: "",
  id_tecnico: "",
  monto: undefined,
};

const finalizarSchema = z.object({
  trabajo_realizado: z
    .string()
    .trim()
    .min(5, "Describí el trabajo realizado")
    .max(5000, "Máximo 5000 caracteres"),
  monto: montoOpcional,
});

type FinalizarFormValues = z.infer<typeof finalizarSchema>;

const materialSchema = z.object({
  id_material: z.string().min(1, "Seleccioná un material"),
  cantidad: z
    .number("Ingresá una cantidad")
    .positive("Debe ser mayor a cero")
    .max(MAXIMO),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

function CrearOrdenDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const crear = useCrearOrden();
  const solicitudes = useSolicitudesOpciones("COTIZADA");
  const tecnicos = useUsuariosOpciones();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrdenFormValues>({
    resolver: zodResolver(ordenSchema),
    defaultValues: VACIOS,
  });

  useEffect(() => {
    if (open) reset(VACIOS);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: OrdenPayload = {
      id_solicitud: values.id_solicitud,
      id_tecnico: values.id_tecnico,
      ...(values.monto !== undefined ? { monto: values.monto } : {}),
    };

    try {
      const orden = await crear.mutateAsync(payload);
      toast({
        title: "Orden asignada",
        description: `${orden.codigo ?? "Orden"} quedó pendiente de inicio.`,
        variant: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo crear la orden",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  });

  const guardando = isSubmitting || crear.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva orden de trabajo"
      description="Asigná una solicitud cotizada a un técnico disponible."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="orden-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Asignar orden
          </Button>
        </>
      }
    >
      <form id="orden-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Solicitud cotizada"
          htmlFor="id_solicitud"
          error={errors.id_solicitud?.message}
          hint="La solicitud debe tener diagnóstico y cotización."
          required
          className="sm:col-span-2"
        >
          <Select id="id_solicitud" {...register("id_solicitud")}>
            <option value="">Seleccioná una solicitud</option>
            {(solicitudes.data ?? []).map((solicitud) => (
              <option key={solicitud.id_solicitud} value={solicitud.id_solicitud}>
                {solicitud.codigo ?? "Sin código"} · {solicitud.maquina.nombre}
                {solicitud.cliente ? ` · ${solicitud.cliente.razon_social}` : ""}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Técnico asignado"
          htmlFor="id_tecnico"
          error={errors.id_tecnico?.message}
          required
        >
          <Select id="id_tecnico" {...register("id_tecnico")}>
            <option value="">Seleccioná un técnico</option>
            {(tecnicos.data ?? []).map((tecnico) => (
              <option key={tecnico.id_usuario} value={tecnico.id_usuario}>
                {tecnico.nombres} {tecnico.apellidos}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Monto (S/)"
          htmlFor="monto"
          error={errors.monto?.message}
          hint="Opcional. Si se deja vacío, se usa el total de la última cotización."
        >
          <Input
            id="monto"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            {...register("monto", {
              setValueAs: (valor) =>
                valor === "" || valor === null || valor === undefined
                  ? undefined
                  : Number(valor),
            })}
          />
        </FormField>
      </form>
    </Modal>
  );
}

function FinalizarOrdenDialog({
  open,
  orden,
  onClose,
}: {
  open: boolean;
  orden: OrdenTrabajo | null;
  onClose: () => void;
}) {
  const finalizar = useFinalizarOrden();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FinalizarFormValues>({
    resolver: zodResolver(finalizarSchema),
    defaultValues: { trabajo_realizado: "", monto: undefined },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      trabajo_realizado: "",
      monto: orden?.monto !== null && orden?.monto !== undefined
        ? Number(orden.monto)
        : undefined,
    });
  }, [open, orden, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!orden) return;

    const payload: FinalizarOrdenPayload = {
      trabajo_realizado: values.trabajo_realizado.trim(),
      ...(values.monto !== undefined ? { monto: values.monto } : {}),
    };

    try {
      await finalizar.mutateAsync({ id: orden.id_orden_trabajo, payload });
      toast({
        title: "Orden finalizada",
        description: "La solicitud también quedó finalizada.",
        variant: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo finalizar la orden",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  });

  const guardando = isSubmitting || finalizar.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finalizar orden"
      description="Registrá el trabajo realizado y el monto final."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="finalizar-orden-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Finalizar orden
          </Button>
        </>
      }
    >
      <form id="finalizar-orden-form" onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Trabajo realizado"
          htmlFor="trabajo_realizado"
          error={errors.trabajo_realizado?.message}
          required
        >
          <Textarea
            id="trabajo_realizado"
            rows={4}
            placeholder="Detallá las tareas ejecutadas..."
            {...register("trabajo_realizado")}
          />
        </FormField>

        <FormField
          label="Monto final (S/)"
          htmlFor="monto_final"
          error={errors.monto?.message}
          hint="Opcional. Si no se indica, se conserva el monto actual."
        >
          <Input
            id="monto_final"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            {...register("monto", {
              setValueAs: (valor) =>
                valor === "" || valor === null || valor === undefined
                  ? undefined
                  : Number(valor),
            })}
          />
        </FormField>
      </form>
    </Modal>
  );
}

function AgregarMaterialForm({
  ordenId,
  onDone,
}: {
  ordenId: string;
  onDone: () => void;
}) {
  const agregar = useAgregarMaterialOrden();
  const materiales = useMaterialesOpciones();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: { id_material: "", cantidad: 1 },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload: OrdenMaterialPayload = {
      id_material: values.id_material,
      cantidad: values.cantidad,
    };

    try {
      await agregar.mutateAsync({ id: ordenId, payload });
      toast({
        title: "Material registrado",
        description: "Se descontó del inventario y se sumó a la orden.",
        variant: "success",
      });
      reset({ id_material: "", cantidad: 1 });
      onDone();
    } catch (error) {
      toast({
        title: "No se pudo agregar el material",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  });

  const guardando = isSubmitting || agregar.isPending;

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
      <FormField
        label="Material"
        htmlFor="id_material_orden"
        error={errors.id_material?.message}
      >
        <Select id="id_material_orden" {...register("id_material")}>
          <option value="">Seleccioná un material</option>
          {(materiales.data ?? []).map((material) => (
            <option key={material.id_material} value={material.id_material}>
              {material.nombre} · stock {formatCantidad(material.stock_actual)}{" "}
              {material.unidad}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Cantidad"
        htmlFor="cantidad_material"
        error={errors.cantidad?.message}
      >
        <Input
          id="cantidad_material"
          type="number"
          min={0.01}
          step="0.01"
          {...register("cantidad")}
        />
      </FormField>

      <Button type="submit" size="sm" disabled={guardando} className="self-end">
        {guardando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PackagePlus className="h-4 w-4" />
        )}
        Agregar
      </Button>
    </form>
  );
}

export function OrdenesPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const qDebounced = useDebouncedValue(q);
  const { toast } = useToast();

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, estado]);

  const consulta = useOrdenes({
    q: qDebounced || undefined,
    estado: estado || undefined,
    pagina,
    limite: LIMITE,
  });

  const [crearOpen, setCrearOpen] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [finalizarOpen, setFinalizarOpen] = useState(false);
  const [ordenACancelar, setOrdenACancelar] = useState<OrdenTrabajo | null>(null);

  const detalle = useOrdenDetalle(detalleId);
  const iniciar = useIniciarOrden();
  const cancelar = useCancelarOrden();
  const ordenes = consulta.data?.ordenes ?? [];
  const total = consulta.data?.total ?? 0;

  const iniciarOrden = async (orden: OrdenTrabajo) => {
    try {
      await iniciar.mutateAsync(orden.id_orden_trabajo);
      toast({
        title: "Orden iniciada",
        description: `${orden.codigo ?? "Orden"} pasó a En proceso.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "No se pudo iniciar la orden",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  };

  const confirmarCancelacion = async () => {
    if (!ordenACancelar) return;

    try {
      await cancelar.mutateAsync(ordenACancelar.id_orden_trabajo);
      toast({
        title: "Orden cancelada",
        description:
          "La solicitud asociada también quedó cancelada.",
        variant: "success",
      });
      setOrdenACancelar(null);
    } catch (error) {
      toast({
        title: "No se pudo cancelar la orden",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  };

  const columnas: Column<OrdenTrabajo>[] = [
    {
      key: "orden",
      header: "Orden",
      cell: (orden) => (
        <div className="min-w-[150px]">
          <p className="font-semibold text-slate-900">
            {orden.codigo ?? "Sin código"}
          </p>
          <p className="text-xs text-slate-400">
            {orden.solicitud.codigo ?? "Solicitud sin código"}
          </p>
        </div>
      ),
    },
    {
      key: "tecnico",
      header: "Técnico",
      cell: (orden) =>
        `${orden.tecnico.nombres} ${orden.tecnico.apellidos}`,
    },
    {
      key: "estado",
      header: "Estado",
      cell: (orden) => (
        <Badge variant={TONO_ESTADO_ORDEN[orden.estado]}>
          {ETIQUETA_ESTADO_ORDEN[orden.estado]}
        </Badge>
      ),
    },
    {
      key: "monto",
      header: "Monto",
      cell: (orden) =>
        orden.monto !== null ? (
          <span className="font-semibold tabular-nums text-slate-900">
            {formatSoles(orden.monto)}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "fechas",
      header: "Inicio / fin",
      cell: (orden) => (
        <div className="text-xs text-slate-500">
          <p>{orden.fecha_inicio ? formatFechaHora(orden.fecha_inicio) : "Sin iniciar"}</p>
          <p>{orden.fecha_fin ? formatFechaHora(orden.fecha_fin) : "—"}</p>
        </div>
      ),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (orden) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDetalleId(orden.id_orden_trabajo)}
            aria-label="Ver orden"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {orden.estado === "PENDIENTE" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void iniciarOrden(orden)}
              aria-label="Iniciar orden"
            >
              <Play className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          {orden.estado === "EN_PROCESO" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDetalleId(orden.id_orden_trabajo);
              }}
              aria-label="Finalizar orden"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </Button>
          )}
          {orden.estado === "PENDIENTE" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOrdenACancelar(orden)}
              aria-label="Cancelar orden"
            >
              <Ban className="h-4 w-4 text-rose-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const ordenDetalle = detalle.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Órdenes de trabajo"
        description="Asignación, ejecución y cierre de los servicios."
      >
        <Button type="button" onClick={() => setCrearOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva orden
        </Button>
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por código de orden"
          />
          <SelectFilter
            value={estado}
            onChange={setEstado}
            placeholder="Todos los estados"
            options={ESTADOS}
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={ordenes}
          getRowKey={(orden) => orden.id_orden_trabajo}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(consulta.error, "No se pudieron cargar las órdenes")
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(orden) => setDetalleId(orden.id_orden_trabajo)}
          emptyTitle="Todavía no hay órdenes"
          emptyDescription="Cotizá y aprobá una solicitud para asignarle una orden de trabajo."
          minWidth="1000px"
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

      <CrearOrdenDialog open={crearOpen} onClose={() => setCrearOpen(false)} />

      <FinalizarOrdenDialog
        open={finalizarOpen}
        orden={ordenDetalle ?? null}
        onClose={() => setFinalizarOpen(false)}
      />

      <Modal
        open={Boolean(detalleId)}
        onClose={() => setDetalleId(null)}
        title={ordenDetalle?.codigo ?? "Detalle de la orden"}
        description="Solicitud, técnico, materiales y avance del trabajo."
        size="xl"
        footer={
          ordenDetalle ? (
            <>
              {ordenDetalle.estado === "PENDIENTE" && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setOrdenACancelar(ordenDetalle);
                      setDetalleId(null);
                    }}
                  >
                    <Ban className="h-4 w-4" />
                    Cancelar orden
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={iniciar.isPending}
                    onClick={() => void iniciarOrden(ordenDetalle)}
                  >
                    {iniciar.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Iniciar
                  </Button>
                </>
              )}
              {ordenDetalle.estado === "EN_PROCESO" && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setFinalizarOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalizar
                </Button>
              )}
            </>
          ) : null
        }
      >
        {detalle.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, indice) => (
              <Skeleton key={indice} className="h-4 w-full max-w-[420px]" />
            ))}
          </div>
        ) : detalle.error ? (
          <p className="text-sm text-rose-600">{mensajeDeError(detalle.error)}</p>
        ) : ordenDetalle ? (
          <DetalleOrden
            orden={ordenDetalle}
            onMaterialAgregado={() => void detalle.refetch()}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(ordenACancelar)}
        onClose={() => setOrdenACancelar(null)}
        onConfirm={() => void confirmarCancelacion()}
        title="Cancelar orden de trabajo"
        description={`La orden ${ordenACancelar?.codigo ?? ""} y su solicitud quedarán canceladas. Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar orden"
        loading={cancelar.isPending}
      />
    </div>
  );
}

function DetalleOrden({
  orden,
  onMaterialAgregado,
}: {
  orden: OrdenDetalle;
  onMaterialAgregado: () => void;
}) {
  const totalMateriales = orden.materiales.reduce(
    (total, linea) =>
      total +
      (linea.subtotal !== null
        ? Number(linea.subtotal)
        : Number(linea.cantidad) * Number(linea.precio_unitario ?? 0)),
    0,
  );

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Estado">
          <Badge variant={TONO_ESTADO_ORDEN[orden.estado]}>
            {ETIQUETA_ESTADO_ORDEN[orden.estado]}
          </Badge>
        </DetailField>
        <DetailField label="Monto de la orden">
          {orden.monto !== null ? formatSoles(orden.monto) : "—"}
        </DetailField>
        <DetailField label="Técnico">
          {orden.tecnico.nombres} {orden.tecnico.apellidos}
        </DetailField>
        <DetailField label="Solicitud">
          {orden.solicitud.codigo ?? orden.id_solicitud}
        </DetailField>
        <DetailField label="Inicio">
          {orden.fecha_inicio ? formatFechaHora(orden.fecha_inicio) : "Sin iniciar"}
        </DetailField>
        <DetailField label="Fin">
          {orden.fecha_fin ? formatFechaHora(orden.fecha_fin) : "—"}
        </DetailField>
      </dl>

      <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
          Solicitud
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={TONO_TIPO_SERVICIO[orden.solicitud.tipo_servicio]}>
            {ETIQUETA_TIPO_SERVICIO[orden.solicitud.tipo_servicio]}
          </Badge>
          <Badge variant={TONO_PRIORIDAD[orden.solicitud.prioridad]}>
            Prioridad {ETIQUETA_PRIORIDAD[orden.solicitud.prioridad]}
          </Badge>
          <span className="text-sm text-slate-600">
            {orden.solicitud.maquina.nombre}
            {orden.solicitud.maquina.codigo
              ? ` (${orden.solicitud.maquina.codigo})`
              : ""}
            {orden.solicitud.cliente
              ? ` · ${orden.solicitud.cliente.razon_social}`
              : ""}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {orden.solicitud.descripcion}
        </p>
      </div>

      {orden.diagnostico && (
        <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Diagnóstico
            </p>
            <Badge variant={TONO_ESTADO_GENERAL[orden.diagnostico.estado_general]}>
              {ETIQUETA_ESTADO_GENERAL[orden.diagnostico.estado_general]}
            </Badge>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {orden.diagnostico.fallas_detectadas}
          </p>
          {orden.diagnostico.recomendaciones && (
            <p className="mt-2 text-xs text-slate-500">
              Recomendaciones: {orden.diagnostico.recomendaciones}
            </p>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Materiales usados</p>
          <span className="text-sm font-semibold tabular-nums text-slate-700">
            {formatSoles(totalMateriales)}
          </span>
        </div>

        {orden.materiales.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400">
            Sin materiales registrados
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Material
                  </th>
                  <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Cantidad
                  </th>
                  <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Precio
                  </th>
                  <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {orden.materiales.map((linea) => (
                  <tr key={linea.id_orden_material} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">
                      {linea.material.nombre}
                      <span className="ml-1 text-xs text-slate-400">
                        ({linea.material.unidad})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {formatCantidad(linea.cantidad)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {linea.precio_unitario !== null
                        ? formatSolesDecimal(linea.precio_unitario)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                      {linea.subtotal !== null
                        ? formatSoles(linea.subtotal)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orden.estado === "EN_PROCESO" && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="mb-3 text-sm font-bold text-slate-900">
              Registrar consumo de material
            </p>
            <AgregarMaterialForm
              ordenId={orden.id_orden_trabajo}
              onDone={onMaterialAgregado}
            />
          </div>
        )}
      </div>

      {orden.trabajo_realizado && (
        <DetailField label="Trabajo realizado">
          <span className="whitespace-pre-line font-normal leading-relaxed text-slate-600">
            {orden.trabajo_realizado}
          </span>
        </DetailField>
      )}
    </div>
  );
}
