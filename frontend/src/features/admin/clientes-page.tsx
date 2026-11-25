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
import { Textarea } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { mensajeDeError } from "@/lib/http";
import { formatFecha } from "@/lib/format";
import {
  useActualizarCliente,
  useClienteDetalle,
  useClientes,
  useCrearCliente,
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
import type { Cliente, ClientePayload } from "@/types/admin";

const LIMITE = 20;

const clienteSchema = z.object({
  razon_social: z
    .string()
    .trim()
    .min(1, "La razón social es obligatoria")
    .max(150, "Máximo 150 caracteres"),
  ruc_dni: z.string().trim().max(15, "Máximo 15 caracteres").optional(),
  contacto: z.string().trim().max(100, "Máximo 100 caracteres").optional(),
  telefono: z.string().trim().max(20, "Máximo 20 caracteres").optional(),
  email: z
    .union([z.literal(""), z.email("Ingresá un correo válido")])
    .optional(),
  direccion: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  activo: z.boolean().optional(),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

const VACIOS: ClienteFormValues = {
  razon_social: "",
  ruc_dni: "",
  contacto: "",
  telefono: "",
  email: "",
  direccion: "",
  activo: true,
};

function textoONull(valor?: string): string | null {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

function ClienteFormDialog({
  open,
  cliente,
  onClose,
}: {
  open: boolean;
  cliente: Cliente | null;
  onClose: () => void;
}) {
  const crear = useCrearCliente();
  const actualizar = useActualizarCliente();
  const { toast } = useToast();
  const editando = Boolean(cliente);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: VACIOS,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      cliente
        ? {
            razon_social: cliente.razon_social,
            ruc_dni: cliente.ruc_dni ?? "",
            contacto: cliente.contacto ?? "",
            telefono: cliente.telefono ?? "",
            email: cliente.email ?? "",
            direccion: cliente.direccion ?? "",
            activo: cliente.activo,
          }
        : VACIOS,
    );
  }, [open, cliente, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: ClientePayload = {
      razon_social: values.razon_social.trim(),
      ruc_dni: textoONull(values.ruc_dni),
      contacto: textoONull(values.contacto),
      telefono: textoONull(values.telefono),
      email: textoONull(values.email),
      direccion: textoONull(values.direccion),
      ...(editando ? { activo: values.activo } : {}),
    };

    try {
      if (cliente) {
        await actualizar.mutateAsync({ id: cliente.id_cliente, payload });
        toast({
          title: "Cliente actualizado",
          description: payload.razon_social,
          variant: "success",
        });
      } else {
        await crear.mutateAsync(payload);
        toast({
          title: "Cliente creado",
          description: payload.razon_social,
          variant: "success",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar el cliente",
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
      title={editando ? "Editar cliente" : "Nuevo cliente"}
      description={
        editando
          ? "Actualizá los datos comerciales del cliente."
          : "Registrá una empresa o persona para asociarle máquinas y solicitudes."
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
          <Button type="submit" form="cliente-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </>
      }
    >
      <form id="cliente-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Razón social"
          htmlFor="razon_social"
          error={errors.razon_social?.message}
          required
          className="sm:col-span-2"
        >
          <Input
            id="razon_social"
            placeholder="Industrias del Pacífico S.A.C."
            {...register("razon_social")}
          />
        </FormField>

        <FormField
          label="RUC / DNI"
          htmlFor="ruc_dni"
          error={errors.ruc_dni?.message}
        >
          <Input id="ruc_dni" placeholder="20512345678" {...register("ruc_dni")} />
        </FormField>

        <FormField
          label="Contacto"
          htmlFor="contacto"
          error={errors.contacto?.message}
        >
          <Input id="contacto" placeholder="Nombre del contacto" {...register("contacto")} />
        </FormField>

        <FormField
          label="Teléfono"
          htmlFor="telefono"
          error={errors.telefono?.message}
        >
          <Input id="telefono" placeholder="+51 999 999 999" {...register("telefono")} />
        </FormField>

        <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="contacto@empresa.com"
            {...register("email")}
          />
        </FormField>

        <FormField
          label="Dirección"
          htmlFor="direccion"
          error={errors.direccion?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="direccion"
            rows={2}
            placeholder="Av. Industrial 123, Lima"
            {...register("direccion")}
          />
        </FormField>

        {editando && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              {...register("activo")}
            />
            Cliente activo
          </label>
        )}
      </form>
    </Modal>
  );
}

export function ClientesPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState("");
  const qDebounced = useDebouncedValue(q);
  const { toast } = useToast();

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, activo]);

  const consulta = useClientes({
    q: qDebounced || undefined,
    activo: activo || undefined,
    pagina,
    limite: LIMITE,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [clienteAConfirmar, setClienteAConfirmar] = useState<Cliente | null>(null);

  const detalle = useClienteDetalle(detalleId);
  const actualizar = useActualizarCliente();
  const clientes = consulta.data?.clientes ?? [];
  const total = consulta.data?.total ?? 0;

  const abrirCrear = () => {
    setClienteEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setFormOpen(true);
  };

  const alternarActivo = async () => {
    if (!clienteAConfirmar) return;

    try {
      await actualizar.mutateAsync({
        id: clienteAConfirmar.id_cliente,
        payload: { activo: !clienteAConfirmar.activo },
      });
      toast({
        title: clienteAConfirmar.activo
          ? "Cliente desactivado"
          : "Cliente reactivado",
        description: clienteAConfirmar.razon_social,
        variant: "success",
      });
      setClienteAConfirmar(null);
    } catch (error) {
      toast({
        title: "No se pudo cambiar el estado",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  };

  const columnas: Column<Cliente>[] = [
    {
      key: "razon_social",
      header: "Cliente",
      cell: (cliente) => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-slate-900">{cliente.razon_social}</p>
          <p className="text-xs text-slate-400">{cliente.email ?? "Sin correo"}</p>
        </div>
      ),
    },
    {
      key: "ruc_dni",
      header: "RUC / DNI",
      cell: (cliente) => cliente.ruc_dni ?? "—",
    },
    {
      key: "contacto",
      header: "Contacto",
      cell: (cliente) => (
        <div>
          <p>{cliente.contacto ?? "—"}</p>
          <p className="text-xs text-slate-400">{cliente.telefono ?? ""}</p>
        </div>
      ),
    },
    {
      key: "activo",
      header: "Estado",
      cell: (cliente) => (
        <Badge variant={cliente.activo ? "success" : "neutral"}>
          {cliente.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "creado_en",
      header: "Alta",
      cell: (cliente) => formatFecha(cliente.creado_en),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (cliente) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDetalleId(cliente.id_cliente)}
            aria-label={`Ver ${cliente.razon_social}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => abrirEditar(cliente)}
            aria-label={`Editar ${cliente.razon_social}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setClienteAConfirmar(cliente)}
            aria-label={
              cliente.activo ? "Desactivar cliente" : "Reactivar cliente"
            }
          >
            <Power className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description="Empresas y personas atendidas por DYD."
      >
        <Button type="button" onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por razón social, RUC o contacto"
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
          rows={clientes}
          getRowKey={(cliente) => cliente.id_cliente}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(consulta.error, "No se pudieron cargar los clientes")
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(cliente) => setDetalleId(cliente.id_cliente)}
          emptyTitle="Todavía no hay clientes"
          emptyDescription="Creá el primer cliente para empezar a registrar máquinas y solicitudes."
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

      <ClienteFormDialog
        open={formOpen}
        cliente={clienteEditando}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={Boolean(detalleId)}
        onClose={() => setDetalleId(null)}
        title={detalle.data?.razon_social ?? "Detalle del cliente"}
        description="Datos comerciales y actividad registrada."
        size="lg"
        footer={
          detalle.data ? (
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
            {Array.from({ length: 8 }).map((_, indice) => (
              <div key={indice} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full max-w-[220px]" />
              </div>
            ))}
          </div>
        ) : detalle.error ? (
          <p className="text-sm text-rose-600">
            {mensajeDeError(detalle.error)}
          </p>
        ) : detalle.data ? (
          <div className="space-y-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Razón social">
                {detalle.data.razon_social}
              </DetailField>
              <DetailField label="RUC / DNI">
                {detalle.data.ruc_dni ?? "—"}
              </DetailField>
              <DetailField label="Contacto">
                {detalle.data.contacto ?? "—"}
              </DetailField>
              <DetailField label="Teléfono">
                {detalle.data.telefono ?? "—"}
              </DetailField>
              <DetailField label="Correo">
                {detalle.data.email ?? "—"}
              </DetailField>
              <DetailField label="Dirección">
                {detalle.data.direccion ?? "—"}
              </DetailField>
              <DetailField label="Estado">
                <Badge variant={detalle.data.activo ? "success" : "neutral"}>
                  {detalle.data.activo ? "Activo" : "Inactivo"}
                </Badge>
              </DetailField>
              <DetailField label="Alta">
                {formatFecha(detalle.data.creado_en)}
              </DetailField>
            </dl>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-500">
                  Máquinas
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {detalle.data._count?.maquinas ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-500">
                  Solicitudes
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {detalle.data._count?.solicitudes ?? 0}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(clienteAConfirmar)}
        onClose={() => setClienteAConfirmar(null)}
        onConfirm={() => void alternarActivo()}
        title={
          clienteAConfirmar?.activo ? "Desactivar cliente" : "Reactivar cliente"
        }
        description={
          clienteAConfirmar?.activo
            ? `El cliente "${clienteAConfirmar?.razon_social}" quedará inactivo. Sus máquinas y solicitudes históricas se conservan, pero no podrá asignarle nuevas máquinas.`
            : `El cliente "${clienteAConfirmar?.razon_social}" volverá a estar activo y podrá recibir nuevas máquinas y solicitudes.`
        }
        confirmLabel={
          clienteAConfirmar?.activo ? "Desactivar" : "Reactivar"
        }
        danger={clienteAConfirmar?.activo}
        loading={actualizar.isPending}
      />
    </div>
  );
}
