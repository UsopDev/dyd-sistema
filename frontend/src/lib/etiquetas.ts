export const ESTADOS_SOLICITUD = {
  RECIBIDA: "Recibida",
  EN_DIAGNOSTICO: "En diagnóstico",
  COTIZADA: "Cotizada",
  ASIGNADA: "Asignada",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
} as const;

export type EstadoSolicitud = keyof typeof ESTADOS_SOLICITUD;

export const COLORES_ESTADO: Record<EstadoSolicitud, string> = {
  RECIBIDA: "bg-slate-200 text-slate-700",
  EN_DIAGNOSTICO: "bg-blue-100 text-blue-800",
  COTIZADA: "bg-purple-100 text-purple-800",
  ASIGNADA: "bg-indigo-100 text-indigo-800",
  EN_PROCESO: "bg-amber-100 text-amber-800",
  FINALIZADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export const PRIORIDADES = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" } as const;
export type Prioridad = keyof typeof PRIORIDADES;

export const COLORES_PRIORIDAD: Record<Prioridad, string> = {
  ALTA: "bg-red-100 text-red-800",
  MEDIA: "bg-amber-100 text-amber-800",
  BAJA: "bg-green-100 text-green-800",
};

export const TIPOS_SERVICIO = { PREVENTIVO: "Preventivo", CORRECTIVO: "Correctivo" } as const;
export type TipoServicio = keyof typeof TIPOS_SERVICIO;

export const ESTADOS_GENERAL = {
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
  CRITICO: "Crítico",
} as const;

export function fechaHora(valor: string): string {
  return new Date(valor).toLocaleString("es");
}

export const ESTADOS_ORDEN = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
} as const;

export type EstadoOrden = keyof typeof ESTADOS_ORDEN;

export const COLORES_ORDEN: Record<EstadoOrden, string> = {
  PENDIENTE: "bg-slate-200 text-slate-700",
  EN_PROCESO: "bg-amber-100 text-amber-800",
  FINALIZADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};
