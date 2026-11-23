import { Router } from "express";
import type { Response } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { HASH_FALSO, verifyPassword } from "../../lib/passwords.js";
import { COOKIE_ACCESO, firmarAccessToken, type Rol, type SesionUsuario } from "../../lib/jwt.js";
import {
  DIAS_REFRESH,
  consumirRefreshToken,
  crearRefreshToken,
  revocarRefreshToken,
} from "../../lib/refresh-tokens.js";
import { requireAuth } from "../../middleware/auth.js";
import { env } from "../../config/env.js";

export const authRouter = Router();

const COOKIE_REFRESCO = "refresh_token";
const RUTA_REFRESCO = "/api/auth";

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

// Solo cuentan los intentos fallidos: un login correcto no consume el límite.
const limitadorRefresh = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de refresco. Intenta de nuevo más tarde." },
});

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiados intentos fallidos. Intenta de nuevo en unos minutos." },
});

interface UsuarioSesion {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: Rol;
}

function datosUsuario(usuario: UsuarioSesion) {
  return {
    id_usuario: usuario.id_usuario,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    rol: usuario.rol,
  };
}

async function iniciarSesion(res: Response, usuario: UsuarioSesion): Promise<void> {
  const accessToken = firmarAccessToken({ id: usuario.id_usuario, rol: usuario.rol });
  const refreshToken = await crearRefreshToken(usuario.id_usuario);

  res.cookie(COOKIE_ACCESO, accessToken, {
    ...opcionesCookie,
    maxAge: env.JWT_ACCESS_MINUTES * 60 * 1000,
  });
  res.cookie(COOKIE_REFRESCO, refreshToken, {
    ...opcionesCookie,
    path: RUTA_REFRESCO,
    maxAge: DIAS_REFRESH * 24 * 60 * 60 * 1000,
  });
}

function limpiarCookies(res: Response): void {
  res.clearCookie(COOKIE_ACCESO, opcionesCookie);
  res.clearCookie(COOKIE_REFRESCO, { ...opcionesCookie, path: RUTA_REFRESCO });
}

authRouter.post("/login", limitadorLogin, async (req, res) => {
  const datos = loginSchema.safeParse(req.body);

  if (!datos.success) {
    res.status(400).json({
      error: "Datos inválidos",
      detalles: z.flattenError(datos.error).fieldErrors,
    });
    return;
  }

  const { email, password } = datos.data;
  const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });

  const passwordValida = await verifyPassword(password, usuario?.password_hash ?? HASH_FALSO);

  if (!usuario || !usuario.activo || !passwordValida) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  await iniciarSesion(res, usuario);
  res.json({ usuario: datosUsuario(usuario) });
});

authRouter.post("/refresh", limitadorRefresh, async (req, res) => {
  const token: string | undefined = req.cookies?.[COOKIE_REFRESCO];
  const sesion = res.locals.sesion as SesionUsuario | undefined;

  if (!token || !sesion) {
    limpiarCookies(res);
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }

  const valido = await consumirRefreshToken(token, sesion.id);

  if (!valido) {
    limpiarCookies(res);
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }

  const usuario = await prisma.usuario.findUnique({ where: { id_usuario: sesion.id } });

  if (!usuario || !usuario.activo) {
    limpiarCookies(res);
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }

  await iniciarSesion(res, usuario);
  res.json({ usuario: datosUsuario(usuario) });
});

authRouter.get("/me", requireAuth, async (_req, res) => {
  const sesion = res.locals.sesion as SesionUsuario;
  const usuario = await prisma.usuario.findUnique({ where: { id_usuario: sesion.id } });

  if (!usuario || !usuario.activo) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  res.json({ usuario: datosUsuario(usuario) });
});

authRouter.post("/logout", async (req, res) => {
  const token: string | undefined = req.cookies?.[COOKIE_REFRESCO];
  const sesion = res.locals.sesion as SesionUsuario | undefined;

  if (token && sesion) {
    await revocarRefreshToken(token, sesion.id);
  }

  limpiarCookies(res);
  res.status(204).end();
});
