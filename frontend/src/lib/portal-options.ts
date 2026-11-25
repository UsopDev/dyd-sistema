import {
  ETIQUETA_ESTADO_MAQUINA,
  ETIQUETA_ESTADO_ORDEN,
  ETIQUETA_ESTADO_SOLICITUD,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_SERVICIO,
} from "@/lib/admin-labels";
import type {
  EstadoMaquina,
  EstadoOrden,
  EstadoSolicitud,
  Prioridad,
  TipoServicio,
} from "@/types/admin";

const ESTADOS_SOLICITUD: EstadoSolicitud[] = [
  "RECIBIDA",
  "EN_DIAGNOSTICO",
  "COTIZADA",
  "ASIGNADA",
  "EN_PROCESO",
  "FINALIZADA",
  "CANCELADA",
];

const PRIORIDADES: Prioridad[] = ["ALTA", "MEDIA", "BAJA"];

const TIPOS_SERVICIO: TipoServicio[] = ["PREVENTIVO", "CORRECTIVO"];

const ESTADOS_ORDEN: EstadoOrden[] = [
  "PENDIENTE",
  "EN_PROCESO",
  "FINALIZADA",
  "CANCELADA",
];

const ESTADOS_MAQUINA: EstadoMaquina[] = [
  "OPERATIVA",
  "EN_MANTENIMIENTO",
  "FUERA_DE_SERVICIO",
];

export const OPCIONES_ESTADO_SOLICITUD = ESTADOS_SOLICITUD.map((value) => ({
  value,
  label: ETIQUETA_ESTADO_SOLICITUD[value],
}));

export const OPCIONES_PRIORIDAD = PRIORIDADES.map((value) => ({
  value,
  label: ETIQUETA_PRIORIDAD[value],
}));

export const OPCIONES_TIPO_SERVICIO = TIPOS_SERVICIO.map((value) => ({
  value,
  label: ETIQUETA_TIPO_SERVICIO[value],
}));

export const OPCIONES_ESTADO_ORDEN = ESTADOS_ORDEN.map((value) => ({
  value,
  label: ETIQUETA_ESTADO_ORDEN[value],
}));

export const OPCIONES_ESTADO_MAQUINA = ESTADOS_MAQUINA.map((value) => ({
  value,
  label: ETIQUETA_ESTADO_MAQUINA[value],
}));
