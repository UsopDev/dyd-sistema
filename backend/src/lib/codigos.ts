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

/**
 * Genera un código alfanumérico de 6 caracteres único para materiales.
 * Usa caracteres A-Z y 0-9 (sin O, I, 0, 1 para evitar confusiones).
 */
const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function generarCodigoMaterial(): Promise<string> {
  const MAX_INTENTOS = 10;

  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    let codigo = "";
    for (let i = 0; i < 6; i++) {
      codigo += CARACTERES[Math.floor(Math.random() * CARACTERES.length)];
    }

    const existe = await prisma.material.findUnique({ where: { codigo } });
    if (!existe) {
      return codigo;
    }
  }

  throw new Error("No se pudo generar un código único para el material tras varios intentos");
}