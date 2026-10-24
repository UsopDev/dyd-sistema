import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { HASH_FALSO, verifyPassword } from "../../lib/passwords.js";
import { COOKIE_ACCESO, firmarAccessToken, type SesionUsuario } from "../../lib/jwt.js";
import { requireAuth } from "../../middleware/auth.js";
import { env } from "../../config/env.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.email().max(120),
  password: z.string().min(1).max(200),
});

const opcionesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

authRouter.post("/login", async (req, res) => {
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

  const token = firmarAccessToken({ id: usuario.id_usuario, rol: usuario.rol });
  res.cookie(COOKIE_ACCESO, token, {
    ...opcionesCookie,
    maxAge: env.JWT_ACCESS_MINUTES * 60 * 1000,
  });

  res.json({
    usuario: {
      id_usuario: usuario.id_usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
    },
  });
});

authRouter.get("/me", requireAuth, async (_req, res) => {
  const sesion = res.locals.sesion as SesionUsuario;
  const usuario = await prisma.usuario.findUnique({ where: { id_usuario: sesion.id } });

  if (!usuario || !usuario.activo) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  res.json({
    usuario: {
      id_usuario: usuario.id_usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
    },
  });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_ACCESO, opcionesCookie);
  res.status(204).end();
});
