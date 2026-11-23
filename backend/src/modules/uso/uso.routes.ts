import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { aFecha, hoyLocal } from "../../lib/fechas.js";
import type { SesionUsuario } from "../../lib/jwt.js";

export const usoRouter = Router();

const crearSchema = z.object({
  id_maquina: z.uuid(),
  horas: z
    .number()
    .positive()
    .max(24)
    .refine((h) => Math.abs(h * 10 - Math.round(h * 10)) < 1e-9, { message: "Máximo un decimal" }),
  fecha: z.iso.date().optional(),
});

const actualizarSchema = z
  .object({
    horas: z
      .number()
      .positive()
      .max(24)
      .refine((h) => Math.abs(h * 10 - Math.round(h * 10)) < 1e-9, { message: "Máximo un decimal" })
      .optional(),
    fecha: z.iso.date().optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" });

const listarSchema = z.object({
  id_maquina: z.uuid().optional(),
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

const idSchema = z.object({ id: z.uuid() });

const resumen = {
  maquina: { select: { id_maquina: true, codigo: true, nombre: true } },
  usuario: { select: { id_usuario: true, nombres: true, apellidos: true } },
} as const;

usoRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res);
  if (!filtros) return;

  const where = {
    ...(filtros.id_maquina ? { id_maquina: filtros.id_maquina } : {}),
    ...(filtros.desde || filtros.hasta
      ? {
          fecha: {
            ...(filtros.desde ? { gte: aFecha(filtros.desde) } : {}),
            ...(filtros.hasta ? { lte: aFecha(filtros.hasta) } : {}),
          },
        }
      : {}),
  };

  const [registros, total] = await Promise.all([
    prisma.registroUso.findMany({
      where,
      include: resumen,
      orderBy: [{ fecha: "desc" }, { creado_en: "desc" }],
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.registroUso.count({ where }),
  ]);

  res.json({ registros, total, pagina: filtros.pagina, limite: filtros.limite });
});

usoRouter.post("/", async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const sesion = res.locals.sesion as SesionUsuario;
  const fecha = datos.fecha ?? hoyLocal();

  if (fecha > hoyLocal()) {
    res.status(400).json({ error: "La fecha del registro no puede ser futura" });
    return;
  }

  const maquina = await prisma.maquina.findUnique({
    where: { id_maquina: datos.id_maquina },
    select: { id_maquina: true },
  });

  if (!maquina) {
    res.status(400).json({ error: "La máquina indicada no existe" });
    return;
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const registro = await tx.registroUso.create({
      data: {
        id_maquina: maquina.id_maquina,
        id_usuario_registrado: sesion.id,
        horas: datos.horas,
        fecha: aFecha(fecha),
      },
      include: resumen,
    });

    const actualizada = await tx.maquina.update({
      where: { id_maquina: maquina.id_maquina },
      data: { horas_uso: { increment: datos.horas } },
      select: { horas_uso: true },
    });

    return { registro, horas_uso: actualizada.horas_uso };
  });

  res.status(201).json(resultado);
});

// PATCH /:id - Editar registro de uso (solo autor o ADMIN)
usoRouter.patch("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const existente = await prisma.registroUso.findUnique({
    where: { id_registro_uso: params.id },
    select: { id_registro_uso: true, id_maquina: true, id_usuario_registrado: true, horas: true, fecha: true },
  });

  if (!existente) {
    res.status(404).json({ error: "Registro de uso no encontrado" });
    return;
  }

  if (sesion.rol !== "ADMINISTRADOR" && existente.id_usuario_registrado !== sesion.id) {
    res.status(403).json({ error: "Solo el autor o un administrador puede editar este registro" });
    return;
  }

  const fechaNueva = datos.fecha ?? existente.fecha.toISOString().slice(0, 10);

  if (fechaNueva > hoyLocal()) {
    res.status(400).json({ error: "La fecha del registro no puede ser futura" });
    return;
  }

  const horasNuevas = datos.horas ?? Number(existente.horas);
  const diffHoras = horasNuevas - Number(existente.horas);

  const actualizado = await prisma.$transaction(async (tx) => {
    const registro = await tx.registroUso.update({
      where: { id_registro_uso: params.id },
      data: {
        ...(datos.horas !== undefined ? { horas: datos.horas } : {}),
        ...(datos.fecha !== undefined ? { fecha: aFecha(fechaNueva) } : {}),
      },
      include: resumen,
    });

    if (diffHoras !== 0) {
      await tx.maquina.update({
        where: { id_maquina: existente.id_maquina },
        data: { horas_uso: { increment: diffHoras } },
      });
    }

    const maquina = await tx.maquina.findUnique({
      where: { id_maquina: existente.id_maquina },
      select: { horas_uso: true },
    });

    return { registro, horas_uso: maquina?.horas_uso };
  });

  res.json(actualizado);
});

// DELETE /:id - Eliminar registro de uso (solo autor o ADMIN)
usoRouter.delete("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const existente = await prisma.registroUso.findUnique({
    where: { id_registro_uso: params.id },
    select: { id_registro_uso: true, id_maquina: true, id_usuario_registrado: true, horas: true },
  });

  if (!existente) {
    res.status(404).json({ error: "Registro de uso no encontrado" });
    return;
  }

  if (sesion.rol !== "ADMINISTRADOR" && existente.id_usuario_registrado !== sesion.id) {
    res.status(403).json({ error: "Solo el autor o un administrador puede eliminar este registro" });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.registroUso.delete({ where: { id_registro_uso: params.id } });

    await tx.maquina.update({
      where: { id_maquina: existente.id_maquina },
      data: { horas_uso: { decrement: Number(existente.horas) } },
    });
  });

  res.status(204).end();
});