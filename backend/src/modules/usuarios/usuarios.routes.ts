import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../../lib/passwords.js";
import { validar } from "../../lib/validar.js";
import type { SesionUsuario } from "../../lib/jwt.js";
import { whereRangoFecha, rangosFechaCampos } from "../../lib/filtros.js";
import type { RolUsuario } from "@prisma/client";

export const usuariosRouter = Router();

// Nunca se devuelve password_hash.
const seleccion = {
  id_usuario: true,
  nombres: true,
  apellidos: true,
  email: true,
  rol: true,
  activo: true,
  creado_en: true,
} as const;

const rolSchema = z.enum(["ADMINISTRADOR", "TECNICO"]);

const idSchema = z.object({ id: z.uuid() });

const crearSchema = z.object({
  nombres: z.string().trim().min(1).max(80),
  apellidos: z.string().trim().min(1).max(80),
  email: z.email().max(120),
  password: z.string().min(8).max(200),
  rol: rolSchema,
});

const actualizarSchema = z
  .object({
    nombres: z.string().trim().min(1).max(80).optional(),
    apellidos: z.string().trim().min(1).max(80).optional(),
    rol: rolSchema.optional(),
    activo: z.boolean().optional(),
    password: z.string().min(8).max(200).optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" });

const listarSchema = z.object({
  q: z.string().trim().max(100).optional(),
  rol: rolSchema.optional(),
  activo: z.enum(["true", "false"]).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
}).merge(
  rangosFechaCampos("creado_en", "actualizado_en"),
);

usuariosRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res) as
    z.output<typeof listarSchema> & {
      creado_en_desde?: string;
      creado_en_hasta?: string;
      actualizado_en_desde?: string;
      actualizado_en_hasta?: string;
      pagina: number;
      limite: number;
    };
  if (!filtros) return;

  const where = {
    ...(filtros.rol ? { rol: filtros.rol as RolUsuario } : {}),
    ...(filtros.activo ? { activo: filtros.activo === "true" } : {}),
    ...whereRangoFecha("creado_en", filtros.creado_en_desde, filtros.creado_en_hasta),
    ...whereRangoFecha("actualizado_en", filtros.actualizado_en_desde, filtros.actualizado_en_hasta),
    ...(filtros.q
      ? {
          OR: [
            { nombres: { contains: filtros.q, mode: "insensitive" as const } },
            { apellidos: { contains: filtros.q, mode: "insensitive" as const } },
            { email: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      select: seleccion,
      orderBy: { creado_en: "asc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.usuario.count({ where }),
  ]);

  res.json({ usuarios, total, pagina: filtros.pagina, limite: filtros.limite });
});

usuariosRouter.post("/", async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const email = datos.email.toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { email } });

  if (existente) {
    res.status(409).json({ error: "Ya existe un usuario con ese correo" });
    return;
  }

  const usuario = await prisma.usuario.create({
    data: {
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      email,
      password_hash: await hashPassword(datos.password),
      rol: datos.rol,
    },
    select: seleccion,
  });

  res.status(201).json({ usuario });
});

usuariosRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: params.id },
    select: seleccion,
  });

  if (!usuario) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json({ usuario });
});

usuariosRouter.patch("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const cuerpo = validar(actualizarSchema, req.body, res);
  if (!cuerpo) return;

  const sesion = res.locals.sesion as SesionUsuario;
  const cambiaSuRol = cuerpo.rol !== undefined && cuerpo.rol !== sesion.rol;

  if (params.id === sesion.id && (cuerpo.activo === false || cambiaSuRol)) {
    res.status(400).json({ error: "No puedes desactivar tu cuenta ni cambiar tu propio rol" });
    return;
  }

  const existente = await prisma.usuario.findUnique({ where: { id_usuario: params.id } });

  if (!existente) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const { password, ...resto } = cuerpo;

  const usuario = await prisma.usuario.update({
    where: { id_usuario: params.id },
    data: {
      ...resto,
      ...(password ? { password_hash: await hashPassword(password) } : {}),
    },
    select: seleccion,
  });

  res.json({ usuario });
});
