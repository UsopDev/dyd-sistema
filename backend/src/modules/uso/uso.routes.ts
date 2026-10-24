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

const listarSchema = z.object({
  id_maquina: z.uuid().optional(),
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

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

  // El registro y la suma a las horas de la máquina van juntos: nunca quedan desfasados.
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
