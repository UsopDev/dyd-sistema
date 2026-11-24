export type RolUsuario = "ADMINISTRADOR" | "TECNICO";

export interface Usuario {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
}

export interface ClienteSesion {
  id_cliente: string;
  razon_social: string;
  email: string | null;
  contacto: string | null;
  telefono?: string | null;
  direccion?: string | null;
  activo?: boolean;
}

export interface RespuestaLoginStaff {
  usuario: Usuario;
}

export interface RespuestaLoginCliente {
  cliente: ClienteSesion;
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
