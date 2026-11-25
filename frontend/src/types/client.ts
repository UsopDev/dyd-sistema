import type {
  EstadoGeneral,
  EstadoMaquina,
  EstadoOrden,
  EstadoSolicitud,
  Paginado,
  Prioridad,
  TipoServicio,
} from "@/types/admin";

export interface DashboardCliente {
  solicitudes: {
    pendientes: number;
    en_proceso: number;
    finalizadas: number;
  };
  maquinas: {
    total: number;
    operativas: number;
  };
  preventivos_proximos: number;
}

export interface ProgramacionCliente {
  id_programacion: string;
  descripcion: string;
  proximo_mant: string | null;
}

export interface SolicitudPortalCliente {
  id_solicitud: string;
  codigo: string | null;
  id_cliente: string | null;
  id_maquina: string;
  id_usuario_registrado: string;
  id_programacion: string | null;
  tipo_servicio: TipoServicio;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoSolicitud;
  fecha_recepcion: string;
  actualizado_en: string;
  maquina: {
    id_maquina: string;
    codigo: string | null;
    nombre: string;
  };
}

export interface ListaSolicitudesCliente extends Paginado {
  solicitudes: SolicitudPortalCliente[];
}

export interface DiagnosticoPortalCliente {
  id_diagnostico: string;
  estado_general: EstadoGeneral;
  fallas_detectadas: string;
  observaciones: string | null;
  recomendaciones: string | null;
  fecha: string;
}

export interface OrdenPortalCliente {
  id_orden_trabajo: string;
  codigo: string | null;
  estado: EstadoOrden;
  trabajo_realizado: string | null;
  monto: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export interface CotizacionPortalCliente {
  id_cotizacion: string;
  codigo: string | null;
  total: string;
  fecha: string;
}

export interface DetalleSolicitudCliente extends SolicitudPortalCliente {
  diagnostico: DiagnosticoPortalCliente | null;
  orden_trabajo: OrdenPortalCliente | null;
  cotizaciones: CotizacionPortalCliente[];
}

export interface MaquinaPortalCliente {
  id_maquina: string;
  id_cliente: string | null;
  codigo: string | null;
  nombre: string;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  nro_serie: string | null;
  es_propia: boolean;
  horas_uso: string;
  estado: EstadoMaquina;
  creado_en: string;
  actualizado_en: string;
  programaciones: ProgramacionCliente[];
}

export interface ListaMaquinasCliente extends Paginado {
  maquinas: MaquinaPortalCliente[];
}

export interface DetalleMaquinaCliente extends MaquinaPortalCliente {
  solicitudes: Array<{
    id_solicitud: string;
    codigo: string | null;
    estado: EstadoSolicitud;
    fecha_recepcion: string;
  }>;
}
