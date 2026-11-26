import type { EstadoSolicitud } from "@prisma/client";

/**
 * Mapa de transiciones válidas entre estados de la solicitud.
 * 
 * Diagrama:
 * RECIBIDA → EN_DIAGNOSTICO → COTIZADA → ASIGNADA → EN_PROCESO → FINALIZADA
 *     ↓              ↓            ↓          ↓
 * CANCELADA      CANCELADA    CANCELADA  CANCELADA
 * 
 * REGLAS DE NEGOCIO:
 * - Solo se puede editar en RECIBIDA
 * - Solo se puede cancelar desde: RECIBIDA, EN_DIAGNOSTICO, COTIZADA, ASIGNADA
 * - FINALIZADA es estado terminal (no sale)
 * - CANCELADA es estado terminal (no sale)
 */

export type EstadoSolicitud = 
  | "RECIBIDA"
  | "EN_DIAGNOSTICO"
  | "COTIZADA"
  | "ASIGNADA"
  | "EN_PROCESO"
  | "FINALIZADA"
  | "CANCELADA";

/** Transiciones válidas: origen → [destinos permitidos] */
export const TRANSICIONES_PERMITIDAS: Record<EstadoSolicitud, EstadoSolicitud[]> = {
  RECIBIDA: ["EN_DIAGNOSTICO", "CANCELADA"],
  EN_DIAGNOSTICO: ["COTIZADA", "CANCELADA"],
  COTIZADA: ["ASIGNADA", "CANCELADA"],
  ASIGNADA: ["EN_PROCESO", "CANCELADA"],
  EN_PROCESO: ["FINALIZADA"],
  FINALIZADA: [],                    // Estado terminal
  CANCELADA: [],                     // Estado terminal
};

/** Estados desde los cuales se puede CANCELAR */
export const ESTADOS_CANCELABLES: EstadoSolicitud[] = [
  "RECIBIDA",
  "EN_DIAGNOSTICO",
  "COTIZADA",
  "ASIGNADA",
];

/** Estados en los cuales se puede EDITAR (solo RECIBIDA) */
export const ESTADOS_EDITABLES: EstadoSolicitud[] = ["RECIBIDA"];

/** Estados FINALES (no tienen salidas) */
export const ESTADOS_TERMINALES: EstadoSolicitud[] = ["FINALIZADA", "CANCELADA"];

/**
 * Verifica si una transición de estado es válida.
 * @param origen Estado actual
 * @param destino Estado propuesto
 * @returns true si la transición está permitida
 */
export function esTransicionValida(origen: EstadoSolicitud, destino: EstadoSolicitud): boolean {
  const permitidas = TRANSICIONES_PERMITIDAS[origen] ?? [];
  return permitidas.includes(destino);
}

/**
 * Verifica si una solicitud puede ser cancelada desde su estado actual.
 */
export function sePuedeCancelar(estado: EstadoSolicitud): boolean {
  return ESTADOS_CANCELABLES.includes(estado);
}

/**
 * Verifica si una solicitud puede ser editada (solo en RECIBIDA).
 */
export function sePuedeEditar(estado: EstadoSolicitud): boolean {
  return ESTADOS_EDITABLES.includes(estado);
}

/**
 * Verifica si un estado es terminal (no tiene salidas).
 */
export function esEstadoTerminal(estado: EstadoSolicitud): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}

/**
 * Obtiene las transiciones posibles desde un estado.
 */
export function obtenerTransicionesPosibles(origen: EstadoSolicitud): EstadoSolicitud[] {
  return TRANSICIONES_PERMITIDAS[origen] ?? [];
}
