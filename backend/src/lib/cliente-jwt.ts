import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface SesionCliente {
  id: string;
  email: string;
}

export const COOKIE_CLIENTE_ACCESO = "cliente_access_token";
export const COOKIE_CLIENTE_REFRESCO = "cliente_refresh_token";
export const RUTA_CLIENTE_REFRESCO = "/api/cliente/auth";

const DIAS_REFRESH = 30;

export function firmarClienteAccessToken(cliente: SesionCliente): string {
  return jwt.sign(
    { email: cliente.email, tipo: "cliente" },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: "HS256",
      subject: cliente.id,
      expiresIn: env.JWT_ACCESS_MINUTES * 60,
    },
  );
}

export function verificarClienteAccessToken(token: string): SesionCliente | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !payload.sub) return null;
    if (payload.tipo !== "cliente") return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

// Refresh tokens para clientes (reutilizamos la lógica existente pero con prefijo cliente)
import { prisma } from "./prisma.js";
import { createHash, randomBytes } from "node:crypto";

const HASH_PREFIX = "cliente_rt_";

function hashToken(token: string): string {
  return HASH_PREFIX + createHash("sha256").update(token).digest("hex");
}

export async function crearClienteRefreshToken(idCliente: string): Promise<string> {
  const token = randomBytes(48).toString("base64url");
  const hash = hashToken(token);
  const expiraEn = new Date(Date.now() + DIAS_REFRESH * 24 * 60 * 60 * 1000);

  await prisma.clienteRefreshToken.create({
    data: {
      id_cliente: idCliente,
      token_hash: hash,
      expira_en: expiraEn,
    },
  });

  return token;
}

export async function consumirClienteRefreshToken(token: string): Promise<string | null> {
  const hash = hashToken(token);
  const rt = await prisma.clienteRefreshToken.findUnique({ where: { token_hash: hash } });

  if (!rt || rt.revocado_en || rt.expira_en < new Date()) {
    return null;
  }

  // updateMany con revocado_en: null evita que dos refrescos simultáneos
  // consuman el mismo token.
  const consumido = await prisma.clienteRefreshToken.updateMany({
    where: { token_hash: hash, revocado_en: null },
    data: { revocado_en: new Date() },
  });

  return consumido.count === 1 ? rt.id_cliente : null;
}

export async function revocarClienteRefreshToken(token: string): Promise<void> {
  const hash = hashToken(token);
  await prisma.clienteRefreshToken.updateMany({
    where: { token_hash: hash },
    data: { revocado_en: new Date() },
  });
}

export async function revocarTodosClienteRefreshTokens(idCliente: string): Promise<void> {
  await prisma.clienteRefreshToken.updateMany({
    where: { id_cliente: idCliente, revocado_en: null },
    data: { revocado_en: new Date() },
  });
}
