import type {
  EstadoGeneral,
  EstadoOrden,
  Prioridad,
  TipoServicio,
} from "@prisma/client";

/**
 * Tokens visuales del frontend de DYD, extraídos de `frontend/src/styles/globals.css`
 * y de los HEX explícitos usados en gráficos y `admin-labels.ts`.
 *
 * No agregar colores nuevos: si falta un tono, se compone a partir de estos.
 */
export const COLORES_REPORTE = {
  primary: "#2563EB",
  primaryOscuro: "#1D4ED8",
  primarySuave: "#DBEAFE",
  secondary: "#38BDF8",
  ink: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  background: "#F4F8FF",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#F43F5E",
  neutral: "#64748B",
} as const;

export type Tono = "primary" | "info" | "success" | "warning" | "danger" | "neutral";

export interface PaletaTono {
  /** Color pleno: barras, acentos y bordes. */
  base: string;
  /** Fondo suave para chips y tarjetas. */
  fondo: string;
  /** Texto legible sobre `fondo`. */
  texto: string;
  /** Borde del chip. */
  borde: string;
}

export const TONOS: Record<Tono, PaletaTono> = {
  primary: {
    base: COLORES_REPORTE.primary,
    fondo: "#EFF6FF",
    texto: COLORES_REPORTE.primaryOscuro,
    borde: "#BFDBFE",
  },
  info: {
    base: COLORES_REPORTE.primary,
    fondo: "#EFF6FF",
    texto: COLORES_REPORTE.primaryOscuro,
    borde: "#BFDBFE",
  },
  success: {
    base: COLORES_REPORTE.success,
    fondo: "#ECFDF5",
    texto: "#047857",
    borde: "#A7F3D0",
  },
  warning: {
    base: COLORES_REPORTE.warning,
    fondo: "#FFFBEB",
    texto: "#B45309",
    borde: "#FDE68A",
  },
  danger: {
    base: COLORES_REPORTE.danger,
    fondo: "#FFF1F2",
    texto: "#BE123C",
    borde: "#FECDD3",
  },
  neutral: {
    base: COLORES_REPORTE.neutral,
    fondo: "#F1F5F9",
    texto: "#45556C",
    borde: COLORES_REPORTE.border,
  },
};

/** Convierte `#2563EB` en el ARGB que espera ExcelJS (`FF2563EB`). */
export function argb(hex: string): string {
  return `FF${hex.replace("#", "").toUpperCase()}`;
}

export const ETIQUETA_ESTADO_ORDEN: Record<EstadoOrden, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export const TONO_ESTADO_ORDEN: Record<EstadoOrden, Tono> = {
  PENDIENTE: "warning",
  EN_PROCESO: "info",
  FINALIZADA: "success",
  CANCELADA: "danger",
};

export const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const TONO_PRIORIDAD: Record<Prioridad, Tono> = {
  ALTA: "danger",
  MEDIA: "warning",
  BAJA: "neutral",
};

export const ETIQUETA_TIPO_SERVICIO: Record<TipoServicio, string> = {
  PREVENTIVO: "Preventivo",
  CORRECTIVO: "Correctivo",
};

export const TONO_TIPO_SERVICIO: Record<TipoServicio, Tono> = {
  PREVENTIVO: "info",
  CORRECTIVO: "warning",
};

export const ETIQUETA_DIAGNOSTICO: Record<EstadoGeneral, string> = {
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
  CRITICO: "Crítico",
};

export const TONO_DIAGNOSTICO: Record<EstadoGeneral, Tono> = {
  BUENO: "success",
  REGULAR: "warning",
  MALO: "danger",
  CRITICO: "danger",
};

/** Mapea etiqueta en español → tono (para cuando ya tenemos la etiqueta, no la clave). */
export const ESTADO_ORDEN_ETIQUETA_A_TONO: Record<string, Tono> = {
  Pendiente: "warning",
  "En proceso": "info",
  Finalizada: "success",
  Cancelada: "danger",
};

/** Mapea etiqueta en español → tono (prioridad). */
export const PRIORIDAD_ETIQUETA_A_TONO: Record<string, Tono> = {
  Alta: "danger",
  Media: "warning",
  Baja: "neutral",
};

/** Mapea etiqueta en español → tono (diagnóstico). */
export const DIAGNOSTICO_ETIQUETA_A_TONO: Record<string, Tono> = {
  Bueno: "success",
  Regular: "warning",
  Malo: "danger",
  Crítico: "danger",
};
