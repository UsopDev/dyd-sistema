export type TonoKpi = "blue" | "sky" | "indigo";
export type IconoKpi = "wallet" | "users" | "clipboard";
export type DireccionTendencia = "up" | "down";

export interface KpiMock {
  id: string;
  label: string;
  value: string;
  trend: string;
  direction: DireccionTendencia;
  hint: string;
  tone: TonoKpi;
  icon: IconoKpi;
}

export interface PuntoRendimiento {
  mes: string;
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

export const kpiCards: KpiMock[] = [
  {
    id: "ingresos",
    label: "Ingresos totales",
    value: "S/ 128,450",
    trend: "+12.5%",
    direction: "up",
    hint: "vs. período anterior",
    tone: "blue",
    icon: "wallet",
  },
  {
    id: "clientes",
    label: "Clientes activos",
    value: "48",
    trend: "+4.3%",
    direction: "up",
    hint: "vs. período anterior",
    tone: "sky",
    icon: "users",
  },
  {
    id: "solicitudes",
    label: "Solicitudes",
    value: "156",
    trend: "-2.1%",
    direction: "down",
    hint: "vs. período anterior",
    tone: "indigo",
    icon: "clipboard",
  },
];

export const performanceData: PuntoRendimiento[] = [
  { mes: "Jun", ingresos: 14800, solicitudes: 18 },
  { mes: "Jul", ingresos: 18600, solicitudes: 22 },
  { mes: "Ago", ingresos: 17200, solicitudes: 20 },
  { mes: "Sep", ingresos: 21500, solicitudes: 27 },
  { mes: "Oct", ingresos: 24850, solicitudes: 31 },
  { mes: "Nov", ingresos: 31400, solicitudes: 38 },
];

export const inventoryData: SegmentoInventario[] = [
  { name: "En stock", value: 78, color: "#2563eb" },
  { name: "Bajo stock", value: 15, color: "#f59e0b" },
  { name: "Agotado", value: 7, color: "#f43f5e" },
];

export const inventarioPorcentajeEnStock = 78;

export const categoryData: CategoriaBarra[] = [
  { categoria: "Recibida", cantidad: 34, porcentaje: 22, porcentajeLabel: "22%", color: "#2563eb" },
  { categoria: "Diagnóstico", cantidad: 28, porcentaje: 18, porcentajeLabel: "18%", color: "#38bdf8" },
  { categoria: "Cotizada", cantidad: 22, porcentaje: 14, porcentajeLabel: "14%", color: "#6366f1" },
  { categoria: "Asignada", cantidad: 19, porcentaje: 12, porcentajeLabel: "12%", color: "#8b5cf6" },
  { categoria: "En proceso", cantidad: 25, porcentaje: 16, porcentajeLabel: "16%", color: "#06b6d4" },
  { categoria: "Finalizada", cantidad: 20, porcentaje: 13, porcentajeLabel: "13%", color: "#10b981" },
  { categoria: "Cancelada", cantidad: 8, porcentaje: 5, porcentajeLabel: "5%", color: "#f43f5e" },
];

export const bestPeriod = {
  titulo: "Mejor período",
  periodo: "Octubre 2026",
  monto: "S/ 24,850",
  delta: "+18.4%",
  barras: [18, 24, 21, 29, 26, 34, 41],
};

export const attention = {
  titulo: "Requiere atención",
  valor: "4 materiales",
  detalle: "por debajo del stock mínimo",
  sparkline: [7, 5, 8, 4, 6, 3, 5],
};
