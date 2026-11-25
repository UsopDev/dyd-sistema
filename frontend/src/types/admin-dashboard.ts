export type TonoKpi =
  | "blue"
  | "sky"
  | "indigo"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "cyan";

export type IconoKpi =
  | "wallet"
  | "users"
  | "clipboard"
  | "factory"
  | "wrench"
  | "stethoscope"
  | "check"
  | "clock"
  | "calendar";

export interface KpiCardData {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: TonoKpi;
  icon: IconoKpi;
  trend?: {
    valor: string;
    direccion: "up" | "down";
  };
  badge?: string;
}

export interface PuntoRendimiento {
  mes: string;
  etiqueta: string;
  ingresos: number;
  solicitudes: number;
}

export interface SegmentoInventario {
  name: string;
  value: number;
  color: string;
}

export interface CategoriaBarra {
  categoria: string;
  cantidad: number;
  porcentaje: number;
  porcentajeLabel: string;
  color: string;
}

export interface MejorPeriodo {
  periodo: string;
  monto: string;
  delta: string;
  barras: number[];
}

export interface RequiereAtencion {
  valor: string;
  detalle: string;
  sparkline: number[];
}

export interface AdminDashboardData {
  kpis: KpiCardData[];
  rendimiento: PuntoRendimiento[];
  inventario: SegmentoInventario[];
  porcentajeEnStock: number;
  categorias: CategoriaBarra[];
  mejorPeriodo: MejorPeriodo | null;
  atencion: RequiereAtencion | null;
}
