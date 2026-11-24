export interface KPIData {
  label: string;
  value: string | number;
  trend: {
    value: number;
    label: string;
    positive: boolean;
  };
  icon: string;
  color: "blue" | "emerald" | "violet" | "amber" | "rose";
}

export interface TrendPoint {
  mes: string;
  ingresos: number;
  pedidos: number;
}

export interface InventoryData {
  enStock: number;
  bajoStock: number;
  agotado: number;
}

export interface CategoryData {
  categoria: string;
  valor: number;
  porcentaje: number;
  color: string;
}

export interface HighlightCardData {
  title: string;
  value: string;
  description: string;
  variant: "success" | "danger";
  chartData: number[];
}
