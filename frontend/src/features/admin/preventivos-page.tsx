import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, Loader2, Pencil, Plus, Power } from "lucide-react";
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
  formatFecha,
  formatFechaHora,
  hoyISO,
} from "@/lib/format";
import {
  ETIQUETA_ESTADO_PREVENTIVO,
  TONO_ESTADO_PREVENTIVO,
} from "@/lib/admin-labels";
import {
  useActualizarPreventivo,
  useCrearPreventivo,
  useDesactivarPreventivo,
  useMaquinasOpciones,
  usePreventivoDetalle,
  usePreventivos,
} from "@/features/admin/hooks/use-admin-queries";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";
import { DataTable, type Column } from "@/features/admin/components/data-table";
import {
  FiltersBar,
  SelectFilter,
} from "@/features/admin/components/filters";
import { FormField } from "@/features/admin/components/form-field";
import { Modal } from "@/features/admin/components/modal";
import { DetailField } from "@/features/admin/components/states";
import { TablePagination } from "@/features/admin/components/table-pagination";
import type {
  ActualizarPreventivoPayload,
  EstadoPreventivo,
  Preventivo,
  PreventivoPayload,
} from "@/types/admin";

const LIMITE = 20;

const ESTADOS: Array<{ value: EstadoPreventivo; label: string }> = [
  { value: "AL_DIA", label: "Al día" },
  { value: "PROXIMO", label: "Próximo" },
  { value: "VENCIDO", label: "Vencido" },
];

const numeroOpcional = z
  .number("Ingresá un número")
  .min(0, "No puede ser negativo")
  .optional();

const enteroOpcionalPositivo = z
  .number("Ingresá un número")
  .int("Debe ser un número entero")
  .positive("Debe ser mayor a cero")
  .optional();

const preventivoSchema = z
  .object({
    id_maquina: z.string().min(1, "Seleccioná una máquina"),
    descripcion: z
      .string()
      .trim()
      .min(3, "Describí el mantenimiento")
      .max(200, "Máximo 200 caracteres"),
    frecuencia_horas: enteroOpcionalPositivo,
    frecuencia_dias: enteroOpcionalPositivo,
    dias_aviso: z
      .number("Ingresá un número")
      .int("Debe ser entero")
      .min(0, "No puede ser negativo")
      .max(365, "Máximo 365 días")
      .optional(),
    horas_aviso: numeroOpcional,
    horas_ultimo_mant: numeroOpcional,
    fecha_ultimo_mant: z.string().optional(),
    activo: z.boolean().optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.frecuencia_horas === undefined && datos.frecuencia_dias === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Indicá una frecuencia en horas, en días o ambas",
        path: ["frecuencia_horas"],
      });
    }

    if (datos.fecha_ultimo_mant && datos.fecha_ultimo_mant > hoyISO()) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha no puede ser futura",
        path: ["fecha_ultimo_mant"],
      });
    }
  });

type PreventivoFormValues = z.infer<typeof preventivoSchema>;

const VACIOS: PreventivoFormValues = {
  id_maquina: "",
  descripcion: "",
  frecuencia_horas: undefined,
  frecuencia_dias: undefined,
  dias_aviso: 7,
  horas_aviso: 10,
  horas_ultimo_mant: undefined,
  fecha_ultimo_mant: "",
  activo: true,
};

function PreventivoFormDialog({
  open,
  preventivo,
  onClose,
}: {
  open: boolean;
  preventivo: Preventivo | null;
  onClose: () => void;
}) {
  const crear = useCrearPreventivo();
  const actualizar = useActualizarPreventivo();
  const maquinas = useMaquinasOpciones();
  const { toast } = useToast();
  const editando = Boolean(preventivo);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PreventivoFormValues>({
    resolver: zodResolver(preventivoSchema),
    defaultValues: VACIOS,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      preventivo
        ? {
            id_maquina: preventivo.id_maquina,
            descripcion: preventivo.descripcion,
            frecuencia_horas: preventivo.frecuencia_horas ?? undefined,
            frecuencia_dias: preventivo.frecuencia_dias ?? undefined,
            dias_aviso: preventivo.dias_aviso,
            horas_aviso: Number(preventivo.horas_aviso),
            horas_ultimo_mant:
              preventivo.horas_ultimo_mant !== null
                ? Number(preventivo.horas_ultimo_mant)
                : undefined,
            fecha_ultimo_mant: preventivo.fecha_ultimo_mant?.slice(0, 10) ?? "",
            activo: preventivo.activo,
          }
        : VACIOS,
    );
  }, [open, preventivo, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (preventivo) {
        const payload: ActualizarPreventivoPayload = {
          descripcion: values.descripcion.trim(),
          frecuencia_horas: values.frecuencia_horas ?? null,
          frecuencia_dias: values.frecuencia_dias ?? null,
          dias_aviso: values.dias_aviso,
          horas_aviso: values.horas_aviso,
          activo: values.activo,
        };
        await actualizar.mutateAsync({
          id: preventivo.id_programacion,
          payload,
        });
        toast({
          title: "Programación actualizada",
          description: values.descripcion.trim(),
          variant: "success",
        });
      } else {
        const payload: PreventivoPayload = {
          id_maquina: values.id_maquina,
          descripcion: values.descripcion.trim(),
          ...(values.frecuencia_horas !== undefined
            ? { frecuencia_horas: values.frecuencia_horas }
            : {}),
          ...(values.frecuencia_dias !== undefined
            ? { frecuencia_dias: values.frecuencia_dias }
            : {}),
          ...(values.dias_aviso !== undefined
            ? { dias_aviso: values.dias_aviso }
            : {}),
          ...(values.horas_aviso !== undefined
            ? { horas_aviso: values.horas_aviso }
            : {}),
          ...(values.horas_ultimo_mant !== undefined
            ? { horas_ultimo_mant: values.horas_ultimo_mant }
            : {}),
          ...(values.fecha_ultimo_mant
            ? { fecha_ultimo_mant: values.fecha_ultimo_mant }
            : {}),
        };
        await crear.mutateAsync(payload);
        toast({
          title: "Mantenimiento programado",
          description: values.descripcion.trim(),
          variant: "success",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar la programación",
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
      title={editando ? "Editar preventivo" : "Nuevo preventivo"}
      description={
        editando
          ? "Ajustá las frecuencias y los avisos del mantenimiento."
          : "Programá el mantenimiento por horas de uso, por días o ambos."
      }
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="preventivo-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Programar"}
          </Button>
        </>
      }
    >
      <form
        id="preventivo-form"
        onSubmit={onSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FormField
          label="Máquina"
          htmlFor="id_maquina"
          error={errors.id_maquina?.message}
          required
          className="sm:col-span-2"
        >
          <Select id="id_maquina" disabled={editando} {...register("id_maquina")}>
            <option value="">Seleccioná una máquina</option>
            {(maquinas.data ?? []).map((maquina) => (
              <option key={maquina.id_maquina} value={maquina.id_maquina}>
                {maquina.nombre}
                {maquina.codigo ? ` (${maquina.codigo})` : ""}
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
            rows={2}
            placeholder="Cambio de aceite y filtros, revisión general..."
            {...register("descripcion")}
          />
        </FormField>

        <FormField
          label="Frecuencia en horas"
          htmlFor="frecuencia_horas"
          error={errors.frecuencia_horas?.message}
          hint="Opcional. Ej.: cada 250 horas de uso."
        >
          <Input
            id="frecuencia_horas"
            type="number"
            min={1}
            step="1"
            placeholder="250"
            {...register("frecuencia_horas")}
          />
        </FormField>

        <FormField
          label="Frecuencia en días"
          htmlFor="frecuencia_dias"
          error={errors.frecuencia_dias?.message}
          hint="Opcional. Ej.: cada 90 días."
        >
          <Input
            id="frecuencia_dias"
            type="number"
            min={1}
            step="1"
            placeholder="90"
            {...register("frecuencia_dias")}
          />
        </FormField>

        <FormField
          label="Aviso por días"
          htmlFor="dias_aviso"
          error={errors.dias_aviso?.message}
          hint="Días de anticipación para marcar Próximo."
        >
          <Input
            id="dias_aviso"
            type="number"
            min={0}
            max={365}
            step="1"
            {...register("dias_aviso")}
          />
        </FormField>

        <FormField
          label="Aviso por horas"
          htmlFor="horas_aviso"
          error={errors.horas_aviso?.message}
          hint="Horas de uso antes de marcar Próximo."
        >
          <Input
            id="horas_aviso"
            type="number"
            min={0}
            step="0.1"
            {...register("horas_aviso")}
          />
        </FormField>

        {!editando && (
          <>
            <FormField
              label="Horas del último mantenimiento"
              htmlFor="horas_ultimo_mant"
              error={errors.horas_ultimo_mant?.message}
              hint="Si se deja vacío, se usan las horas actuales de la máquina."
            >
              <Input
                id="horas_ultimo_mant"
                type="number"
                min={0}
                step="0.1"
                placeholder="0"
                {...register("horas_ultimo_mant")}
              />
            </FormField>

            <FormField
              label="Fecha del último mantenimiento"
              htmlFor="fecha_ultimo_mant"
              error={errors.fecha_ultimo_mant?.message}
              hint="Si se deja vacío, se usa la fecha de hoy."
            >
              <Input
                id="fecha_ultimo_mant"
                type="date"
                max={hoyISO()}
                {...register("fecha_ultimo_mant")}
              />
            </FormField>
          </>
        )}

        {editando && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              {...register("activo")}
            />
            Programación activa
          </label>
        )}
      </form>
    </Modal>
  );
}

export function PreventivosPage() {
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState("");
  const [activo, setActivo] = useState("");
  const [idMaquina, setIdMaquina] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setPagina(1);
  }, [estado, activo, idMaquina]);

  const consulta = usePreventivos({
    estado: estado || undefined,
    activo: activo || undefined,
    id_maquina: idMaquina || undefined,
  });
  const maquinas = useMaquinasOpciones();

  const [formOpen, setFormOpen] = useState(false);
  const [preventivoEditando, setPreventivoEditando] =
    useState<Preventivo | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [preventivoADesactivar, setPreventivoADesactivar] =
    useState<Preventivo | null>(null);

  const detalle = usePreventivoDetalle(detalleId);
  const desactivar = useDesactivarPreventivo();

  const todos = consulta.data?.preventivos ?? [];
  const totalLocal = todos.length;
  const preventivos = todos.slice((pagina - 1) * LIMITE, pagina * LIMITE);

  const abrirCrear = () => {
    setPreventivoEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (preventivo: Preventivo) => {
    setPreventivoEditando(preventivo);
    setFormOpen(true);
  };

  const confirmarDesactivacion = async () => {
    if (!preventivoADesactivar) return;

    try {
      await desactivar.mutateAsync(preventivoADesactivar.id_programacion);
      toast({
        title: "Programación desactivada",
        description: preventivoADesactivar.descripcion,
        variant: "success",
      });
      setPreventivoADesactivar(null);
    } catch (error) {
      toast({
        title: "No se pudo desactivar la programación",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  };

  const opcionesMaquinas = (maquinas.data ?? []).map((maquina) => ({
    value: maquina.id_maquina,
    label: maquina.nombre,
  }));

  const columnas: Column<Preventivo>[] = [
    {
      key: "maquina",
      header: "Máquina",
      cell: (preventivo) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-slate-900">
            {preventivo.maquina.nombre}
          </p>
          <p className="text-xs text-slate-400">
            {preventivo.maquina.codigo ?? "Sin código"}
          </p>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Mantenimiento",
      cell: (preventivo) => (
        <p className="max-w-[240px] truncate text-slate-700">
          {preventivo.descripcion}
        </p>
      ),
    },
    {
      key: "frecuencia",
      header: "Frecuencia",
      cell: (preventivo) => (
        <div className="text-xs text-slate-500">
          {preventivo.frecuencia_horas !== null && (
            <p>Cada {formatCantidad(preventivo.frecuencia_horas)} h</p>
          )}
          {preventivo.frecuencia_dias !== null && (
            <p>Cada {formatCantidad(preventivo.frecuencia_dias)} días</p>
          )}
        </div>
      ),
    },
    {
      key: "proximo",
      header: "Próximo",
      cell: (preventivo) => (
        <div className="text-xs text-slate-500">
          <p>{preventivo.proximo_mant ? formatFecha(preventivo.proximo_mant) : "—"}</p>
          <p>
            {preventivo.estado_mantenimiento.horas_restantes !== null
              ? `${formatCantidad(preventivo.estado_mantenimiento.horas_restantes)} h restantes`
              : ""}
          </p>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (preventivo) => (
        <Badge
          variant={
            TONO_ESTADO_PREVENTIVO[
              preventivo.estado_mantenimiento.estado
            ]
          }
        >
          {
            ETIQUETA_ESTADO_PREVENTIVO[
              preventivo.estado_mantenimiento.estado
            ]
          }
        </Badge>
      ),
    },
    {
      key: "activo",
      header: "Activo",
      cell: (preventivo) => (
        <Badge variant={preventivo.activo ? "success" : "neutral"}>
          {preventivo.activo ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (preventivo) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDetalleId(preventivo.id_programacion)}
            aria-label="Ver programación"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => abrirEditar(preventivo)}
            aria-label="Editar programación"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {preventivo.activo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreventivoADesactivar(preventivo)}
              aria-label="Desactivar programación"
            >
              <Power className="h-4 w-4 text-rose-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Preventivos"
        description="Programaciones de mantenimiento por uso y por calendario."
      >
        <Button type="button" onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nuevo preventivo
        </Button>
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SelectFilter
            value={estado}
            onChange={setEstado}
            placeholder="Todos los estados"
            options={ESTADOS}
          />
          <SelectFilter
            value={activo}
            onChange={setActivo}
            placeholder="Activas e inactivas"
            options={[
              { value: "true", label: "Activas" },
              { value: "false", label: "Inactivas" },
            ]}
          />
          <SelectFilter
            value={idMaquina}
            onChange={setIdMaquina}
            placeholder="Todas las máquinas"
            options={opcionesMaquinas}
            className="sm:min-w-[220px]"
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={preventivos}
          getRowKey={(preventivo) => preventivo.id_programacion}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(
                  consulta.error,
                  "No se pudieron cargar las programaciones",
                )
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(preventivo) =>
            setDetalleId(preventivo.id_programacion)
          }
          emptyTitle="Todavía no hay preventivos"
          emptyDescription="Programá el primer mantenimiento para anticipar las alertas."
          minWidth="1080px"
          footer={
            <TablePagination
              pagina={pagina}
              limite={LIMITE}
              total={totalLocal}
              onPageChange={setPagina}
              cargando={consulta.isFetching}
            />
          }
        />
      </GlassCard>

      <PreventivoFormDialog
        open={formOpen}
        preventivo={preventivoEditando}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={Boolean(detalleId)}
        onClose={() => setDetalleId(null)}
        title={detalle.data?.descripcion ?? "Detalle del preventivo"}
        description="Frecuencias, últimas fechas y próxima alerta."
        size="lg"
        footer={
          detalle.data ? (
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
          ) : null
        }
      >
        {detalle.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, indice) => (
              <div key={indice} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </div>
            ))}
          </div>
        ) : detalle.error ? (
          <p className="text-sm text-rose-600">{mensajeDeError(detalle.error)}</p>
        ) : detalle.data ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  TONO_ESTADO_PREVENTIVO[
                    detalle.data.estado_mantenimiento.estado
                  ]
                }
              >
                {
                  ETIQUETA_ESTADO_PREVENTIVO[
                    detalle.data.estado_mantenimiento.estado
                  ]
                }
              </Badge>
              <Badge variant={detalle.data.activo ? "success" : "neutral"}>
                {detalle.data.activo ? "Activa" : "Inactiva"}
              </Badge>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Máquina">
                {detalle.data.maquina.nombre}
                {detalle.data.maquina.codigo
                  ? ` (${detalle.data.maquina.codigo})`
                  : ""}
              </DetailField>
              <DetailField label="Horas de uso actuales">
                {formatCantidad(detalle.data.maquina.horas_uso)}
              </DetailField>
              <DetailField label="Frecuencia en horas">
                {detalle.data.frecuencia_horas !== null
                  ? `${formatCantidad(detalle.data.frecuencia_horas)} h`
                  : "—"}
              </DetailField>
              <DetailField label="Frecuencia en días">
                {detalle.data.frecuencia_dias !== null
                  ? `${formatCantidad(detalle.data.frecuencia_dias)} días`
                  : "—"}
              </DetailField>
              <DetailField label="Aviso por días">
                {formatCantidad(detalle.data.dias_aviso)} días
              </DetailField>
              <DetailField label="Aviso por horas">
                {formatCantidad(detalle.data.horas_aviso)} h
              </DetailField>
              <DetailField label="Último mantenimiento">
                <div className="text-sm">
                  <p>
                    {detalle.data.fecha_ultimo_mant
                      ? formatFecha(detalle.data.fecha_ultimo_mant)
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {detalle.data.horas_ultimo_mant !== null
                      ? `${formatCantidad(detalle.data.horas_ultimo_mant)} h`
                      : "Sin horas base"}
                  </p>
                </div>
              </DetailField>
              <DetailField label="Próximo mantenimiento">
                {detalle.data.proximo_mant
                  ? formatFecha(detalle.data.proximo_mant)
                  : "—"}
              </DetailField>
              <DetailField label="Días restantes">
                {detalle.data.estado_mantenimiento.dias_restantes !== null
                  ? formatCantidad(
                      detalle.data.estado_mantenimiento.dias_restantes,
                    )
                  : "—"}
              </DetailField>
              <DetailField label="Horas restantes">
                {detalle.data.estado_mantenimiento.horas_restantes !== null
                  ? `${formatCantidad(
                      detalle.data.estado_mantenimiento.horas_restantes,
                    )} h`
                  : "—"}
              </DetailField>
              <DetailField label="Creada">
                {formatFechaHora(detalle.data.creado_en)}
              </DetailField>
              <DetailField label="Actualizada">
                {formatFechaHora(detalle.data.actualizado_en)}
              </DetailField>
            </dl>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(preventivoADesactivar)}
        onClose={() => setPreventivoADesactivar(null)}
        onConfirm={() => void confirmarDesactivacion()}
        title="Desactivar programación"
        description={`La programación "${preventivoADesactivar?.descripcion ?? ""}" dejará de generar alertas. Podés reactivarla editándola.`}
        confirmLabel="Desactivar"
        loading={desactivar.isPending}
      />
    </div>
  );
}
