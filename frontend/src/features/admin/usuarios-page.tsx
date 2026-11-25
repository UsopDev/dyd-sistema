import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { mensajeDeError } from "@/lib/http";
import { formatFecha } from "@/lib/format";
import { ETIQUETA_ROL, TONO_ROL } from "@/lib/admin-labels";
import { useStaffAuth } from "@/features/auth/staff-auth";
import {
  useActualizarUsuario,
  useCrearUsuario,
  useUsuarios,
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
import { TablePagination } from "@/features/admin/components/table-pagination";
import type {
  CrearUsuarioPayload,
  RolUsuario,
  UsuarioAdmin,
} from "@/types/admin";

const LIMITE = 20;

const ROLES: Array<{ value: RolUsuario; label: string }> = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "TECNICO", label: "Técnico" },
];

function crearUsuarioSchema(editando: boolean) {
  return z
    .object({
      nombres: z
        .string()
        .trim()
        .min(1, "Los nombres son obligatorios")
        .max(80, "Máximo 80 caracteres"),
      apellidos: z
        .string()
        .trim()
        .min(1, "Los apellidos son obligatorios")
        .max(80, "Máximo 80 caracteres"),
      email: z.string().trim().optional(),
      password: z.string().optional(),
      rol: z.enum(["ADMINISTRADOR", "TECNICO"]),
      activo: z.boolean(),
    })
    .superRefine((datos, ctx) => {
      if (!editando) {
        if (!datos.email || !z.email().safeParse(datos.email).success) {
          ctx.addIssue({
            code: "custom",
            message: "Ingresá un correo válido",
            path: ["email"],
          });
        }
      }

      const password = datos.password?.trim();

      if (!editando && !password) {
        ctx.addIssue({
          code: "custom",
          message: "La contraseña es obligatoria",
          path: ["password"],
        });
      }

      if (password && password.length < 8) {
        ctx.addIssue({
          code: "custom",
          message: "Debe tener al menos 8 caracteres",
          path: ["password"],
        });
      }
    });
}

type UsuarioFormValues = z.infer<ReturnType<typeof crearUsuarioSchema>>;

const VACIOS: UsuarioFormValues = {
  nombres: "",
  apellidos: "",
  email: "",
  password: "",
  rol: "TECNICO",
  activo: true,
};

function UsuarioFormDialog({
  open,
  usuario,
  esMismoUsuario,
  onClose,
}: {
  open: boolean;
  usuario: UsuarioAdmin | null;
  esMismoUsuario: boolean;
  onClose: () => void;
}) {
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();
  const { toast } = useToast();
  const editando = Boolean(usuario);
  const schema = useMemo(() => crearUsuarioSchema(editando), [editando]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(schema),
    defaultValues: VACIOS,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      usuario
        ? {
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            email: usuario.email,
            password: "",
            rol: usuario.rol,
            activo: usuario.activo,
          }
        : VACIOS,
    );
  }, [open, usuario, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (usuario) {
        await actualizar.mutateAsync({
          id: usuario.id_usuario,
          payload: {
            nombres: values.nombres.trim(),
            apellidos: values.apellidos.trim(),
            rol: values.rol,
            activo: values.activo,
            ...(values.password?.trim()
              ? { password: values.password.trim() }
              : {}),
          },
        });
        toast({
          title: "Usuario actualizado",
          description: `${values.nombres} ${values.apellidos}`,
          variant: "success",
        });
      } else {
        const payload: CrearUsuarioPayload = {
          nombres: values.nombres.trim(),
          apellidos: values.apellidos.trim(),
          email: values.email!.trim().toLowerCase(),
          password: values.password!,
          rol: values.rol,
        };
        await crear.mutateAsync(payload);
        toast({
          title: "Usuario creado",
          description: payload.email,
          variant: "success",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar el usuario",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  });

  const guardando = isSubmitting || crear.isPending || actualizar.isPending;
  const bloquearCambiosPropios = editando && esMismoUsuario;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? "Editar usuario" : "Nuevo usuario"}
      description="Cuentas del personal administrativo y técnico."
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
          <Button type="submit" form="usuario-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </>
      }
    >
      <form id="usuario-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nombres"
          htmlFor="nombres"
          error={errors.nombres?.message}
          required
        >
          <Input id="nombres" {...register("nombres")} />
        </FormField>

        <FormField
          label="Apellidos"
          htmlFor="apellidos"
          error={errors.apellidos?.message}
          required
        >
          <Input id="apellidos" {...register("apellidos")} />
        </FormField>

        <FormField
          label="Correo"
          htmlFor="email"
          error={errors.email?.message}
          required={!editando}
          hint={editando ? "El correo no se puede modificar." : undefined}
          className="sm:col-span-2"
        >
          <Input
            id="email"
            type="email"
            disabled={editando}
            placeholder="usuario@dyd.com"
            {...register("email")}
          />
        </FormField>

        <FormField
          label={editando ? "Nueva contraseña" : "Contraseña"}
          htmlFor="password"
          error={errors.password?.message}
          hint={
            editando
              ? "Dejá vacío para conservar la contraseña actual. Al cambiarla se cierran sus sesiones."
              : "Mínimo 8 caracteres."
          }
          required={!editando}
          className="sm:col-span-2"
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={editando ? "••••••••" : "Mínimo 8 caracteres"}
            {...register("password")}
          />
        </FormField>

        <FormField
          label="Rol"
          htmlFor="rol"
          error={errors.rol?.message}
          hint={
            bloquearCambiosPropios
              ? "No podés cambiar tu propio rol."
              : undefined
          }
        >
          <Select id="rol" disabled={bloquearCambiosPropios} {...register("rol")}>
            {ROLES.map((rol) => (
              <option key={rol.value} value={rol.value}>
                {rol.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              disabled={bloquearCambiosPropios}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              {...register("activo")}
            />
            Usuario activo
          </label>
        </div>

        {bloquearCambiosPropios && (
          <p className="text-[11px] text-amber-600 sm:col-span-2">
            No podés desactivar tu propia cuenta ni cambiar tu rol.
          </p>
        )}
      </form>
    </Modal>
  );
}

export function UsuariosPage() {
  const { usuario: sesion } = useStaffAuth();
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [rol, setRol] = useState("");
  const [activo, setActivo] = useState("");
  const qDebounced = useDebouncedValue(q);

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, rol, activo]);

  const consulta = useUsuarios({
    q: qDebounced || undefined,
    rol: rol || undefined,
    activo: activo || undefined,
    pagina,
    limite: LIMITE,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioAdmin | null>(
    null,
  );

  const usuarios = consulta.data?.usuarios ?? [];
  const total = consulta.data?.total ?? 0;

  const abrirCrear = () => {
    setUsuarioEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (usuario: UsuarioAdmin) => {
    setUsuarioEditando(usuario);
    setFormOpen(true);
  };

  const columnas: Column<UsuarioAdmin>[] = [
    {
      key: "usuario",
      header: "Usuario",
      cell: (usuario) => (
        <div className="min-w-[200px]">
          <p className="font-semibold text-slate-900">
            {usuario.nombres} {usuario.apellidos}
          </p>
          <p className="text-xs text-slate-400">{usuario.email}</p>
        </div>
      ),
    },
    {
      key: "rol",
      header: "Rol",
      cell: (usuario) => (
        <Badge variant={TONO_ROL[usuario.rol]}>
          {ETIQUETA_ROL[usuario.rol]}
        </Badge>
      ),
    },
    {
      key: "activo",
      header: "Estado",
      cell: (usuario) => (
        <Badge variant={usuario.activo ? "success" : "neutral"}>
          {usuario.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "creado_en",
      header: "Alta",
      cell: (usuario) => formatFecha(usuario.creado_en),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (usuario) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => abrirEditar(usuario)}
            aria-label={`Editar ${usuario.nombres}`}
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
        title="Usuarios"
        description="Cuentas de administradores y técnicos."
      >
        <Button type="button" onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por nombre o correo"
          />
          <SelectFilter
            value={rol}
            onChange={setRol}
            placeholder="Todos los roles"
            options={ROLES}
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
          rows={usuarios}
          getRowKey={(usuario) => usuario.id_usuario}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(consulta.error, "No se pudieron cargar los usuarios")
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={abrirEditar}
          emptyTitle="Sin usuarios"
          emptyDescription="Creá una cuenta para que el equipo pueda acceder al sistema."
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

      <UsuarioFormDialog
        open={formOpen}
        usuario={usuarioEditando}
        esMismoUsuario={
          Boolean(sesion && usuarioEditando) &&
          sesion?.id_usuario === usuarioEditando?.id_usuario
        }
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
