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

export const ESTADOS_MANT = {
  AL_DIA: "Al día",
  PROXIMO: "Próximo",
  VENCIDO: "Vencido",
} as const;

export type EstadoMant = keyof typeof ESTADOS_MANT;

export const COLORES_MANT: Record<EstadoMant, string> = {
  AL_DIA: "bg-green-100 text-green-800",
  PROXIMO: "bg-amber-100 text-amber-800",
  VENCIDO: "bg-red-100 text-red-800",
};

export interface Programacion {
  id_programacion: string;
  id_maquina: string;
  descripcion: string;
  frecuencia_horas: number | null;
  frecuencia_dias: number | null;
  dias_aviso: number;
  horas_aviso: string;
  proximo_mant: string | null;
  activo: boolean;
  maquina: { id_maquina: string; codigo: string | null; nombre: string; horas_uso: string };
  estado_mantenimiento: {
    estado: EstadoMant;
    dias_restantes: number | null;
    horas_restantes: number | null;
  };
}

export function restante(p: Programacion): string {
  const { dias_restantes: d, horas_restantes: h } = p.estado_mantenimiento;
  const dias = (n: number) => `${n} ${n === 1 ? "día" : "días"}`;
  const partes: string[] = [];

  if (h !== null) partes.push(h < 0 ? `${Math.abs(h)} h vencidas` : `${h} h`);
  if (d !== null) {
    partes.push(d < 0 ? `vencido hace ${dias(Math.abs(d))}` : d === 0 ? "vence hoy" : dias(d));
  }

  return partes.join(" · ") || "—";
}