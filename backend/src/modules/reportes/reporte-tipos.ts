/**
 * ViewModel único que alimenta tanto Excel como PDF. Se construye una sola
 * vez desde `reportData.service.ts`, así ambos formatos muestran exactamente
 * los mismos números sin depender de la base en cada hoja/página.
 */
import type { EstadoOrden, Prioridad, TipoServicio } from "@prisma/client";

export interface FiltroReporteOrdenes {
  fecha_desde?: string;
  fecha_hasta?: string;
  id_cliente?: string;
  id_tecnico?: string;
  estado?: EstadoOrden;
  tipo_servicio?: TipoServicio;
  prioridad?: Prioridad;
  q?: string;
  /** Nombres ya resueltos para mostrar en el encabezado del reporte. */
  cliente?: string;
  tecnico?: string;
}

export interface FilaOrden {
  id_orden_trabajo: string;
  codigo: string | null;
  fecha: string; // creado_en formateado en La Paz
  cliente: string;
  maquina: string;
  tecnico: string;
  tipo: string; // Preventivo | Correctivo
  prioridad: string; // Alta | Media | Baja
  estado: string; // Pendiente | En proceso | Finalizada | Cancelada
  diagnostico: string; // Bueno | Regular | Malo | Crítico
  fallas: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias: number | null;
  materiales: string; // lista "código - nombre (cant.)"
  monto: number | null;
  trabajo_realizado: string | null;
}

export interface Kpi {
  etiqueta: string;
  valor: string;
  subtexto?: string;
  tono: "primary" | "info" | "success" | "warning" | "danger" | "neutral";
}

export interface FilaEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
  tono: "primary" | "info" | "success" | "warning" | "danger" | "neutral";
}

export interface FilaTecnico {
  tecnico: string;
  ordenes: number;
  finalizadas: number;
  en_proceso: number;
  pendientes: number;
  canceladas: number;
  cumplimiento: number;
  monto_total: number;
  dias_promedio: number | null;
}

export interface FilaCliente {
  cliente: string;
  ordenes: number;
  finalizadas: number;
  cumplimiento: number;
  monto_total: number;
  ticket_promedio: number;
}

export interface FilaMaterial {
  codigo: string | null;
  nombre: string;
  cantidad: number;
}

export interface ReporteOrdenesVM {
  titulo: string;
  subtitulo: string;
  generado_por: string;
  generado_en: string;
  periodo: string;
  filtros_aplicados: string[];
  kpis: Kpi[];
  estados: FilaEstado[];
  tecnicos: FilaTecnico[];
  clientes: FilaCliente[];
  materiales: FilaMaterial[];
  filas: FilaOrden[];
  totales: {
    ordenes: number;
    monto_total: number;
    horas_promedio: number | null;
  };
  /** Para tablas genéricas de export viejo: filas clave-valor planas. */
  filasTabla: Record<string, unknown>[];
}

export interface LimitesReporte {
  maxOrdenes: number;
  maxMateriales: number;
}

export const LIMITE_REPORTE: LimitesReporte = {
  maxOrdenes: 10_000,
  maxMateriales: 30_000,
};

export interface ResultadoReporteOrdenes {
  vm: ReporteOrdenesVM;
  totalRegistros: number;
}
