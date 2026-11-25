export type RolUsuario = "ADMINISTRADOR" | "TECNICO";

export interface Usuario {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
}

export interface RespuestaLoginStaff {
  usuario: Usuario;
}

export interface RespuestaError {
  error: string;
  detalles?: Record<string, string[] | undefined>;
}

export type EstadoSolicitud =
  | "RECIBIDA"
  | "EN_DIAGNOSTICO"
  | "COTIZADA"
  | "ASIGNADA"
  | "EN_PROCESO"
  | "FINALIZADA"
  | "CANCELADA";

export type Prioridad = "ALTA" | "MEDIA" | "BAJA";

export type TipoServicio = "PREVENTIVO" | "CORRECTIVO";

export type EstadoOrden = "PENDIENTE" | "EN_PROCESO" | "FINALIZADA" | "CANCELADA";

export type EstadoMaquina = "OPERATIVA" | "EN_MANTENIMIENTO" | "FUERA_DE_SERVICIO";
