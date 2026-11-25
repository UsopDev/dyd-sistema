import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Check,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
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
  ETIQUETA_ESTADO_SOLICITUD,
  ETIQUETA_TIPO_ITEM,
  TONO_ESTADO_SOLICITUD,
} from "@/lib/admin-labels";
import {
  useActualizarCotizacion,
  useAprobarCotizacion,
  useCotizacionDetalle,
  useCotizaciones,
  useCrearCotizacion,
  useEliminarCotizacion,
  useMaterialesOpciones,
  useRechazarCotizacion,
  useSolicitudesOpciones,
} from "@/features/admin/hooks/use-admin-queries";
import { useDebouncedValue } from "@/features/admin/hooks/use-debounced-value";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";
import { DataTable, type Column } from "@/features/admin/components/data-table";
import { FiltersBar, SearchFilter } from "@/features/admin/components/filters";
import { FormField } from "@/features/admin/components/form-field";
import { Modal } from "@/features/admin/components/modal";
import { DetailField } from "@/features/admin/components/states";
import { TablePagination } from "@/features/admin/components/table-pagination";
import type {
  ActualizarCotizacionPayload,
  Cotizacion,
  CotizacionDetalle,
  CotizacionPayload,
  LineaCotizacionPayload,
  TipoItem,
} from "@/types/admin";

const LIMITE = 20;
const MAXIMO = 99999999.99;

interface LineaFormValues {
  tipo: TipoItem;
  id_material?: string;
  descripcion?: string;
  cantidad: number;
  precio_unitario?: number;
}

const lineaSchema = z.object({
  tipo: z.enum(["SERVICIO", "MATERIAL"]),
  id_material: z.string().optional(),
  descripcion: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  cantidad: z
    .number("Ingresá una cantidad")
    .positive("Debe ser mayor a cero")
    .max(MAXIMO),
  precio_unitario: z
    .number("Ingresá un número")
    .min(0, "No puede ser negativo")
    .max(MAXIMO)
    .optional(),
});

const cotizacionSchema = z
  .object({
    id_solicitud: z.string().min(1, "Seleccioná una solicitud"),
    observaciones: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    detalles: z
      .array(lineaSchema)
      .min(1, "Agregá al menos una línea a la cotización"),
  })
  .superRefine((datos, ctx) => {
    datos.detalles.forEach((linea, indice) => {
      if (linea.tipo === "SERVICIO") {
        if (!linea.descripcion?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: "Describí el servicio",
            path: ["detalles", indice, "descripcion"],
          });
        }
        if (linea.precio_unitario === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "Indicá el precio",
            path: ["detalles", indice, "precio_unitario"],
          });
        }
      } else if (!linea.id_material) {
        ctx.addIssue({
          code: "custom",
          message: "Seleccioná el material",
          path: ["detalles", indice, "id_material"],
        });
      }
    });
  });

type CotizacionFormValues = z.infer<typeof cotizacionSchema>;

const LINEA_SERVICIO: LineaFormValues = {
  tipo: "SERVICIO",
  descripcion: "",
  cantidad: 1,
  precio_unitario: undefined,
};

const LINEA_MATERIAL: LineaFormValues = {
  tipo: "MATERIAL",
  id_material: "",
  cantidad: 1,
  precio_unitario: undefined,
};

const VACIOS: CotizacionFormValues = {
  id_solicitud: "",
  observaciones: "",
  detalles: [LINEA_SERVICIO],
};

function textoONull(valor?: string): string | null {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

function precioSugerido(
  linea: LineaFormValues,
  materiales: Array<{ id_material: string; precio_unitario: string | null }>,
): number | undefined {
  if (linea.tipo !== "MATERIAL" || !linea.id_material) return undefined;

  const material = materiales.find(
    (item) => item.id_material === linea.id_material,
  );

  return material?.precio_unitario !== null && material?.precio_unitario !== undefined
    ? Number(material.precio_unitario)
    : undefined;
}

function calcularTotal(
  lineas: LineaFormValues[],
  materiales: Array<{ id_material: string; precio_unitario: string | null }>,
): number {
  return lineas.reduce((total, linea) => {
    const precio = linea.precio_unitario ?? precioSugerido(linea, materiales) ?? 0;
    return total + (Number(linea.cantidad) || 0) * precio;
  }, 0);
}

function CotizacionFormDialog({
  open,
  cotizacionId,
  onClose,
}: {
  open: boolean;
  cotizacionId: string | null;
  onClose: () => void;
}) {
  const crear = useCrearCotizacion();
  const actualizar = useActualizarCotizacion();
  const solicitudes = useSolicitudesOpciones("all");
  const materiales = useMaterialesOpciones();
  const detalle = useCotizacionDetalle(open ? cotizacionId : null);
  const { toast } = useToast();
  const editando = Boolean(cotizacionId);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CotizacionFormValues>({
    resolver: zodResolver(cotizacionSchema),
    defaultValues: VACIOS,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const lineas = (watch("detalles") ?? []) as LineaFormValues[];
  const total = calcularTotal(lineas, materiales.data ?? []);

  useEffect(() => {
    if (!open) return;

    if (!cotizacionId) {
      reset(VACIOS);
      return;
    }

    if (detalle.data) {
      reset({
        id_solicitud: detalle.data.id_solicitud,
        observaciones: detalle.data.observaciones ?? "",
        detalles: detalle.data.detalles.map((linea) => ({
          tipo: linea.tipo,
          id_material: linea.id_material ?? "",
          descripcion: linea.descripcion,
          cantidad: Number(linea.cantidad),
          precio_unitario: Number(linea.precio_unitario),
        })),
      });
    }
  }, [open, cotizacionId, detalle.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const detalles: LineaCotizacionPayload[] = values.detalles.map((linea) =>
      linea.tipo === "SERVICIO"
        ? {
            tipo: "SERVICIO",
            descripcion: linea.descripcion!.trim(),
            cantidad: linea.cantidad,
            precio_unitario: linea.precio_unitario!,
          }
        : {
            tipo: "MATERIAL",
            id_material: linea.id_material!,
            cantidad: linea.cantidad,
            ...(linea.precio_unitario !== undefined
              ? { precio_unitario: linea.precio_unitario }
              : {}),
          },
    );

    try {
      if (cotizacionId) {
        const payload: ActualizarCotizacionPayload = {
          observaciones: textoONull(values.observaciones),
          detalles,
        };
        await actualizar.mutateAsync({ id: cotizacionId, payload });
        toast({
          title: "Cotización actualizada",
          description: formatSoles(total),
          variant: "success",
        });
      } else {
        const payload: CotizacionPayload = {
          id_solicitud: values.id_solicitud,
          observaciones: textoONull(values.observaciones),
          detalles,
        };
        await crear.mutateAsync(payload);
        toast({
          title: "Cotización creada",
          description: `Total ${formatSoles(total)}. La solicitud pasó a Cotizada.`,
          variant: "success",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar la cotización",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  });

  const guardando =
    isSubmitting || crear.isPending || actualizar.isPending || detalle.isLoading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? "Editar cotización" : "Nueva cotización"}
      description={
        editando
          ? "Solo editable mientras la solicitud está en estado Cotizada."
          : "Podés cotizar solicitudes que ya tienen diagnóstico."
      }
      size="xl"
      footer={
        <>
          <span className="mr-auto text-sm font-semibold text-slate-700">
            Total: {formatSoles(total)}
          </span>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button type="submit" form="cotizacion-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Crear cotización"}
          </Button>
        </>
      }
    >
      {editando && detalle.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <form
          id="cotizacion-form"
          onSubmit={onSubmit}
          className="space-y-5"
        >
          <FormField
            label="Solicitud"
            htmlFor="id_solicitud"
            error={errors.id_solicitud?.message}
            hint={
              editando
                ? undefined
                : "Solo se listan solicitudes con diagnóstico pendientes de cotizar."
            }
            required
          >
            <Select
              id="id_solicitud"
              disabled={editando}
              {...register("id_solicitud")}
            >
              <option value="">Seleccioná una solicitud</option>
              {editando && detalle.data && (
                <option value={detalle.data.id_solicitud}>
                  {detalle.data.solicitud.codigo ?? detalle.data.id_solicitud}
                </option>
              )}
              {(solicitudes.data ?? []).map((solicitud) => (
                <option key={solicitud.id_solicitud} value={solicitud.id_solicitud}>
                  {solicitud.codigo ?? "Sin código"} ·{" "}
                  {solicitud.maquina.nombre}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">Líneas</p>
                <p className="text-xs text-slate-500">
                  Servicios con precio propio y materiales del inventario.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ ...LINEA_SERVICIO })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Servicio
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ ...LINEA_MATERIAL })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Material
                </Button>
              </div>
            </div>

            {typeof errors.detalles?.message === "string" && (
              <p className="text-[11px] font-medium text-rose-600">
                {errors.detalles.message}
              </p>
            )}

            {fields.map((field, indice) => {
              const linea = lineas[indice] ?? field;
              const sugerido = precioSugerido(linea, materiales.data ?? []);
              const subtotal =
                (Number(linea.cantidad) || 0) *
                (linea.precio_unitario ?? sugerido ?? 0);

              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-slate-200 bg-white/70 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-12">
                    <FormField
                      label="Tipo"
                      error={errors.detalles?.[indice]?.tipo?.message}
                      className="sm:col-span-2"
                    >
                      <Select
                        aria-label={`Tipo de la línea ${indice + 1}`}
                        {...register(`detalles.${indice}.tipo`)}
                      >
                        <option value="SERVICIO">Servicio</option>
                        <option value="MATERIAL">Material</option>
                      </Select>
                    </FormField>

                    {linea.tipo === "SERVICIO" ? (
                      <FormField
                        label="Descripción"
                        error={
                          errors.detalles?.[indice]?.descripcion?.message
                        }
                        className="sm:col-span-4"
                      >
                        <Input
                          placeholder="Mano de obra, reparación..."
                          {...register(`detalles.${indice}.descripcion`)}
                        />
                      </FormField>
                    ) : (
                      <FormField
                        label="Material"
                        error={
                          errors.detalles?.[indice]?.id_material?.message
                        }
                        className="sm:col-span-4"
                      >
                        <Select
                          aria-label={`Material de la línea ${indice + 1}`}
                          {...register(`detalles.${indice}.id_material`)}
                        >
                          <option value="">Seleccioná un material</option>
                          {(materiales.data ?? []).map((material) => (
                            <option
                              key={material.id_material}
                              value={material.id_material}
                            >
                              {material.nombre}
                              {material.precio_unitario
                                ? ` · ${formatSolesDecimal(material.precio_unitario)}`
                                : ""}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    )}

                    <FormField
                      label="Cantidad"
                      error={errors.detalles?.[indice]?.cantidad?.message}
                      className="sm:col-span-2"
                    >
                      <Input
                        type="number"
                        min={0.01}
                        step="0.01"
                        {...register(`detalles.${indice}.cantidad`, {
                          setValueAs: (valor) =>
                            valor === "" || valor === null || valor === undefined
                              ? undefined
                              : Number(valor),
                        })}
                      />
                    </FormField>

                    <FormField
                      label="Precio unit."
                      error={
                        errors.detalles?.[indice]?.precio_unitario?.message
                      }
                      hint={
                        linea.tipo === "MATERIAL" && sugerido !== undefined
                          ? `Sugerido: ${formatSolesDecimal(sugerido)}`
                          : undefined
                      }
                      className="sm:col-span-2"
                    >
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder={
                          sugerido !== undefined
                            ? String(sugerido)
                            : "0.00"
                        }
                        {...register(`detalles.${indice}.precio_unitario`, {
                          setValueAs: (valor) =>
                            valor === "" || valor === null || valor === undefined
                              ? undefined
                              : Number(valor),
                        })}
                      />
                    </FormField>

                    <div className="flex items-end justify-between gap-2 sm:col-span-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          Subtotal
                        </p>
                        <p className="truncate text-sm font-bold text-slate-900 tabular-nums">
                          {formatSoles(subtotal)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(indice)}
                        disabled={fields.length === 1}
                        aria-label={`Quitar línea ${indice + 1}`}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <FormField
            label="Observaciones"
            htmlFor="observaciones"
            error={errors.observaciones?.message}
          >
            <Textarea
              id="observaciones"
              rows={2}
              placeholder="Condiciones, vigencia, notas comerciales..."
              {...register("observaciones")}
            />
          </FormField>
        </form>
      )}
    </Modal>
  );
}

type AccionPendiente =
  | { tipo: "rechazar"; cotizacion: Cotizacion }
  | { tipo: "eliminar"; cotizacion: Cotizacion };

export function CotizacionesPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q);
  const { toast } = useToast();

  useEffect(() => {
    setPagina(1);
  }, [qDebounced]);

  const consulta = useCotizaciones({
    q: qDebounced || undefined,
    pagina,
    limite: LIMITE,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [cotizacionEditando, setCotizacionEditando] = useState<string | null>(
    null,
  );
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente | null>(
    null,
  );

  const detalle = useCotizacionDetalle(detalleId);
  const aprobar = useAprobarCotizacion();
  const rechazar = useRechazarCotizacion();
  const eliminar = useEliminarCotizacion();
  const cotizaciones = consulta.data?.cotizaciones ?? [];
  const total = consulta.data?.total ?? 0;

  const abrirCrear = () => {
    setCotizacionEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (cotizacion: Cotizacion) => {
    setCotizacionEditando(cotizacion.id_cotizacion);
    setFormOpen(true);
  };

  const aprobarCotizacion = async (cotizacion: Cotizacion) => {
    try {
      const respuesta = await aprobar.mutateAsync(cotizacion.id_cotizacion);
      toast({
        title: "Cotización aprobada",
        description: respuesta.mensaje,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "No se pudo aprobar la cotización",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  };

  const confirmarAccion = async () => {
    if (!accionPendiente) return;

    const { tipo, cotizacion } = accionPendiente;

    try {
      if (tipo === "rechazar") {
        const respuesta = await rechazar.mutateAsync(cotizacion.id_cotizacion);
        toast({
          title: "Cotización rechazada",
          description: respuesta.mensaje,
          variant: "success",
        });
      } else {
        await eliminar.mutateAsync(cotizacion.id_cotizacion);
        toast({
          title: "Cotización eliminada",
          description: cotizacion.codigo ?? cotizacion.id_cotizacion,
          variant: "success",
        });
      }
      setAccionPendiente(null);
    } catch (error) {
      toast({
        title:
          tipo === "rechazar"
            ? "No se pudo rechazar la cotización"
            : "No se pudo eliminar la cotización",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  };

  const columnas: Column<Cotizacion>[] = [
    {
      key: "codigo",
      header: "Cotización",
      cell: (cotizacion) => (
        <div className="min-w-[150px]">
          <p className="font-semibold text-slate-900">
            {cotizacion.codigo ?? "Sin código"}
          </p>
          <p className="text-xs text-slate-400">
            {cotizacion.solicitud.codigo ?? "Solicitud sin código"}
          </p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (cotizacion) => (
        <span className="font-semibold tabular-nums text-slate-900">
          {formatSoles(cotizacion.total)}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Solicitud",
      cell: (cotizacion) => (
        <Badge variant={TONO_ESTADO_SOLICITUD[cotizacion.solicitud.estado]}>
          {ETIQUETA_ESTADO_SOLICITUD[cotizacion.solicitud.estado]}
        </Badge>
      ),
    },
    {
      key: "usuario",
      header: "Elaborada por",
      cell: (cotizacion) =>
        `${cotizacion.usuario.nombres} ${cotizacion.usuario.apellidos}`,
    },
    {
      key: "fecha",
      header: "Fecha",
      cell: (cotizacion) => formatFechaHora(cotizacion.fecha),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (cotizacion) => {
        const activa = cotizacion.solicitud.estado === "COTIZADA";

        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDetalleId(cotizacion.id_cotizacion)}
              aria-label="Ver cotización"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {activa && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => abrirEditar(cotizacion)}
                  aria-label="Editar cotización"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void aprobarCotizacion(cotizacion)}
                  aria-label="Aprobar cotización"
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setAccionPendiente({ tipo: "rechazar", cotizacion })
                  }
                  aria-label="Rechazar cotización"
                >
                  <X className="h-4 w-4 text-amber-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setAccionPendiente({ tipo: "eliminar", cotizacion })
                  }
                  aria-label="Eliminar cotización"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cotizaciones"
        description="Propuestas económicas vinculadas a solicitudes diagnosticadas."
      >
        <Button type="button" onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nueva cotización
        </Button>
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por código de cotización"
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={cotizaciones}
          getRowKey={(cotizacion) => cotizacion.id_cotizacion}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(consulta.error, "No se pudieron cargar las cotizaciones")
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(cotizacion) => setDetalleId(cotizacion.id_cotizacion)}
          emptyTitle="Todavía no hay cotizaciones"
          emptyDescription="Diagnosticá una solicitud y generá su primera cotización."
          minWidth="980px"
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

      <CotizacionFormDialog
        open={formOpen}
        cotizacionId={cotizacionEditando}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={Boolean(detalleId)}
        onClose={() => setDetalleId(null)}
        title={detalle.data?.codigo ?? "Detalle de la cotización"}
        description="Líneas, totales y estado de la solicitud."
        size="lg"
        footer={
          detalle.data && detalle.data.solicitud.estado === "COTIZADA" ? (
            <>
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
              <Button
                type="button"
                variant="primary"
                onClick={() => void aprobarCotizacion(detalle.data!)}
              >
                <Check className="h-4 w-4" />
                Aprobar
              </Button>
            </>
          ) : null
        }
      >
        {detalle.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : detalle.error ? (
          <p className="text-sm text-rose-600">{mensajeDeError(detalle.error)}</p>
        ) : detalle.data ? (
          <CotizacionDetalleContenido cotizacion={detalle.data} />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(accionPendiente)}
        onClose={() => setAccionPendiente(null)}
        onConfirm={() => void confirmarAccion()}
        title={
          accionPendiente?.tipo === "eliminar"
            ? "Eliminar cotización"
            : "Rechazar cotización"
        }
        description={
          accionPendiente?.tipo === "eliminar"
            ? `La cotización ${accionPendiente.cotizacion.codigo ?? ""} se eliminará y la solicitud volverá a En diagnóstico.`
            : `La cotización ${accionPendiente?.cotizacion.codigo ?? ""} quedará rechazada y la solicitud volverá a En diagnóstico para corregirla.`
        }
        confirmLabel={
          accionPendiente?.tipo === "eliminar" ? "Eliminar" : "Rechazar"
        }
        loading={rechazar.isPending || eliminar.isPending}
      />
    </div>
  );
}

function CotizacionDetalleContenido({
  cotizacion,
}: {
  cotizacion: CotizacionDetalle;
}) {
  const total = Number(cotizacion.total);

  return (
    <div className="space-y-5">
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Solicitud">
          {cotizacion.solicitud.codigo ?? cotizacion.id_solicitud}
        </DetailField>
        <DetailField label="Estado de la solicitud">
          <Badge variant={TONO_ESTADO_SOLICITUD[cotizacion.solicitud.estado]}>
            {ETIQUETA_ESTADO_SOLICITUD[cotizacion.solicitud.estado]}
          </Badge>
        </DetailField>
        <DetailField label="Elaborada por">
          {cotizacion.usuario.nombres} {cotizacion.usuario.apellidos}
        </DetailField>
        <DetailField label="Fecha">{formatFechaHora(cotizacion.fecha)}</DetailField>
      </dl>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Tipo
              </th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Descripción
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Cant.
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
            {cotizacion.detalles.map((linea) => (
              <tr key={linea.id_detalle} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <Badge variant={linea.tipo === "SERVICIO" ? "info" : "neutral"}>
                    {ETIQUETA_TIPO_ITEM[linea.tipo]}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-slate-700">{linea.descripcion}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                  {formatCantidad(linea.cantidad)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                  {formatSolesDecimal(linea.precio_unitario)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                  {formatSoles(
                    linea.subtotal ??
                      Number(linea.cantidad) * Number(linea.precio_unitario),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-blue-50/70 px-4 py-3 ring-1 ring-blue-100">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          <FileText className="h-4 w-4" />
          Total cotizado
        </span>
        <span className="text-lg font-bold tabular-nums text-slate-900">
          {formatSoles(total)}
        </span>
      </div>

      {cotizacion.observaciones && (
        <DetailField label="Observaciones">
          <span className="whitespace-pre-line font-normal leading-relaxed text-slate-600">
            {cotizacion.observaciones}
          </span>
        </DetailField>
      )}
    </div>
  );
}
