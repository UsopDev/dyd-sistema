import type {
  EstadoGeneral,
  EstadoMaquina,
  EstadoOrden,
  EstadoPreventivo,
  EstadoSolicitud,
  Prioridad,
  RolUsuario,
  TipoItem,
  TipoMovimiento,
  TipoServicio,
} from "@/types/admin";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export const TONO_ESTADO_SOLICITUD: Record<EstadoSolicitud, BadgeTone> = {
  RECIBIDA: "info",
  EN_DIAGNOSTICO: "warning",
  COTIZADA: "neutral",
  ASIGNADA: "info",
  EN_PROCESO: "warning",
  FINALIZADA: "success",
  CANCELADA: "danger",
};

export const ETIQUETA_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  RECIBIDA: "Recibida",
  EN_DIAGNOSTICO: "En diagnóstico",
  COTIZADA: "Cotizada",
  ASIGNADA: "Asignada",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export const COLOR_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  RECIBIDA: "#2563eb",
  EN_DIAGNOSTICO: "#38bdf8",
  COTIZADA: "#6366f1",
  ASIGNADA: "#8b5cf6",
  EN_PROCESO: "#06b6d4",
  FINALIZADA: "#10b981",
  CANCELADA: "#f43f5e",
};

export const TONO_PRIORIDAD: Record<Prioridad, BadgeTone> = {
  ALTA: "danger",
  MEDIA: "warning",
  BAJA: "neutral",
};

export const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const TONO_TIPO_SERVICIO: Record<TipoServicio, BadgeTone> = {
  PREVENTIVO: "info",
  CORRECTIVO: "warning",
};

export const ETIQUETA_TIPO_SERVICIO: Record<TipoServicio, string> = {
  PREVENTIVO: "Preventivo",
  CORRECTIVO: "Correctivo",
};

export const TONO_ESTADO_ORDEN: Record<EstadoOrden, BadgeTone> = {
  PENDIENTE: "warning",
  EN_PROCESO: "info",
  FINALIZADA: "success",
  CANCELADA: "danger",
};

export const ETIQUETA_ESTADO_ORDEN: Record<EstadoOrden, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export const TONO_ESTADO_MAQUINA: Record<EstadoMaquina, BadgeTone> = {
  OPERATIVA: "success",
  EN_MANTENIMIENTO: "warning",
  FUERA_DE_SERVICIO: "danger",
};

export const ETIQUETA_ESTADO_MAQUINA: Record<EstadoMaquina, string> = {
  OPERATIVA: "Operativa",
  EN_MANTENIMIENTO: "En mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de servicio",
};

export const TONO_ESTADO_GENERAL: Record<EstadoGeneral, BadgeTone> = {
  BUENO: "success",
  REGULAR: "warning",
  MALO: "danger",
  CRITICO: "danger",
};

export const ETIQUETA_ESTADO_GENERAL: Record<EstadoGeneral, string> = {
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
  CRITICO: "Crítico",
};

export const TONO_ESTADO_PREVENTIVO: Record<EstadoPreventivo, BadgeTone> = {
  AL_DIA: "success",
  PROXIMO: "warning",
  VENCIDO: "danger",
};

export const ETIQUETA_ESTADO_PREVENTIVO: Record<EstadoPreventivo, string> = {
  AL_DIA: "Al día",
  PROXIMO: "Próximo",
  VENCIDO: "Vencido",
};

export const TONO_ROL: Record<RolUsuario, BadgeTone> = {
  ADMINISTRADOR: "info",
  TECNICO: "neutral",
};

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  ADMINISTRADOR: "Administrador",
  TECNICO: "Técnico",
};

export const ETIQUETA_TIPO_ITEM: Record<TipoItem, string> = {
  SERVICIO: "Servicio",
  MATERIAL: "Material",
};

export const ETIQUETA_TIPO_MOVIMIENTO: Record<TipoMovimiento, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
};
