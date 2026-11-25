import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, Loader2, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { mensajeDeError } from "@/lib/http";
import { formatCantidad, formatFecha } from "@/lib/format";
import {
  ETIQUETA_ESTADO_MAQUINA,
  TONO_ESTADO_MAQUINA,
} from "@/lib/admin-labels";
import {
  useActualizarMaquina,
  useClientesOpciones,
  useCrearMaquina,
  useMaquinaDetalle,
  useMaquinas,
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
  Cliente,
  EstadoMaquina,
  Maquina,
  MaquinaPayload,
} from "@/types/admin";

const LIMITE = 20;

const ESTADOS: Array<{ value: EstadoMaquina; label: string }> = [
  { value: "OPERATIVA", label: "Operativa" },
  { value: "EN_MANTENIMIENTO", label: "En mantenimiento" },
  { value: "FUERA_DE_SERVICIO", label: "Fuera de servicio" },
];

const maquinaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio")
      .max(100, "Máximo 100 caracteres"),
    codigo: z.string().trim().max(30, "Máximo 30 caracteres").optional(),
    tipo: z.string().trim().max(50, "Máximo 50 caracteres").optional(),
    marca: z.string().trim().max(50, "Máximo 50 caracteres").optional(),
    modelo: z.string().trim().max(50, "Máximo 50 caracteres").optional(),
    nro_serie: z.string().trim().max(50, "Máximo 50 caracteres").optional(),
    es_propia: z.boolean(),
    id_cliente: z.string().optional(),
    horas_uso: z
      .number("Ingresá un número")
      .min(0, "No puede ser negativo")
      .max(999999999, "Valor demasiado alto"),
    estado: z.enum([
      "OPERATIVA",
      "EN_MANTENIMIENTO",
      "FUERA_DE_SERVICIO",
    ]),
  })
  .superRefine((datos, ctx) => {
    if (!datos.es_propia && !datos.id_cliente) {
      ctx.addIssue({
        code: "custom",
        message: "Indicá el cliente dueño o marcá la máquina como propia",
        path: ["id_cliente"],
      });
    }
  });

type MaquinaFormValues = z.infer<typeof maquinaSchema>;

const VACIOS: MaquinaFormValues = {
  nombre: "",
  codigo: "",
  tipo: "",
  marca: "",
  modelo: "",
  nro_serie: "",
  es_propia: false,
  id_cliente: "",
  horas_uso: 0,
  estado: "OPERATIVA",
};

function textoONull(valor?: string): string | null {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

function MaquinaFormDialog({
  open,
  maquina,
  clientes,
  onClose,
}: {
  open: boolean;
  maquina: Maquina | null;
  clientes: Cliente[];
  onClose: () => void;
}) {
  const crear = useCrearMaquina();
  const actualizar = useActualizarMaquina();
  const { toast } = useToast();
  const editando = Boolean(maquina);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaquinaFormValues>({
    resolver: zodResolver(maquinaSchema),
    defaultValues: VACIOS,
  });

  const esPropia = watch("es_propia");

  useEffect(() => {
    if (!open) return;

    reset(
      maquina
        ? {
            nombre: maquina.nombre,
            codigo: maquina.codigo ?? "",
            tipo: maquina.tipo ?? "",
            marca: maquina.marca ?? "",
            modelo: maquina.modelo ?? "",
            nro_serie: maquina.nro_serie ?? "",
            es_propia: maquina.es_propia,
            id_cliente: maquina.id_cliente ?? "",
            horas_uso: Number(maquina.horas_uso),
            estado: maquina.estado,
          }
        : VACIOS,
    );
  }, [open, maquina, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: MaquinaPayload = {
      nombre: values.nombre.trim(),
      codigo: textoONull(values.codigo),
      tipo: textoONull(values.tipo),
      marca: textoONull(values.marca),
      modelo: textoONull(values.modelo),
      nro_serie: textoONull(values.nro_serie),
      es_propia: values.es_propia,
      id_cliente: values.es_propia ? null : values.id_cliente || null,
      horas_uso: values.horas_uso,
      estado: values.estado,
    };

    try {
      if (maquina) {
        await actualizar.mutateAsync({ id: maquina.id_maquina, payload });
        toast({
          title: "Máquina actualizada",
          description: payload.nombre,
          variant: "success",
        });
      } else {
        await crear.mutateAsync(payload);
        toast({
          title: "Máquina registrada",
          description: payload.nombre,
          variant: "success",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar la máquina",
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
      title={editando ? "Editar máquina" : "Nueva máquina"}
      description="Datos técnicos y propietario del equipo."
      size="lg"
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
          <Button type="submit" form="maquina-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Registrar máquina"}
          </Button>
        </>
      }
    >
      <form id="maquina-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nombre"
          htmlFor="nombre"
          error={errors.nombre?.message}
          required
          className="sm:col-span-2"
        >
          <Input
            id="nombre"
            placeholder="Compresor de tornillo"
            {...register("nombre")}
          />
        </FormField>

        <FormField label="Código interno" htmlFor="codigo" error={errors.codigo?.message}>
          <Input id="codigo" placeholder="MAQ-001" {...register("codigo")} />
        </FormField>

        <FormField label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <Input id="tipo" placeholder="Compresor" {...register("tipo")} />
        </FormField>

        <FormField label="Marca" htmlFor="marca" error={errors.marca?.message}>
          <Input id="marca" placeholder="Atlas Copco" {...register("marca")} />
        </FormField>

        <FormField label="Modelo" htmlFor="modelo" error={errors.modelo?.message}>
          <Input id="modelo" placeholder="GA-30" {...register("modelo")} />
        </FormField>

        <FormField
          label="Nro. de serie"
          htmlFor="nro_serie"
          error={errors.nro_serie?.message}
        >
          <Input id="nro_serie" placeholder="SN-123456" {...register("nro_serie")} />
        </FormField>

        <FormField
          label="Horas de uso"
          htmlFor="horas_uso"
          error={errors.horas_uso?.message}
        >
          <Input
            id="horas_uso"
            type="number"
            min={0}
            step="0.1"
            {...register("horas_uso", { valueAsNumber: true })}
          />
        </FormField>

        <FormField label="Estado" htmlFor="estado" error={errors.estado?.message}>
          <Select id="estado" {...register("estado")}>
            {ESTADOS.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              {...register("es_propia")}
            />
            Es una máquina propia de DYD
          </label>
        </div>

        <FormField
          label="Cliente propietario"
          htmlFor="id_cliente"
          error={errors.id_cliente?.message}
          hint={
            esPropia
              ? "Las máquinas propias no se asignan a un cliente."
              : "Solo se listan clientes activos."
          }
          className="sm:col-span-2"
        >
          <Select
            id="id_cliente"
            disabled={esPropia}
            {...register("id_cliente")}
          >
            <option value="">
              {esPropia ? "No aplica (máquina propia)" : "Seleccioná un cliente"}
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id_cliente} value={cliente.id_cliente}>
                {cliente.razon_social}
              </option>
            ))}
          </Select>
        </FormField>
      </form>
    </Modal>
  );
}

export function MaquinasPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [propiedad, setPropiedad] = useState("");
  const qDebounced = useDebouncedValue(q);

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, estado, propiedad]);

  const consulta = useMaquinas({
    q: qDebounced || undefined,
    estado: estado || undefined,
    es_propia: propiedad || undefined,
    pagina,
    limite: LIMITE,
  });
  const clientes = useClientesOpciones();

  const [formOpen, setFormOpen] = useState(false);
  const [maquinaEditando, setMaquinaEditando] = useState<Maquina | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const detalle = useMaquinaDetalle(detalleId);
  const maquinas = consulta.data?.maquinas ?? [];
  const total = consulta.data?.total ?? 0;

  const abrirCrear = () => {
    setMaquinaEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (maquina: Maquina) => {
    setMaquinaEditando(maquina);
    setFormOpen(true);
  };

  const columnas: Column<Maquina>[] = [
    {
      key: "maquina",
      header: "Máquina",
      cell: (maquina) => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-slate-900">{maquina.nombre}</p>
          <p className="text-xs text-slate-400">
            {maquina.codigo ?? "Sin código"} · {maquina.tipo ?? "Sin tipo"}
          </p>
        </div>
      ),
    },
    {
      key: "propietario",
      header: "Propietario",
      cell: (maquina) =>
        maquina.es_propia ? (
          <Badge variant="info">DYD</Badge>
        ) : (
          maquina.cliente?.razon_social ?? "—"
        ),
    },
    {
      key: "marca",
      header: "Marca / modelo",
      cell: (maquina) =>
        [maquina.marca, maquina.modelo].filter(Boolean).join(" · ") || "—",
    },
    {
      key: "horas",
      header: "Horas de uso",
      cell: (maquina) => (
        <span className="tabular-nums">{formatCantidad(maquina.horas_uso)}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (maquina) => (
        <Badge variant={TONO_ESTADO_MAQUINA[maquina.estado]}>
          {ETIQUETA_ESTADO_MAQUINA[maquina.estado]}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (maquina) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDetalleId(maquina.id_maquina)}
            aria-label={`Ver ${maquina.nombre}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => abrirEditar(maquina)}
            aria-label={`Editar ${maquina.nombre}`}
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
        title="Máquinas"
        description="Equipos de clientes y máquinas propias de DYD."
      >
        <Button type="button" onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nueva máquina
        </Button>
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por nombre, código, marca o serie"
          />
          <SelectFilter
            value={estado}
            onChange={setEstado}
            placeholder="Todos los estados"
            options={ESTADOS}
          />
          <SelectFilter
            value={propiedad}
            onChange={setPropiedad}
            placeholder="Toda propiedad"
            options={[
              { value: "true", label: "Propias de DYD" },
              { value: "false", label: "De clientes" },
            ]}
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={maquinas}
          getRowKey={(maquina) => maquina.id_maquina}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(consulta.error, "No se pudieron cargar las máquinas")
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(maquina) => setDetalleId(maquina.id_maquina)}
          emptyTitle="Todavía no hay máquinas"
          emptyDescription="Registrá la primera máquina de un cliente o una máquina propia."
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

      <MaquinaFormDialog
        open={formOpen}
        maquina={maquinaEditando}
        clientes={clientes.data ?? []}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={Boolean(detalleId)}
        onClose={() => setDetalleId(null)}
        title={detalle.data?.nombre ?? "Detalle de la máquina"}
        description="Ficha técnica y actividad registrada."
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
              <DetailField label="Código">
                {detalle.data.codigo ?? "—"}
              </DetailField>
              <DetailField label="Tipo">{detalle.data.tipo ?? "—"}</DetailField>
              <DetailField label="Marca">{detalle.data.marca ?? "—"}</DetailField>
              <DetailField label="Modelo">{detalle.data.modelo ?? "—"}</DetailField>
              <DetailField label="Nro. de serie">
                {detalle.data.nro_serie ?? "—"}
              </DetailField>
              <DetailField label="Horas de uso">
                {formatCantidad(detalle.data.horas_uso)}
              </DetailField>
              <DetailField label="Propietario">
                {detalle.data.es_propia
                  ? "DYD (máquina propia)"
                  : detalle.data.cliente?.razon_social ?? "—"}
              </DetailField>
              <DetailField label="Estado">
                <Badge variant={TONO_ESTADO_MAQUINA[detalle.data.estado]}>
                  {ETIQUETA_ESTADO_MAQUINA[detalle.data.estado]}
                </Badge>
              </DetailField>
              <DetailField label="Alta">
                {formatFecha(detalle.data.creado_en)}
              </DetailField>
              <DetailField label="Última actualización">
                {formatFecha(detalle.data.actualizado_en)}
              </DetailField>
            </dl>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-500">
                  Solicitudes
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {detalle.data._count?.solicitudes ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-500">
                  Preventivos
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {detalle.data._count?.programaciones ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-sky-500">
                  Registros de uso
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {detalle.data._count?.registros_uso ?? 0}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
