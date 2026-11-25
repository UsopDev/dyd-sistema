import type {
  EstadoMaquina,
  EstadoOrden,
  EstadoSolicitud,
  Prioridad,
  RolUsuario,
  TipoServicio,
} from "@/types/api";

export type {
  EstadoMaquina,
  EstadoOrden,
  EstadoSolicitud,
  Prioridad,
  RolUsuario,
  TipoServicio,
};

export type EstadoGeneral = "BUENO" | "REGULAR" | "MALO" | "CRITICO";
export type TipoMovimiento = "ENTRADA" | "SALIDA";
export type TipoItem = "SERVICIO" | "MATERIAL";
export type EstadoPreventivo = "AL_DIA" | "PROXIMO" | "VENCIDO";

/** Cualquier listado paginado del backend. */
export interface Paginado {
  total: number;
  pagina: number;
  limite: number;
}

export interface ResumenCliente {
  id_cliente: string;
  razon_social: string;
}

export interface ResumenMaquina {
  id_maquina: string;
  codigo: string | null;
  nombre: string;
}

export interface ResumenUsuario {
  id_usuario: string;
  nombres: string;
  apellidos: string;
}

export interface ResumenSolicitud {
  id_solicitud: string;
  codigo: string | null;
  estado: EstadoSolicitud;
}

export interface ResumenDiagnostico {
  id_diagnostico: string;
  estado_general: EstadoGeneral;
  fallas_detectadas?: string;
  recomendaciones?: string | null;
}

export interface ResumenOrden {
  id_orden_trabajo: string;
  codigo: string | null;
  estado: EstadoOrden;
}

// ==================== CLIENTES ====================

export interface Cliente {
  id_cliente: string;
  razon_social: string;
  ruc_dni: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  _count?: {
    maquinas: number;
    solicitudes: number;
  };
}

export interface ClientePayload {
  razon_social: string;
  ruc_dni?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo?: boolean;
}

export interface ListaClientes extends Paginado {
  clientes: Cliente[];
}

// ==================== MAQUINAS ====================

export interface Maquina {
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
  cliente?: ResumenCliente | null;
  _count?: {
    programaciones: number;
    solicitudes: number;
    registros_uso: number;
  };
}

export interface MaquinaPayload {
  id_cliente?: string | null;
  codigo?: string | null;
  nombre: string;
  tipo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  nro_serie?: string | null;
  es_propia?: boolean;
  horas_uso?: number;
  estado?: EstadoMaquina;
}

export interface ListaMaquinas extends Paginado {
  maquinas: Maquina[];
}

// ==================== MATERIALES ====================

export interface Material {
  id_material: string;
  codigo: string | null;
  nombre: string;
  unidad: string;
  stock_actual: string;
  stock_minimo: string;
  precio_unitario: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface MaterialPayload {
  codigo?: string | null;
  nombre: string;
  unidad: string;
  stock_minimo?: number;
  precio_unitario?: number | null;
  activo?: boolean;
}

export interface ListaMateriales extends Paginado {
  materiales: Material[];
}

export interface MovimientoInventario {
  id_movimiento: string;
  id_material: string;
  id_usuario: string;
  id_orden_trabajo: string | null;
  tipo: TipoMovimiento;
  cantidad: string;
  motivo: string | null;
  fecha: string;
  usuario: {
    nombres: string;
    apellidos: string;
  };
}

export interface ListaMovimientos extends Paginado {
  movimientos: MovimientoInventario[];
}

export interface MovimientoPayload {
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
}

export interface MaterialStockBajo {
  id_material: string;
  codigo: string | null;
  nombre: string;
  unidad: string;
  stock_actual: string;
  stock_minimo: string;
}

export interface RespuestaStockBajo {
  materiales: MaterialStockBajo[];
  total: number;
}

// ==================== SOLICITUDES ====================

export interface Solicitud {
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

export interface SolicitudDetalle extends Solicitud {
  usuario: ResumenUsuario;
  diagnostico: {
    id_diagnostico: string;
    estado_general: EstadoGeneral;
    fecha: string;
  } | null;
  orden_trabajo: ResumenOrden | null;
  _count: {
    cotizaciones: number;
  };
}

export interface SolicitudPayload {
  id_maquina: string;
  tipo_servicio: TipoServicio;
  descripcion: string;
  prioridad?: Prioridad;
  id_programacion?: string | null;
}

export interface ActualizarSolicitudPayload {
  descripcion?: string;
  prioridad?: Prioridad;
}

export interface ListaSolicitudes extends Paginado {
  solicitudes: Solicitud[];
}

// ==================== DIAGNOSTICOS ====================

export interface Diagnostico {
  id_diagnostico: string;
  id_solicitud: string;
  id_maquina: string;
  id_tecnico: string;
  estado_general: EstadoGeneral;
  fallas_detectadas: string;
  observaciones: string | null;
  recomendaciones: string | null;
  fecha: string;
  actualizado_en: string;
  solicitud: ResumenSolicitud;
  maquina: ResumenMaquina;
  tecnico: ResumenUsuario;
}

export interface DiagnosticoDetalle extends Diagnostico {
  orden_trabajo: ResumenOrden | null;
  adjuntos: Array<{
    id_adjunto: string;
    nombre_original: string;
    tipo_mime: string | null;
    tamano_bytes: number | null;
    subido_en: string;
  }>;
}

export interface DiagnosticoPayload {
  id_solicitud: string;
  estado_general: EstadoGeneral;
  fallas_detectadas: string;
  observaciones?: string | null;
  recomendaciones?: string | null;
}

export interface ListaDiagnosticos extends Paginado {
  diagnosticos: Diagnostico[];
}

// ==================== COTIZACIONES ====================

export interface CotizacionDetalleLinea {
  id_detalle: string;
  id_cotizacion: string;
  tipo: TipoItem;
  descripcion: string;
  id_material: string | null;
  cantidad: string;
  precio_unitario: string;
  subtotal?: string;
}

export interface Cotizacion {
  id_cotizacion: string;
  codigo: string | null;
  id_solicitud: string;
  id_usuario: string;
  total: string;
  observaciones: string | null;
  fecha: string;
  actualizado_en: string;
  solicitud: ResumenSolicitud;
  usuario: ResumenUsuario;
}

export interface CotizacionDetalle extends Cotizacion {
  detalles: CotizacionDetalleLinea[];
}

export interface LineaCotizacionPayload {
  tipo: TipoItem;
  descripcion?: string;
  id_material?: string;
  cantidad: number;
  precio_unitario?: number;
}

export interface CotizacionPayload {
  id_solicitud: string;
  observaciones?: string | null;
  detalles: LineaCotizacionPayload[];
}

export interface ActualizarCotizacionPayload {
  observaciones?: string | null;
  detalles?: LineaCotizacionPayload[];
}

export interface ListaCotizaciones extends Paginado {
  cotizaciones: Cotizacion[];
}

// ==================== ORDENES ====================

export interface OrdenMaterial {
  id_orden_material: string;
  id_orden_trabajo: string;
  id_material: string;
  cantidad: string;
  precio_unitario: string | null;
  subtotal: string | null;
  material: {
    codigo: string | null;
    nombre: string;
    unidad: string;
  };
}

export interface OrdenTrabajo {
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
  tecnico: ResumenUsuario;
}

export interface OrdenDetalle extends OrdenTrabajo {
  solicitud: Solicitud;
  diagnostico: ResumenDiagnostico | null;
  materiales: OrdenMaterial[];
}

export interface OrdenPayload {
  id_solicitud: string;
  id_tecnico: string;
  monto?: number;
}

export interface FinalizarOrdenPayload {
  trabajo_realizado: string;
  monto?: number;
}

export interface OrdenMaterialPayload {
  id_material: string;
  cantidad: number;
}

export interface ListaOrdenes extends Paginado {
  ordenes: OrdenTrabajo[];
}

// ==================== PREVENTIVOS ====================

export interface EstadoMantenimiento {
  estado: EstadoPreventivo;
  dias_restantes: number | null;
  horas_restantes: number | null;
}

export interface Preventivo {
  id_programacion: string;
  id_maquina: string;
  descripcion: string;
  frecuencia_horas: number | null;
  frecuencia_dias: number | null;
  dias_aviso: number;
  horas_aviso: string;
  horas_ultimo_mant: string | null;
  fecha_ultimo_mant: string | null;
  proximo_mant: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  maquina: ResumenMaquina & {
    horas_uso: string;
  };
  estado_mantenimiento: EstadoMantenimiento;
}

export interface PreventivoPayload {
  id_maquina: string;
  descripcion: string;
  frecuencia_horas?: number | null;
  frecuencia_dias?: number | null;
  dias_aviso?: number;
  horas_aviso?: number;
  horas_ultimo_mant?: number;
  fecha_ultimo_mant?: string;
}

export interface ActualizarPreventivoPayload {
  descripcion?: string;
  frecuencia_horas?: number | null;
  frecuencia_dias?: number | null;
  dias_aviso?: number;
  horas_aviso?: number;
  activo?: boolean;
}

export interface ListaPreventivos {
  preventivos: Preventivo[];
  total: number;
}

// ==================== USO ====================

export interface RegistroUso {
  id_registro_uso: string;
  id_maquina: string;
  id_usuario_registrado: string;
  horas: string;
  fecha: string;
  creado_en: string;
  maquina: ResumenMaquina;
  usuario: {
    id_usuario: string;
    nombres: string;
    apellidos: string;
  };
  horas_uso_maquina?: string;
}

export interface ListaRegistrosUso {
  registros: RegistroUso[];
  total: number;
}

export interface RegistrarUsoPayload {
  id_maquina: string;
  horas: number;
  fecha?: string;
}

export interface ActualizarUsoPayload {
  horas?: number;
  fecha?: string;
}

// ==================== USUARIOS ====================

export interface UsuarioAdmin {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  creado_en: string;
}

export interface CrearUsuarioPayload {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  rol: RolUsuario;
}

export interface ActualizarUsuarioPayload {
  nombres?: string;
  apellidos?: string;
  rol?: RolUsuario;
  activo?: boolean;
  password?: string;
}

export interface ListaUsuarios extends Paginado {
  usuarios: UsuarioAdmin[];
}

// ==================== REPORTES ====================

export interface ResumenReporte {
  solicitudes: {
    total: number;
    finalizadas: number;
    en_proceso: number;
    tasa_finalizacion: number;
  };
  ordenes: {
    finalizadas: number;
    ingreso_total: number;
  };
  maquinas_activas: number;
  clientes_activos: number;
}

export interface IngresoMes {
  mes: string;
  total: number;
}

export interface SolicitudEstadoItem {
  estado: EstadoSolicitud;
  cantidad: number;
}

export interface RespuestaSolicitudesPorEstado {
  data: SolicitudEstadoItem[];
  total: number;
}

export interface SolicitudTipoItem {
  tipo: TipoServicio;
  cantidad: number;
}

export interface SolicitudPrioridadItem {
  prioridad: Prioridad;
  cantidad: number;
}

export interface SolicitudTecnicoItem {
  tecnico: ResumenUsuario | null;
  cantidad: number;
}

export interface SolicitudClienteItem {
  cliente: ResumenCliente | { id_cliente: null; razon_social: string } | null;
  cantidad: number;
}

export interface TiempoPromedio {
  promedio_dias: number;
  total: number;
}

export interface MaterialUsado {
  id_material: string;
  cantidad: number;
  nombre: string;
  codigo: string | null;
}

export interface TecnicoRendimiento {
  tecnico: {
    id_usuario: string;
    nombre: string;
  };
  ordenes_finalizadas: number;
  tiempo_promedio_dias: number;
  monto_total: number;
}

export type ReporteExportable =
  | "solicitudes-por-estado"
  | "solicitudes-por-tecnico"
  | "solicitudes-por-cliente"
  | "solicitudes-por-tipo"
  | "solicitudes-por-prioridad"
  | "tiempo-promedio-diagnostico"
  | "tiempo-promedio-orden"
  | "materiales-mas-usados"
  | "ingresos-por-mes"
  | "tecnicos-rendimiento"
  | "resumen";

export interface FiltrosAdmin {
  q?: string;
  estado?: string;
  activo?: string;
  pagina?: number;
  limite?: number;
  [clave: string]: string | number | boolean | undefined;
}

/** Helper local para no repetir el tipo de `cliente` en varias vistas. */
export type ClienteAdmin = Cliente;
