import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import type { SesionUsuario } from "../../lib/jwt.js";
import { requireRol } from "../../middleware/auth.js";
import { adjuntosRouter } from "./adjuntos.routes.js";
import { whereRangoFecha, rangosFechaCampos } from "../../lib/filtros.js";
import type { EstadoGeneral } from "@prisma/client";

export const diagnosticosRouter = Router();

diagnosticosRouter.use("/:id/adjuntos", adjuntosRouter);

// El diagnóstico técnico lo registra el personal técnico.
// El administrador solo consulta (matriz de permisos del proyecto).
const soloTecnico = requireRol("TECNICO");

const estadoGeneralSchema = z.enum(["BUENO", "REGULAR", "MALO", "CRITICO"]);

const idSchema = z.object({ id: z.uuid() });

const textoOpcional = z.string().trim().min(1).max(5000).nullable().optional();

const crearSchema = z.object({
  id_solicitud: z.uuid(),
  estado_general: estadoGeneralSchema,
  fallas_detectadas: z.string().trim().min(3).max(5000),
  observaciones: textoOpcional,
  recomendaciones: textoOpcional,
});

const actualizarSchema = crearSchema
  .omit({ id_solicitud: true })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" });

const listarSchema = z.object({
  id_solicitud: z.uuid().optional(),
  id_maquina: z.uuid().optional(),
  id_tecnico: z.uuid().optional(),
  estado_general: estadoGeneralSchema.optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
}).merge(
  rangosFechaCampos("fecha", "actualizado_en"),
);

const resumen = {
  solicitud: { select: { id_solicitud: true, codigo: true, estado: true } },
  maquina: { select: { id_maquina: true, codigo: true, nombre: true } },
  tecnico: { select: { id_usuario: true, nombres: true, apellidos: true } },
} as const;

diagnosticosRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res) as
    z.output<typeof listarSchema> & {
      fecha_desde?: string;
      fecha_hasta?: string;
      actualizado_en_desde?: string;
      actualizado_en_hasta?: string;
      pagina: number;
      limite: number;
    };
  if (!filtros) return;

  const where = {
    ...(filtros.id_solicitud ? { id_solicitud: filtros.id_solicitud } : {}),
    ...(filtros.id_maquina ? { id_maquina: filtros.id_maquina } : {}),
    ...(filtros.id_tecnico ? { id_tecnico: filtros.id_tecnico } : {}),
    ...(filtros.estado_general ? { estado_general: filtros.estado_general as EstadoGeneral } : {}),
    ...whereRangoFecha("fecha", filtros.fecha_desde, filtros.fecha_hasta),
    ...whereRangoFecha("actualizado_en", filtros.actualizado_en_desde, filtros.actualizado_en_hasta),
  };

  const [diagnosticos, total] = await Promise.all([
    prisma.diagnostico.findMany({
      where,
      include: resumen,
      orderBy: { fecha: "desc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.diagnostico.count({ where }),
  ]);

  res.json({ diagnosticos, total, pagina: filtros.pagina, limite: filtros.limite });
});

diagnosticosRouter.post("/", soloTecnico, async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id_solicitud: datos.id_solicitud },
  });

  if (!solicitud) {
    res.status(400).json({ error: "La solicitud indicada no existe" });
    return;
  }

  // Un solo paso atómico: la solicitud pasa de RECIBIDA a EN_DIAGNOSTICO Y se crea el diagnóstico.
  // Si dos técnicos intentan a la vez, solo uno logra mover el estado y el otro recibe 409.
  const diagnostico = await prisma.$transaction(async (tx) => {
    const movida = await tx.solicitud.updateMany({
      where: { id_solicitud: solicitud.id_solicitud, estado: "RECIBIDA" },
      data: { estado: "EN_DIAGNOSTICO" },
    });

    if (movida.count === 0) return null;

    const data = {
        id_solicitud: solicitud.id_solicitud,
        id_maquina: solicitud.id_maquina,
        id_tecnico: sesion.id,
        estado_general: datos.estado_general,
        fallas_detectadas: datos.fallas_detectadas,
        ...(datos.observaciones !== undefined ? { observaciones: datos.observaciones } : {}),
        ...(datos.recomendaciones !== undefined ? { recomendaciones: datos.recomendaciones } : {}),
      };
    return tx.diagnostico.create({
      data,
      include: resumen,
    });
  });

  if (!diagnostico) {
    res.status(409).json({
      error: "Solo se puede diagnosticar una solicitud en estado RECIBIDA",
    });
    return;
  }

  res.status(201).json({ diagnostico });
});

diagnosticosRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const diagnostico = await prisma.diagnostico.findUnique({
    where: { id_diagnostico: params.id },
    include: {
      ...resumen,
      orden_trabajo: { select: { id_orden_trabajo: true, codigo: true, estado: true } },
      adjuntos: {
        select: {
          id_adjunto: true,
          nombre_original: true,
          tipo_mime: true,
          tamano_bytes: true,
          subido_en: true,
        },
      },
    },
  });

  if (!diagnostico) {
    res.status(404).json({ error: "Diagnóstico no encontrado" });
    return;
  }

  res.json({ diagnostico });
});

diagnosticosRouter.patch("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const existente = await prisma.diagnostico.findUnique({
    where: { id_diagnostico: params.id },
    select: { id_diagnostico: true, id_tecnico: true },
  });

  if (!existente) {
    res.status(404).json({ error: "Diagnóstico no encontrado" });
    return;
  }

  if (sesion.rol !== "ADMINISTRADOR" && existente.id_tecnico !== sesion.id) {
    res.status(403).json({ error: "Solo su autor o un administrador puede editar el diagnóstico" });
    return;
  }

  // La condición sobre la solicitud va dentro del UPDATE: si ya avanzó, no se modifica nada.
  const actualizados = await prisma.diagnostico.updateMany({
    where: { id_diagnostico: params.id, solicitud: { estado: "EN_DIAGNOSTICO" } },
    data: datos,
  });

  if (actualizados.count === 0) {
    res.status(409).json({
      error: "El diagnóstico ya no se puede editar porque la solicitud avanzó o fue cancelada",
    });
    return;
  }

  const diagnostico = await prisma.diagnostico.findUnique({
    where: { id_diagnostico: params.id },
    include: resumen,
  });

  res.json({ diagnostico });
});
