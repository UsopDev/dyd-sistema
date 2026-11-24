import { createHash, randomBytes } from "node:crypto";
import { redis } from "./redis.js";

export const DIAS_REFRESH = 7;

const PREFIJO = "refresh:";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function key(idUsuario: string, token: string): string {
  return `${PREFIJO}${idUsuario}:${hashToken(token)}`;
}

// El token incluye el id del usuario como prefijo para poder refrescar aunque
// el access token ya haya expirado. La key de Redis sigue ligada al hash del
// token completo, así que un token manipulado no encuentra la entrada.
function separarToken(token: string): { idUsuario: string } | null {
  const separador = token.indexOf(".");
  if (separador <= 0) return null;
  const idUsuario = token.slice(0, separador);
  return UUID_RE.test(idUsuario) ? { idUsuario } : null;
}

export async function crearRefreshToken(idUsuario: string): Promise<string> {
  const token = `${idUsuario}.${randomBytes(48).toString("hex")}`;
  await redis.set(key(idUsuario, token), "1", "EX", DIAS_REFRESH * 24 * 60 * 60);
  return token;
}

// Lee y borra el token en una sola operación atómica: cada token sirve una vez.
// Devuelve el id del usuario para que el llamador emita el nuevo par de tokens.
export async function consumirRefreshToken(token: string): Promise<string | null> {
  const datos = separarToken(token);
  if (!datos) return null;
  const result = await redis.getdel(key(datos.idUsuario, token));
  return result === "1" ? datos.idUsuario : null;
}

// Revoca un token específico (logout)
export async function revocarRefreshToken(token: string): Promise<void> {
  const datos = separarToken(token);
  if (!datos) return;
  await redis.del(key(datos.idUsuario, token));
}

// Revoca TODOS los refresh tokens de un usuario (cambio password/rol)
export async function revocarTodosRefreshTokens(idUsuario: string): Promise<number> {
  const keys = await redis.keys(`${PREFIJO}${idUsuario}:*`);
  if (keys.length === 0) return 0;
  return redis.del(...keys);
}
