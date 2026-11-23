import { createHash, randomBytes } from "node:crypto";
import { redis } from "./redis.js";

export const DIAS_REFRESH = 7;

const PREFIJO = "refresh:";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function key(idUsuario: string, token: string): string {
  return `${PREFIJO}${idUsuario}:${hashToken(token)}`;
}

// Crea un token aleatorio opaco. En Redis se guarda con key "refresh:{userId}:{hash}"
// para permitir revocación eficiente por usuario.
export async function crearRefreshToken(idUsuario: string): Promise<string> {
  const token = randomBytes(48).toString("hex");
  await redis.set(key(idUsuario, token), "1", "EX", DIAS_REFRESH * 24 * 60 * 60);
  return token;
}

// Lee y borra el token en una sola operación atómica: cada token sirve una sola vez.
export async function consumirRefreshToken(token: string, idUsuario: string): Promise<boolean> {
  const result = await redis.getdel(key(idUsuario, token));
  return result === "1";
}

// Revoca un token específico (logout)
export async function revocarRefreshToken(token: string, idUsuario: string): Promise<void> {
  await redis.del(key(idUsuario, token));
}

// Revoca TODOS los refresh tokens de un usuario (cambio password/rol)
export async function revocarTodosRefreshTokens(idUsuario: string): Promise<number> {
  const keys = await redis.keys(`${PREFIJO}${idUsuario}:*`);
  if (keys.length === 0) return 0;
  return redis.del(...keys);
}