import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, Loader2, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Select, Textarea } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { mensajeDeError } from "@/lib/http";
import { formatFechaHora } from "@/lib/format";
import { useStaffAuth } from "@/features/auth/staff-auth";
import {
  ETIQUETA_ESTADO_GENERAL,
  ETIQUETA_ESTADO_ORDEN,
  TONO_ESTADO_GENERAL,
  TONO_ESTADO_ORDEN,
} from "@/lib/admin-labels";
import {
  useActualizarDiagnostico,
  useCrearDiagnostico,
  useDiagnosticoDetalle,
  useDiagnosticos,
  useSolicitudesOpciones,
} from "@/features/admin/hooks/use-admin-queries";
import { DataTable, type Column } from "@/features/admin/components/data-table";
import { FiltersBar, SelectFilter } from "@/features/admin/components/filters";
import { FormField } from "@/features/admin/components/form-field";
import { Modal } from "@/features/admin/components/modal";
import { DetailField } from "@/features/admin/components/states";
import { TablePagination } from "@/features/admin/components/table-pagination";
import type {
  Diagnostico,
  DiagnosticoPayload,
  EstadoGeneral,
} from "@/types/admin";

const LIMITE = 20;

const ESTADOS: Array<{ value: EstadoGeneral; label: string }> = [
  { value: "BUENO", label: "Bueno" },
  { value: "REGULAR", label: "Regular" },
  { value: "MALO", label: "Malo" },
  { value: "CRITICO", label: "Crítico" },
];

const diagnosticoSchema = z.object({
  id_solicitud: z.string().min(1, "Seleccioná una solicitud"),
  estado_general: z.enum(["BUENO", "REGULAR", "MALO", "CRITICO"]),
  fallas_detectadas: z
    .string()
    .trim()
    .min(3, "Describí las fallas detectadas")
    .max(5000, "Máximo 5000 caracteres"),
  observaciones: z.string().trim().max(5000, "Máximo 5000 caracteres").optional(),
  recomendaciones: z.string().trim().max(5000, "Máximo 5000 caracteres").optional(),
});

type DiagnosticoFormValues = z.infer<typeof diagnosticoSchema>;

const VACIOS: DiagnosticoFormValues = {
  id_solicitud: "",
  estado_general: "BUENO",
  fallas_detectadas: "",
  observaciones: "",
  recomendaciones: "",
};

function textoONull(valor?: string): string | null {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

function DiagnosticoFormDialog({
  open,
  diagnostico,
  onClose,
}: {
  open: boolean;
  diagnostico: Diagnostico | null;
  onClose: () => void;
}) {
  const crear = useCrearDiagnostico();
  const actualizar = useActualizarDiagnostico();
  const solicitudes = useSolicitudesOpciones("RECIBIDA");
  const { toast } = useToast();
  const editando = Boolean(diagnostico);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiagnosticoFormValues>({
    resolver: zodResolver(diagnosticoSchema),
    defaultValues: VACIOS,
  });

  useEffect(() => {
    if (!open) return;

    reset(
      diagnostico
        ? {
            id_solicitud: diagnostico.id_solicitud,
            estado_general: diagnostico.estado_general,
            fallas_detectadas: diagnostico.fallas_detectadas,
            observaciones: diagnostico.observaciones ?? "",
            recomendaciones: diagnostico.recomendaciones ?? "",
          }
        : VACIOS,
    );
  }, [open, diagnostico, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const base = {
      estado_general: values.estado_general,
      fallas_detectadas: values.fallas_detectadas.trim(),
      observaciones: textoONull(values.observaciones),
      recomendaciones: textoONull(values.recomendaciones),
    };

    try {
      if (diagnostico) {
        await actualizar.mutateAsync({ id: diagnostico.id_diagnostico, payload: base });
        toast({
          title: "Diagnóstico actualizado",
          description: diagnostico.solicitud.codigo ?? diagnostico.id_diagnostico,
          variant: "success",
        });
      } else {
        const payload: DiagnosticoPayload = {
          id_solicitud: values.id_solicitud,
          ...base,
        };
        await crear.mutateAsync(payload);
        toast({
          title: "Diagnóstico registrado",
          description: "La solicitud pasó a En diagnóstico.",
          variant: "success",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar el diagnóstico",
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
      title={editando ? "Editar diagnóstico" : "Nuevo diagnóstico"}
      description={
        editando
          ? "Solo editable mientras la solicitud sigue en diagnóstico."
          : "Al guardar, la solicitud pasa de Recibida a En diagnóstico."
      }
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
          <Button type="submit" form="diagnostico-form" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Registrar diagnóstico"}
          </Button>
        </>
      }
    >
      <form
        id="diagnostico-form"
        onSubmit={onSubmit}
        className="grid gap-4 sm:grid-cols-2"
      >
        {editando ? (
          <DetailField label="Solicitud">
            {diagnostico?.solicitud.codigo ?? diagnostico?.id_solicitud}
          </DetailField>
        ) : (
          <FormField
            label="Solicitud"
            htmlFor="id_solicitud"
            error={errors.id_solicitud?.message}
            hint="Solo se listan solicitudes en estado Recibida."
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
        )}

        <FormField
          label="Estado general"
          htmlFor="estado_general"
          error={errors.estado_general?.message}
          required
        >
          <Select id="estado_general" {...register("estado_general")}>
            {ESTADOS.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="hidden sm:block" />

        <FormField
          label="Fallas detectadas"
          htmlFor="fallas_detectadas"
          error={errors.fallas_detectadas?.message}
          required
          className="sm:col-span-2"
        >
          <Textarea
            id="fallas_detectadas"
            rows={3}
            placeholder="Describí los hallazgos técnicos..."
            {...register("fallas_detectadas")}
          />
        </FormField>

        <FormField
          label="Observaciones"
          htmlFor="observaciones"
          error={errors.observaciones?.message}
        >
          <Textarea
            id="observaciones"
            rows={3}
            placeholder="Detalles adicionales (opcional)"
            {...register("observaciones")}
          />
        </FormField>

        <FormField
          label="Recomendaciones"
          htmlFor="recomendaciones"
          error={errors.recomendaciones?.message}
        >
          <Textarea
            id="recomendaciones"
            rows={3}
            placeholder="Acciones sugeridas (opcional)"
            {...register("recomendaciones")}
          />
        </FormField>
      </form>
    </Modal>
  );
}

export function DiagnosticosPage() {
  const { usuario } = useStaffAuth();
  const esTecnico = usuario?.rol === "TECNICO";
  const [pagina, setPagina] = useState(1);
  const [estadoGeneral, setEstadoGeneral] = useState("");

  useEffect(() => {
    setPagina(1);
  }, [estadoGeneral]);

  const consulta = useDiagnosticos({
    estado_general: estadoGeneral || undefined,
    pagina,
    limite: LIMITE,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [diagnosticoEditando, setDiagnosticoEditando] =
    useState<Diagnostico | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const detalle = useDiagnosticoDetalle(detalleId);
  const diagnosticos = consulta.data?.diagnosticos ?? [];
  const total = consulta.data?.total ?? 0;

  const abrirCrear = () => {
    setDiagnosticoEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (diagnostico: Diagnostico) => {
    setDiagnosticoEditando(diagnostico);
    setFormOpen(true);
  };

  const columnas: Column<Diagnostico>[] = [
    {
      key: "solicitud",
      header: "Solicitud",
      cell: (diagnostico) => (
        <div className="min-w-[150px]">
          <p className="font-semibold text-slate-900">
            {diagnostico.solicitud.codigo ?? "Sin código"}
          </p>
          <p className="text-xs text-slate-400">
            {diagnostico.solicitud.estado}
          </p>
        </div>
      ),
    },
    {
      key: "maquina",
      header: "Máquina",
      cell: (diagnostico) => (
        <div className="min-w-[160px]">
          <p>{diagnostico.maquina.nombre}</p>
          <p className="text-xs text-slate-400">
            {diagnostico.maquina.codigo ?? "Sin código"}
          </p>
        </div>
      ),
    },
    {
      key: "tecnico",
      header: "Técnico",
      cell: (diagnostico) =>
        `${diagnostico.tecnico.nombres} ${diagnostico.tecnico.apellidos}`,
    },
    {
      key: "estado",
      header: "Estado general",
      cell: (diagnostico) => (
        <Badge variant={TONO_ESTADO_GENERAL[diagnostico.estado_general]}>
          {ETIQUETA_ESTADO_GENERAL[diagnostico.estado_general]}
        </Badge>
      ),
    },
    {
      key: "fallas",
      header: "Fallas",
      cell: (diagnostico) => (
        <p className="max-w-[260px] truncate text-xs text-slate-500">
          {diagnostico.fallas_detectadas}
        </p>
      ),
    },
    {
      key: "fecha",
      header: "Fecha",
      cell: (diagnostico) => formatFechaHora(diagnostico.fecha),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (diagnostico) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDetalleId(diagnostico.id_diagnostico)}
            aria-label="Ver diagnóstico"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {esTecnico && diagnostico.solicitud.estado === "EN_DIAGNOSTICO" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => abrirEditar(diagnostico)}
              aria-label="Editar diagnóstico"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Diagnósticos"
        description="Evaluación técnica de las solicitudes recibidas."
      >
        {esTecnico && (
          <Button type="button" onClick={abrirCrear}>
            <Plus className="h-4 w-4" />
            Nuevo diagnóstico
          </Button>
        )}
      </PageHeader>

      <GlassCard className="p-4">
        <FiltersBar>
          <SelectFilter
            value={estadoGeneral}
            onChange={setEstadoGeneral}
            placeholder="Todos los estados"
            options={ESTADOS}
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={diagnosticos}
          getRowKey={(diagnostico) => diagnostico.id_diagnostico}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(consulta.error, "No se pudieron cargar los diagnósticos")
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(diagnostico) => setDetalleId(diagnostico.id_diagnostico)}
          emptyTitle="Todavía no hay diagnósticos"
          emptyDescription="Tomá una solicitud recibida y registrá su evaluación técnica."
          minWidth="940px"
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

      <DiagnosticoFormDialog
        open={formOpen}
        diagnostico={diagnosticoEditando}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={Boolean(detalleId)}
        onClose={() => setDetalleId(null)}
        title={
          detalle.data
            ? `Diagnóstico · ${detalle.data.solicitud.codigo ?? ""}`
            : "Detalle del diagnóstico"
        }
        description="Hallazgos, recomendaciones y adjuntos."
        size="lg"
        footer={
          detalle.data &&
          esTecnico &&
          detalle.data.solicitud.estado === "EN_DIAGNOSTICO" ? (
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
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, indice) => (
              <Skeleton key={indice} className="h-4 w-full max-w-[420px]" />
            ))}
          </div>
        ) : detalle.error ? (
          <p className="text-sm text-rose-600">{mensajeDeError(detalle.error)}</p>
        ) : detalle.data ? (
          <div className="space-y-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Solicitud">
                {detalle.data.solicitud.codigo ?? detalle.data.id_solicitud}
              </DetailField>
              <DetailField label="Estado de la solicitud">
                {detalle.data.solicitud.estado}
              </DetailField>
              <DetailField label="Máquina">
                {detalle.data.maquina.nombre}
                {detalle.data.maquina.codigo
                  ? ` (${detalle.data.maquina.codigo})`
                  : ""}
              </DetailField>
              <DetailField label="Técnico">
                {detalle.data.tecnico.nombres} {detalle.data.tecnico.apellidos}
              </DetailField>
              <DetailField label="Estado general">
                <Badge
                  variant={TONO_ESTADO_GENERAL[detalle.data.estado_general]}
                >
                  {ETIQUETA_ESTADO_GENERAL[detalle.data.estado_general]}
                </Badge>
              </DetailField>
              <DetailField label="Fecha">
                {formatFechaHora(detalle.data.fecha)}
              </DetailField>
            </dl>

            <div className="space-y-4">
              <DetailField label="Fallas detectadas">
                <span className="whitespace-pre-line font-normal leading-relaxed text-slate-600">
                  {detalle.data.fallas_detectadas}
                </span>
              </DetailField>
              <DetailField label="Observaciones">
                <span className="whitespace-pre-line font-normal leading-relaxed text-slate-600">
                  {detalle.data.observaciones ?? "—"}
                </span>
              </DetailField>
              <DetailField label="Recomendaciones">
                <span className="whitespace-pre-line font-normal leading-relaxed text-slate-600">
                  {detalle.data.recomendaciones ?? "—"}
                </span>
              </DetailField>
            </div>

            {detalle.data.orden_trabajo && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Orden
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {detalle.data.orden_trabajo.codigo ?? "Sin código"}
                </span>
                <Badge
                  variant={TONO_ESTADO_ORDEN[detalle.data.orden_trabajo.estado]}
                >
                  {ETIQUETA_ESTADO_ORDEN[detalle.data.orden_trabajo.estado]}
                </Badge>
              </div>
            )}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Adjuntos
              </p>
              {detalle.data.adjuntos.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Sin archivos adjuntos.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white/70">
                  {detalle.data.adjuntos.map((adjunto) => (
                    <li
                      key={adjunto.id_adjunto}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <span className="truncate text-sm text-slate-700">
                        {adjunto.nombre_original}
                      </span>
                      <span className="whitespace-nowrap text-[11px] text-slate-400">
                        {formatFechaHora(adjunto.subido_en)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
