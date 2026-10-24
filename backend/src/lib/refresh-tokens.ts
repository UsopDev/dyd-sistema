import { createHash, randomBytes } from "node:crypto";
import { redis } from "./redis.js";

export const DIAS_REFRESH = 7;

const PREFIJO = "refresh:";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Crea un token aleatorio opaco. En Redis solo se guarda su hash, con vencimiento automático.
export async function crearRefreshToken(idUsuario: string): Promise<string> {
  const token = randomBytes(48).toString("hex");
  await redis.set(PREFIJO + hashToken(token), idUsuario, "EX", DIAS_REFRESH * 24 * 60 * 60);
  return token;
}

// Lee y borra el token en una sola operación atómica: cada token sirve una sola vez.
export async function consumirRefreshToken(token: string): Promise<string | null> {
  return redis.getdel(PREFIJO + hashToken(token));
}

export async function revocarRefreshToken(token: string): Promise<void> {
  await redis.del(PREFIJO + hashToken(token));
}
