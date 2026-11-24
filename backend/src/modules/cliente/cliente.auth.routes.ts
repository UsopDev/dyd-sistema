import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { verifyPassword } from "../../lib/passwords.js";

import type { CookieOptions } from "express";

interface CookieResponse extends Response {
  cookie(name: string, val: string, options: CookieOptions): this;
  cookie(name: string, val: any, options: CookieOptions): this;
  cookie(name: string, val: any): this;
  clearCookie(name: string, options?: CookieOptions): this;
}
import {
  COOKIE_CLIENTE_ACCESO,
  COOKIE_CLIENTE_REFRESCO,
  RUTA_CLIENTE_REFRESCO,
  firmarClienteAccessToken,
  verificarClienteAccessToken,
  crearClienteRefreshToken,
  consumirClienteRefreshToken,
  revocarClienteRefreshToken,
} from "../../lib/cliente-jwt.js";
import { rateLimit } from "express-rate-limit";
import { env } from "../../config/env.js";

export const clienteAuthRouter = Router();

const loginSchema = z.object({
  email: z.email().max(120),
  password: z.string().min(1).max(200),
});

const esProduccion = env.NODE_ENV === "production";

const opcionesCookie = {
  httpOnly: true,
  sameSite: (esProduccion ? "none" : "lax") as "lax" | "none",
  secure: esProduccion,
  path: "/",
};

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiados intentos fallidos. Intenta de nuevo en unos minutos." },
});

const limitadorRefresh = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de refresco. Intenta de nuevo más tarde." },
});

async function iniciarSesionCliente(res: CookieResponse, cliente: { id_cliente: string; email: string }) {
  const accessToken = firmarClienteAccessToken({ id: cliente.id_cliente, email: cliente.email });
  const refreshToken = await crearClienteRefreshToken(cliente.id_cliente);

  res.cookie(COOKIE_CLIENTE_ACCESO, accessToken, {
    ...opcionesCookie,
    maxAge: env.JWT_ACCESS_MINUTES * 60 * 1000,
  });
  res.cookie(COOKIE_CLIENTE_REFRESCO, refreshToken, {
    ...opcionesCookie,
    path: RUTA_CLIENTE_REFRESCO,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  });
}

function limpiarCookiesCliente(res: CookieResponse) {
  res.clearCookie(COOKIE_CLIENTE_ACCESO, opcionesCookie);
  res.clearCookie(COOKIE_CLIENTE_REFRESCO, { ...opcionesCookie, path: RUTA_CLIENTE_REFRESCO });
}

/**
 * POST /api/cliente/auth/login
 * Login de cliente
 */
clienteAuthRouter.post("/login", limitadorLogin, async (req, res) => {
  const datos = loginSchema.safeParse(req.body);
  if (!datos.success) {
    res.status(400).json({
      error: "Datos inválidos",
      detalles: z.flattenError(datos.error).fieldErrors,
    });
    return;
  }

  const { email, password } = datos.data;
  const cliente = await prisma.cliente.findUnique({ where: { email: email.toLowerCase() } });

  if (!cliente || !cliente.activo || !cliente.email || !cliente.password_hash) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const passwordValida = await verifyPassword(password, cliente.password_hash);

  if (!passwordValida) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  await iniciarSesionCliente(res, { id_cliente: cliente.id_cliente, email: cliente.email });
  res.json({
    cliente: {
      id_cliente: cliente.id_cliente,
      razon_social: cliente.razon_social,
      email: cliente.email,
      contacto: cliente.contacto,
    },
  });
});

/**
 * POST /api/cliente/auth/refresh
 * Refrescar access token
 */
clienteAuthRouter.post("/refresh", limitadorRefresh, async (req, res) => {
  const token: string | undefined = req.cookies?.[COOKIE_CLIENTE_REFRESCO];

  const idCliente = token ? await consumirClienteRefreshToken(token) : null;

  if (!idCliente) {
    limpiarCookiesCliente(res);
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }

  const cliente = await prisma.cliente.findUnique({ where: { id_cliente: idCliente } });

  if (!cliente || !cliente.activo || !cliente.email) {
    limpiarCookiesCliente(res);
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }

  await iniciarSesionCliente(res, { id_cliente: cliente.id_cliente, email: cliente.email });
  res.json({
    cliente: {
      id_cliente: cliente.id_cliente,
      razon_social: cliente.razon_social,
      email: cliente.email,
      contacto: cliente.contacto,
    },
  });
});

/**
 * GET /api/cliente/auth/me
 * Obtener cliente actual
 */
clienteAuthRouter.get("/me", async (req, res) => {
  const token: string | undefined = req.cookies?.[COOKIE_CLIENTE_ACCESO];
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const sesion = verificarClienteAccessToken(token);
  if (!sesion) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id_cliente: sesion.id },
    select: { id_cliente: true, razon_social: true, email: true, contacto: true, telefono: true, direccion: true, activo: true },
  });

  if (!cliente || !cliente.activo || !cliente.email) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  res.json({ cliente });
});

/**
 * POST /api/cliente/auth/logout
 * Cerrar sesión
 */
clienteAuthRouter.post("/logout", async (req, res) => {
  const token: string | undefined = req.cookies?.[COOKIE_CLIENTE_REFRESCO];

  if (token) {
    await revocarClienteRefreshToken(token);
  }

  limpiarCookiesCliente(res);
  res.status(204).end();
});
