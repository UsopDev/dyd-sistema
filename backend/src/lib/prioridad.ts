import type { Prioridad } from "@prisma/client";

/**
 * Reglas de negocio para asignar la prioridad de una solicitud.
 *
 * La prioridad se calcula SIEMPRE en el servidor: el cliente puede pedir una
 * prioridad concreta, pero el servidor es la única autoridad que decide la
 * prioridad final. Así ningún usuario puede alterarla (requisito del proyecto).
 *
 * Criterios, del más al menos urgente:
 *  1. La máquina es propia de DYD y está fuera de servicio -> ALTA.
 *  2. La máquina del cliente está fuera de servicio       -> ALTA.
 *  3. La máquina está en mantenimiento                      -> sube un nivel.
 *  4. El servicio es correctivo (falla activa)             -> sube un nivel.
 *  5. El preventivo está vencido                           -> sube un nivel.
 *  6. En cualquier otro caso                               -> MEDIA.
 */

const ORDEN: Prioridad[] = ["BAJA", "MEDIA", "ALTA"];

function subir(prioridad: Prioridad, niveles = 1): Prioridad {
  const indice = ORDEN.indexOf(prioridad);
  const nuevo = Math.min(ORDEN.length - 1, Math.max(0, indice + niveles));
  return ORDEN[nuevo];
}

export interface ContextoPrioridad {
  /** La máquina atendida pertenece a DYD (no a un cliente). */
  esPropia: boolean;
  /** Estado actual de la máquina. */
  estadoMaquina: "OPERATIVA" | "EN_MANTENIMIENTO" | "FUERA_DE_SERVICIO";
  /** Tipo de servicio solicitado. */
  tipoServicio: "PREVENTIVO" | "CORRECTIVO";
  /** Próximo mantenimiento de la programación preventiva, si aplica. */
  proximoMantenimiento?: Date | null;
  /** Prioridad sugerida por quien registra la solicitud. */
  prioridadSugerida?: Prioridad | null;
}

/** Sube la prioridad si la fecha de mantenimiento preventivo ya venció. */
function preventivoVencido(proximoMantenimiento?: Date | null): boolean {
  if (!proximoMantenimiento) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return proximoMantenimiento.getTime() < hoy.getTime();
}

/**
 * Calcula la prioridad final de una solicitud aplicando los criterios del
 * proyecto. La prioridad sugerida por el usuario solo se usa como piso: el
 * servidor siempre puede elevarla, nunca bajarla por debajo de lo que las
 * reglas del dominio exigen.
 */
export function calcularPrioridad(contexto: ContextoPrioridad): Prioridad {
  let prioridad: Prioridad = contexto.prioridadSugerida ?? "MEDIA";

  // 1 y 2. Maquina fuera de servicio: prioridad maxima, sin importar el resto.
  if (contexto.estadoMaquina === "FUERA_DE_SERVICIO") {
    return "ALTA";
  }

  // 3. Maquina en mantenimiento: sube un nivel.
  if (contexto.estadoMaquina === "EN_MANTENIMIENTO") {
    prioridad = subir(prioridad);
  }

  // 4. Servicio correctivo: hay una falla activa.
  if (contexto.tipoServicio === "CORRECTIVO") {
    prioridad = subir(prioridad);
  }

  // 5. Preventivo vencido: el mantenimiento ya se paso de la fecha.
  if (preventivoVencido(contexto.proximoMantenimiento)) {
    prioridad = subir(prioridad);
  }

  // 6. Maquina propia de DYD: si se detiene, la empresa no puede atender pedidos.
  if (contexto.esPropia) {
    prioridad = subir(prioridad);
  }

  return prioridad;
}

/** Explicacion legible de por que una solicitud quedo con esa prioridad. */
export function explicarPrioridad(contexto: ContextoPrioridad): string[] {
  const motivos: string[] = [];

  if (contexto.estadoMaquina === "FUERA_DE_SERVICIO") {
    motivos.push("La máquina está fuera de servicio.");
  }
  if (contexto.estadoMaquina === "EN_MANTENIMIENTO") {
    motivos.push("La máquina está en mantenimiento.");
  }
  if (contexto.tipoServicio === "CORRECTIVO") {
    motivos.push("Es un servicio correctivo: hay una falla activa.");
  }
  if (preventivoVencido(contexto.proximoMantenimiento)) {
    motivos.push("El mantenimiento preventivo está vencido.");
  }
  if (contexto.esPropia) {
    motivos.push("La máquina es propia de DYD.");
  }

  return motivos;
}
