import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { mensajeDeError } from "@/lib/http";
import {
  formatCantidad,
  formatFechaHora,
  formatSolesDecimal,
} from "@/lib/format";
import {
  useActualizarMaterial,
  useCrearMaterial,
  useMaterialDetalle,
  useMateriales,
  useMovimientosMaterial,
  useRegistrarMovimiento,
} from "@/features/admin/hooks/use-admin-queries";
import { useDebouncedValue } from "@/features/admin/hooks/use-debounced-value";
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
  Material,
  MaterialPayload,
  MovimientoPayload,
} from "@/types/admin";

const LIMITE = 20;
const LIMITE_MOVIMIENTOS = 6;

const materialSchema = z.object({
  codigo: z.string().trim().max(30, "Máximo 30 caracteres").optional(),
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  unidad: z
    .string()
    .trim()
    .min(1, "La unidad es obligatoria")
    .max(20, "Máximo 20 caracteres"),
  stock_minimo: z
    .number("Ingresá un número")
    .min(0, "No puede ser negativo")
    .max(99999999.99),
  precio_unitario: z
    .number("Ingresá un número")
    .min(0, "No puede ser negativo")
    .max(99999999.99)
    .optional(),
  activo: z.boolean().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

const VACIOS: MaterialFormValues = {
  nombre: "",
  unidad: "unidad",
  stock_minimo: 0,
  precio_unitario: undefined,
  activo: true,
};

const movimientoSchema = z.object({
  tipo: z.enum(["ENTRADA", "SALIDA"]),
  cantidad: z
    .number("Ingresá una cantidad")
    .positive("Debe ser mayor a cero")
    .max(99999999.99),
  motivo: z.string().trim().max(150, "Máximo 150 caracteres").optional(),
});

type MovimientoFormValues = z.infer<typeof movimientoSchema>;

function textoONull(valor?: string): string | null {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

function estadoStock(material: Material) {
  const actual = Number(material.stock_actual);
  const minimo = Number(material.stock_minimo);

  if (actual <= 0) return { label: "Agotado", variant: "danger" as const };
  if (minimo > 0 && actual <= minimo) {
    return { label: "Bajo mínimo", variant: "warning" as const };
  }
  return { label: "En stock", variant: "success" as const };
}

function MaterialFormDialog({
  open,
  material,
  onClose,
}: {
  open: boolean;
  material: Material | null;
  onClose: () => void;
}) {
  const crear = useCrearMaterial();
  const actualizar = useActualizarMaterial();
  const { toast } = useToast();
  const editando = Boolean(material);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: VACIOS,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      material
        ? {
            codigo: material.codigo ?? "",
            nombre: material.nombre,
            unidad: material.unidad,
            stock_minimo: Number(material.stock_minimo),
            precio_unitario:
              material.precio_unitario !== null
                ? Number(material.precio_unitario)
                : undefined,
            activo: material.activo,
          }
        : VACIOS,
    );
  }, [open, material, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: MaterialPayload = {
      nombre: values.nombre.trim(),
      unidad: values.unidad.trim(),
      stock_minimo: values.stock_minimo,
      precio_unitario: values.precio_unitario ?? null,
      ...(editando ? { codigo: textoONull(values.codigo), activo: values.activo } : {}),
    };

    try {
      if (material) {
        await actualizar.mutateAsync({ id: material.id_material, payload });
        toast({
          title: "Material actualizado",
          description: payload.nombre,
          variant: "success",
        });
      } else {
        await crear.mutateAsync(payload);
        toast({
          title: "Material creado",
          description: `${payload.nombre}. El stock inicial es 0; registrá una entrada para cargarlo.`,
          variant: "success",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar el material",
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
      title={editando ? "Editar material" : "Nuevo material"}
      description="El stock solo cambia mediante entradas y salidas."
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
          <Button type="submit" form="material-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Crear material"}
          </Button>
        </>
      }
    >
      <form id="material-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {editando && (
          <FormField label="Código" htmlFor="codigo" error={errors.codigo?.message}>
            <Input id="codigo" placeholder="MAT-001" {...register("codigo")} />
          </FormField>
        )}

        <FormField
          label="Nombre"
          htmlFor="nombre"
          error={errors.nombre?.message}
          required
        >
          <Input
            id="nombre"
            placeholder="Filtro de aceite"
            {...register("nombre")}
          />
        </FormField>

        <FormField
          label="Unidad"
          htmlFor="unidad"
          error={errors.unidad?.message}
          required
        >
          <Input id="unidad" placeholder="unidad, litro, kg..." {...register("unidad")} />
        </FormField>

        <FormField
          label="Stock mínimo"
          htmlFor="stock_minimo"
          error={errors.stock_minimo?.message}
        >
          <Input
            id="stock_minimo"
            type="number"
            min={0}
            step="0.01"
            {...register("stock_minimo", { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label="Precio unitario (S/)"
          htmlFor="precio_unitario"
          error={errors.precio_unitario?.message}
          hint="Opcional. Se usa como precio sugerido en cotizaciones."
          className="sm:col-span-2"
        >
          <Input
            id="precio_unitario"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            {...register("precio_unitario", {
              setValueAs: (valor) =>
                valor === "" || valor === null || valor === undefined
                  ? undefined
                  : Number(valor),
            })}
          />
        </FormField>

        {editando && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              {...register("activo")}
            />
            Material activo
          </label>
        )}
      </form>
    </Modal>
  );
}

function MovimientoForm({
  materialId,
  onDone,
}: {
  materialId: string;
  onDone: () => void;
}) {
  const registrar = useRegistrarMovimiento();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: { tipo: "ENTRADA", cantidad: 1, motivo: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload: MovimientoPayload = {
      tipo: values.tipo,
      cantidad: values.cantidad,
      ...(values.motivo?.trim() ? { motivo: values.motivo.trim() } : {}),
    };

    try {
      const respuesta = await registrar.mutateAsync({
        id: materialId,
        payload,
      });
      toast({
        title: values.tipo === "ENTRADA" ? "Entrada registrada" : "Salida registrada",
        description: `Stock actual: ${formatCantidad(respuesta.stock_actual)}`,
        variant: "success",
      });
      reset({ tipo: values.tipo, cantidad: 1, motivo: "" });
      onDone();
    } catch (error) {
      toast({
        title: "No se pudo registrar el movimiento",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  });

  const guardando = isSubmitting || registrar.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <Select id="tipo" {...register("tipo")}>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
          </Select>
        </FormField>
        <FormField
          label="Cantidad"
          htmlFor="cantidad"
          error={errors.cantidad?.message}
        >
          <Input
            id="cantidad"
            type="number"
            min={0.01}
            step="0.01"
            {...register("cantidad", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <FormField label="Motivo" htmlFor="motivo" error={errors.motivo?.message}>
        <Input
          id="motivo"
          placeholder="Compra, consumo en orden, ajuste..."
          {...register("motivo")}
        />
      </FormField>

      <Button type="submit" size="sm" disabled={guardando} className="w-full">
        {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
        Registrar movimiento
      </Button>
    </form>
  );
}

export function MaterialesPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState("");
  const qDebounced = useDebouncedValue(q);

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, activo]);

  const consulta = useMateriales({
    q: qDebounced || undefined,
    activo: activo || undefined,
    pagina,
    limite: LIMITE,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [paginaMovimientos, setPaginaMovimientos] = useState(1);

  const detalle = useMaterialDetalle(detalleId);
  const movimientos = useMovimientosMaterial(
    detalleId,
    paginaMovimientos,
    LIMITE_MOVIMIENTOS,
  );
  const materiales = consulta.data?.materiales ?? [];
  const total = consulta.data?.total ?? 0;

  const abrirCrear = () => {
    setMaterialEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (material: Material) => {
    setMaterialEditando(material);
    setFormOpen(true);
  };

  const abrirDetalle = (id: string) => {
    setPaginaMovimientos(1);
    setDetalleId(id);
  };

  const columnas: Column<Material>[] = [
    {
      key: "material",
      header: "Material",
      cell: (material) => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-slate-900">{material.nombre}</p>
          <p className="text-xs text-slate-400">
            {material.codigo ?? "Sin código"} · {material.unidad}
          </p>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      cell: (material) => (
        <div className="tabular-nums">
          <p className="font-semibold text-slate-900">
            {formatCantidad(material.stock_actual)}
          </p>
          <p className="text-xs text-slate-400">
            mínimo {formatCantidad(material.stock_minimo)}
          </p>
        </div>
      ),
    },
    {
      key: "precio",
      header: "Precio",
      cell: (material) =>
        material.precio_unitario !== null
          ? formatSolesDecimal(material.precio_unitario)
          : "—",
    },
    {
      key: "estado",
      header: "Estado stock",
      cell: (material) => {
        const estado = estadoStock(material);
        return <Badge variant={estado.variant}>{estado.label}</Badge>;
      },
    },
    {
      key: "activo",
      header: "Activo",
      cell: (material) => (
        <Badge variant={material.activo ? "success" : "neutral"}>
          {material.activo ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (material) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => abrirDetalle(material.id_material)}
            aria-label={`Ver ${material.nombre}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => abrirEditar(material)}
            aria-label={`Editar ${material.nombre}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Materiales"
        description="Inventario, stock mínimo y movimientos."
      >
        <Button type="button" onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nuevo material
        </Button>
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por nombre o código"
          />
          <SelectFilter
            value={activo}
            onChange={setActivo}
            placeholder="Todos los estados"
            options={[
              { value: "true", label: "Activos" },
              { value: "false", label: "Inactivos" },
            ]}
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={materiales}
          getRowKey={(material) => material.id_material}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(consulta.error, "No se pudieron cargar los materiales")
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(material) => abrirDetalle(material.id_material)}
          emptyTitle="Todavía no hay materiales"
          emptyDescription="Registrá el primer material y luego cargá su stock con una entrada."
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

      <MaterialFormDialog
        open={formOpen}
        material={materialEditando}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={Boolean(detalleId)}
        onClose={() => setDetalleId(null)}
        title={detalle.data?.nombre ?? "Detalle del material"}
        description="Ficha del material y últimos movimientos."
        size="xl"
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
              Editar material
            </Button>
          ) : null
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
          <p className="text-sm text-rose-600">{mensajeDeError(detalle.error)}</p>
        ) : detalle.data ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-500">
                  Stock actual
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {formatCantidad(detalle.data.stock_actual)}
                  <span className="ml-1 text-base font-medium text-slate-500">
                    {detalle.data.unidad}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Mínimo requerido: {formatCantidad(detalle.data.stock_minimo)}{" "}
                  {detalle.data.unidad}
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Código">
                  {detalle.data.codigo ?? "—"}
                </DetailField>
                <DetailField label="Precio">
                  {detalle.data.precio_unitario !== null
                    ? formatSolesDecimal(detalle.data.precio_unitario)
                    : "—"}
                </DetailField>
                <DetailField label="Activo">
                  <Badge variant={detalle.data.activo ? "success" : "neutral"}>
                    {detalle.data.activo ? "Sí" : "No"}
                  </Badge>
                </DetailField>
                <DetailField label="Alta">
                  {formatFechaHora(detalle.data.creado_en)}
                </DetailField>
              </dl>

              {detalle.data.activo && (
                <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                  <p className="mb-3 text-sm font-bold text-slate-900">
                    Registrar movimiento
                  </p>
                  <MovimientoForm
                    materialId={detalle.data.id_material}
                    onDone={() => {
                      setPaginaMovimientos(1);
                      void movimientos.refetch();
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-900">
                Últimos movimientos
              </p>

              {movimientos.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, indice) => (
                    <Skeleton key={indice} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : movimientos.data?.movimientos.length ? (
                <div className="space-y-2">
                  {movimientos.data.movimientos.map((movimiento) => (
                    <div
                      key={movimiento.id_movimiento}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white/70 px-3 py-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={
                            movimiento.tipo === "ENTRADA"
                              ? "mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
                              : "mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600"
                          }
                        >
                          {movimiento.tipo === "ENTRADA" ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {movimiento.tipo === "ENTRADA" ? "+" : "−"}
                            {formatCantidad(movimiento.cantidad)}{" "}
                            {detalle.data.unidad}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {movimiento.motivo ?? "Sin motivo"} ·{" "}
                            {movimiento.usuario.nombres}{" "}
                            {movimiento.usuario.apellidos}
                          </p>
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-[10px] text-slate-400">
                        {formatFechaHora(movimiento.fecha)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  Sin movimientos registrados
                </p>
              )}

              {(movimientos.data?.total ?? 0) > LIMITE_MOVIMIENTOS && (
                <TablePagination
                  pagina={paginaMovimientos}
                  limite={LIMITE_MOVIMIENTOS}
                  total={movimientos.data?.total ?? 0}
                  onPageChange={setPaginaMovimientos}
                  cargando={movimientos.isFetching}
                />
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
