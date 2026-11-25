import type {
  EstadoGeneral,
  EstadoOrden,
  EstadoSolicitud,
  Paginado,
  Prioridad,
  ResumenCliente,
  ResumenMaquina,
  ResumenSolicitud,
  ResumenUsuario,
  TipoServicio,
} from "@/types/admin";

export interface DashboardTecnico {
  solicitudes: {
    pendientes: number;
    en_proceso: number;
    finalizadas_hoy: number;
  };
  ordenes: {
    pendientes: number;
    en_proceso: number;
    finalizadas_hoy: number;
  };
  diagnosticos_pendientes: number;
}

export interface SolicitudTecnico {
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
  maquina: ResumenMaquina;
  cliente: ResumenCliente | null;
}

export interface ListaMisSolicitudes extends Paginado {
  solicitudes: SolicitudTecnico[];
}

export interface DiagnosticoTecnico {
  id_diagnostico: string;
  estado_general: EstadoGeneral;
  fallas_detectadas: string;
  observaciones: string | null;
  recomendaciones: string | null;
  fecha: string;
}

export interface OrdenResumenTecnico {
  id_orden_trabajo: string;
  codigo: string | null;
  estado: EstadoOrden;
  trabajo_realizado: string | null;
  monto: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export interface DetalleSolicitudTecnico extends SolicitudTecnico {
  usuario: ResumenUsuario;
  diagnostico: DiagnosticoTecnico | null;
  orden_trabajo: OrdenResumenTecnico | null;
  _count: {
    cotizaciones: number;
  };
}

export interface OrdenTecnico {
  id_orden_trabajo: string;
  codigo: string | null;
  id_solicitud: string;
  id_diagnostico: string;
  id_tecnico: string;
  estado: EstadoOrden;
  trabajo_realizado: string | null;
  monto: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  creado_en: string;
  actualizado_en: string;
  solicitud: ResumenSolicitud;
}

export interface ListaMisOrdenes extends Paginado {
  ordenes: OrdenTecnico[];
}
