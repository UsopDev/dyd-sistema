import { prisma } from "./prisma.js";

const SECUENCIAS = {
  solicitud: { secuencia: "solicitud_seq", prefijo: "SOL" },
  cotizacion: { secuencia: "cotizacion_seq", prefijo: "COT" },
  orden: { secuencia: "orden_trabajo_seq", prefijo: "OT" },
} as const;

export type TipoCodigo = keyof typeof SECUENCIAS;

// nextval entrega números únicos aunque varias peticiones lleguen a la vez.
// El nombre de la secuencia sale de la tabla de arriba, nunca de datos del usuario.
export async function siguienteCodigo(tipo: TipoCodigo): Promise<string> {
  const { secuencia, prefijo } = SECUENCIAS[tipo];
  const filas = await prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
    `SELECT nextval('${secuencia}') AS n`,
  );
  const fila = filas[0];

  if (!fila) {
    throw new Error(`No se pudo obtener el siguiente número de ${secuencia}`);
  }

  return `${prefijo}-${new Date().getFullYear()}-${String(fila.n).padStart(5, "0")}`;
}
