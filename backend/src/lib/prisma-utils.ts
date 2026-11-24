/**
 * Utilidades para trabajar con Prisma y exactOptionalPropertyTypes: true
 */

/**
 * Filtra propiedades undefined de un objeto.
 * Usar con type assertion al tipo de input de Prisma correspondiente.
 */
export function filtrarUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

/**
 * Versión para update - filtra undefined y retorna Partial
 */
export function filtrarUndefinedUpdate<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
