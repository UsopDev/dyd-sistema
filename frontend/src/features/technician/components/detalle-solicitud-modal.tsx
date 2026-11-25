import { useEffect, useState } from "react";
import { FilePen, Loader2, Stethoscope, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/features/admin/components/modal";
import { FormField } from "@/features/admin/components/form-field";
import { DetailField, ErrorState } from "@/features/admin/components/states";
import { useStaffAuth } from "@/features/auth/staff-auth";
import {
  useActualizarDiagnostico,
  useCrearDiagnostico,
  useMiSolicitud,
} from "@/features/technician/hooks/use-technician-queries";
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
import { formatFechaHora, formatSoles } from "@/lib/format";
import { mensajeDeError } from "@/lib/http";
import type { DiagnosticoTecnico } from "@/types/technician";

const diagnosticoSchema = z.object({
  estado_general: z.enum(["BUENO", "REGULAR", "MALO", "CRITICO"]),
  fallas_detectadas: z
    .string()
    .trim()
    .min(3, "Describí las fallas detectadas")
    .max(5000, "Máximo 5000 caracteres"),
  observaciones: z
    .string()
    .trim()
    .max(5000, "Máximo 5000 caracteres")
    .optional(),
  recomendaciones: z
    .string()
    .trim()
    .max(5000, "Máximo 5000 caracteres")
    .optional(),
});

type DiagnosticoFormValues = z.infer<typeof diagnosticoSchema>;

export function DetalleSolicitudTecnicoModal({
  id,
  onClose,
  titulo = "Detalle de la solicitud",
  abrirFormAlCargar = false,
}: {
  id: string | null;
  onClose: () => void;
  titulo?: string;
  /** Abre directamente el formulario de diagnóstico (cola de trabajo). */
  abrirFormAlCargar?: boolean;
}) {
  const { toast } = useToast();
  const { usuario } = useStaffAuth();
  const detalle = useMiSolicitud(id);
  const crearDiagnostico = useCrearDiagnostico();
  const actualizarDiagnostico = useActualizarDiagnostico();
  const [diagnosticoEditando, setDiagnosticoEditando] =
    useState<DiagnosticoTecnico | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiagnosticoFormValues>({
    resolver: zodResolver(diagnosticoSchema),
    defaultValues: {
      estado_general: "BUENO",
      fallas_detectadas: "",
      observaciones: "",
      recomendaciones: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!detalle.data || !id) return;

    const payload = {
      estado_general: values.estado_general,
      fallas_detectadas: values.fallas_detectadas.trim(),
      observaciones: values.observaciones?.trim() || null,
      recomendaciones: values.recomendaciones?.trim() || null,
    };

    try {
      if (diagnosticoEditando) {
        await actualizarDiagnostico.mutateAsync({
          id: diagnosticoEditando.id_diagnostico,
          payload,
        });
        toast({ title: "Diagnóstico actualizado", variant: "success" });
      } else {
        await crearDiagnostico.mutateAsync({ id_solicitud: id, ...payload });
        toast({ title: "Diagnóstico registrado", variant: "success" });
      }
      reset({
        estado_general: "BUENO",
        fallas_detectadas: "",
        observaciones: "",
        recomendaciones: "",
      });
      setFormOpen(false);
      setDiagnosticoEditando(null);
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: mensajeDeError(error),
        variant: "error",
      });
    }
  });

  const abrirCrear = () => {
    setDiagnosticoEditando(null);
    reset({
      estado_general: "BUENO",
      fallas_detectadas: "",
      observaciones: "",
      recomendaciones: "",
    });
    setFormOpen(true);
  };

  const abrirEditar = (diagnostico: DiagnosticoTecnico) => {
    setDiagnosticoEditando(diagnostico);
    reset({
      estado_general: diagnostico.estado_general,
      fallas_detectadas: diagnostico.fallas_detectadas,
      observaciones: diagnostico.observaciones ?? "",
      recomendaciones: diagnostico.recomendaciones ?? "",
    });
    setFormOpen(true);
  };

  const diagnostico = detalle.data?.diagnostico;
  const esTecnico = usuario?.rol === "TECNICO";
  const puedeCrear =
    esTecnico &&
    detalle.data?.estado === "RECIBIDA" &&
    !detalle.data?.diagnostico;
  const puedeEditar =
    esTecnico && diagnostico && detalle.data?.estado === "EN_DIAGNOSTICO";

  // Si viene desde la cola de trabajo, abre directo el formulario de diagnóstico.
  useEffect(() => {
    if (!abrirFormAlCargar || !detalle.data) return;
    if (detalle.data.estado === "RECIBIDA" && !detalle.data.diagnostico) {
      setDiagnosticoEditando(null);
      reset({
        estado_general: "BUENO",
        fallas_detectadas: "",
        observaciones: "",
        recomendaciones: "",
      });
      setFormOpen(true);
    }
  }, [abrirFormAlCargar, detalle.data, reset]);

  return (
    <>
      <Modal
        open={Boolean(id)}
        onClose={onClose}
        title={detalle.data?.codigo ?? titulo}
        description="Servicio, diagnóstico y orden de trabajo."
        size="lg"
        footer={
          <>
            {puedeCrear && (
              <Button type="button" onClick={abrirCrear}>
                <FilePen className="mr-2 h-4 w-4" />
                Registrar diagnóstico
              </Button>
            )}
            {puedeEditar && diagnostico && (
              <Button
                type="button"
                onClick={() => abrirEditar(diagnostico)}
                variant="secondary"
              >
                <FilePen className="mr-2 h-4 w-4" />
                Editar diagnóstico
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </>
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
              <DetailField label="Recepción">
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
            </dl>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Descripción
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {detalle.data.descripcion}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Diagnóstico
                </div>
                {detalle.data.diagnostico ? (
                  <div className="mt-2 space-y-2">
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
                    <p className="text-xs text-slate-400">
                      {formatFechaHora(detalle.data.diagnostico.fecha)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {detalle.data.diagnostico.fallas_detectadas}
                    </p>
                    {detalle.data.diagnostico.observaciones && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold">Observaciones:</span>{" "}
                        {detalle.data.diagnostico.observaciones}
                      </p>
                    )}
                    {detalle.data.diagnostico.recomendaciones && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold">Recomendaciones:</span>{" "}
                        {detalle.data.diagnostico.recomendaciones}
                      </p>
                    )}
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
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {detalle.data.orden_trabajo.codigo ?? "Sin código"}
                    </p>
                    <Badge
                      variant={
                        TONO_ESTADO_ORDEN[detalle.data.orden_trabajo.estado]
                      }
                    >
                      {ETIQUETA_ESTADO_ORDEN[detalle.data.orden_trabajo.estado]}
                    </Badge>
                    {detalle.data.orden_trabajo.trabajo_realizado && (
                      <p className="text-xs text-slate-500">
                        {detalle.data.orden_trabajo.trabajo_realizado}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Monto:{" "}
                      {detalle.data.orden_trabajo.monto
                        ? formatSoles(detalle.data.orden_trabajo.monto)
                        : "—"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Inicio:{" "}
                      {formatFechaHora(detalle.data.orden_trabajo.fecha_inicio)}
                      {" · "}Fin:{" "}
                      {formatFechaHora(detalle.data.orden_trabajo.fecha_fin)}
                    </p>
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

      {/* Modal Crear/Editar Diagnóstico */}
      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setDiagnosticoEditando(null);
        }}
        title={
          diagnosticoEditando ? "Editar diagnóstico" : "Registrar diagnóstico"
        }
        description={
          diagnosticoEditando
            ? "Modificá los hallazgos y recomendaciones."
            : "Ingresá los hallazgos y recomendaciones del diagnóstico técnico."
        }
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" form="diagnostico-form" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {diagnosticoEditando ? "Actualizar" : "Guardar"}
            </Button>
          </>
        }
      >
        <form
          id="diagnostico-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <FormField
            label="Estado general"
            htmlFor="estado_general"
            error={errors.estado_general?.message}
            required
          >
            <Select id="estado_general" {...register("estado_general")}>
              <option value="BUENO">Bueno</option>
              <option value="REGULAR">Regular</option>
              <option value="MALO">Malo</option>
              <option value="CRITICO">Crítico</option>
            </Select>
          </FormField>

          <FormField
            label="Fallas detectadas"
            htmlFor="fallas_detectadas"
            error={errors.fallas_detectadas?.message}
            required
          >
            <Textarea
              id="fallas_detectadas"
              rows={4}
              placeholder="Describí las fallas detectadas..."
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
              placeholder="Observaciones adicionales (opcional)"
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
    </>
  );
}
