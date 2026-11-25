import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { requireAuth } from "../../middleware/auth.js";
import { whereRangoFecha, rangosFechaCampos } from "../../lib/filtros.js";
import type { EstadoSolicitud, EstadoOrden, Prisma } from "@prisma/client";

export const miRouter = Router();

// Todas requieren autenticación
miRouter.use(requireAuth);

const idSchema = z.object({ id: z.uuid() });

const listarSolicitudesSchema = z.object({
  q: z.string().trim().max(100).optional(),
  estado: z.enum([
    "RECIBIDA", "EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA",
    "EN_PROCESO", "FINALIZADA", "CANCELADA"
  ]).optional(),
  prioridad: z.enum(["ALTA", "MEDIA", "BAJA"]).optional(),
  tipo_servicio: z.enum(["PREVENTIVO", "CORRECTIVO"]).optional(),
  id_maquina: z.uuid().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
}).merge(rangosFechaCampos("fecha_recepcion", "actualizado_en"));

const listarOrdenesSchema = z.object({
  q: z.string().trim().max(50).optional(),
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"]).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
}).merge(rangosFechaCampos("creado_en", "fecha_inicio", "fecha_fin", "actualizado_en"));

const resumenSolicitud = {
  maquina: { select: { id_maquina: true, codigo: true, nombre: true } },
  cliente: { select: { id_cliente: true, razon_social: true } },
} as const;

const resumenOrden = {
  solicitud: { select: { id_solicitud: true, codigo: true, estado: true } },
} as const;

/**
 * GET /api/mi/solicitudes
 * Solicitudes visibles para el técnico:
 *  - las que están RECIBIDA y aún no fueron diagnostiquées (cola de diagnóstico),
 *  - las que ya tienen un diagnóstico u orden asignado a este técnico.
 */
miRouter.get("/solicitudes", async (req, res) => {
  const filtros = validar(listarSolicitudesSchema, req.query, res) as
    z.output<typeof listarSolicitudesSchema> & {
      fecha_recepcion_desde?: string;
      fecha_recepcion_hasta?: string;
      actualizado_en_desde?: string;
      actualizado_en_hasta?: string;
      pagina: number;
      limite: number;
    };
  if (!filtros) return;

  const sesion = res.locals.sesion as { id: string; rol: string };

  const where: Prisma.SolicitudWhereInput = {
    AND: [
      {
        OR: [
          // Cola de diagnóstico: solicitudes nuevas que ningún técnico tomó aún.
          { estado: "RECIBIDA", diagnostico: null },
          // Solicitudes ya cerradas con diagnóstico u orden de este técnico.
          { diagnostico: { id_tecnico: sesion.id } },
          { orden_trabajo: { id_tecnico: sesion.id } },
        ],
      },
      ...(filtros.q
        ? [
            {
              OR: [
                { codigo: { contains: filtros.q, mode: "insensitive" as const } },
                { descripcion: { contains: filtros.q, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
    ...(filtros.estado ? { estado: filtros.estado as EstadoSolicitud } : {}),
    ...(filtros.prioridad ? { prioridad: filtros.prioridad as "ALTA" | "MEDIA" | "BAJA" } : {}),
    ...(filtros.tipo_servicio ? { tipo_servicio: filtros.tipo_servicio as "PREVENTIVO" | "CORRECTIVO" } : {}),
    ...(filtros.id_maquina ? { id_maquina: filtros.id_maquina } : {}),
    ...whereRangoFecha("fecha_recepcion", filtros.fecha_recepcion_desde, filtros.fecha_recepcion_hasta),
    ...whereRangoFecha("actualizado_en", filtros.actualizado_en_desde, filtros.actualizado_en_hasta),
  };

  const [solicitudes, total] = await Promise.all([
    prisma.solicitud.findMany({
      where,
      include: resumenSolicitud,
      orderBy: [{ prioridad: "asc" }, { fecha_recepcion: "asc" }],
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.solicitud.count({ where }),
  ]);

  res.json({ solicitudes, total, pagina: filtros.pagina, limite: filtros.limite });
});

/**
 * GET /api/mi/solicitudes/:id
 * Detalle de solicitud visible para el técnico:
 *  - RECIBIDA sin diagnóstico (cola de diagnóstico),
 *  - o con diagnóstico / orden asignado a este técnico.
 */
miRouter.get("/solicitudes/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const sesion = res.locals.sesion as { id: string; rol: string };

  const solicitud = await prisma.solicitud.findFirst({
    where: {
      id_solicitud: params.id,
      OR: [
        { estado: "RECIBIDA", diagnostico: null },
        { diagnostico: { id_tecnico: sesion.id } },
        { orden_trabajo: { id_tecnico: sesion.id } },
      ],
    },
    include: {
      ...resumenSolicitud,
      usuario: { select: { id_usuario: true, nombres: true, apellidos: true } },
      diagnostico: {
        select: {
          id_diagnostico: true,
          estado_general: true,
          fallas_detectadas: true,
          observaciones: true,
          recomendaciones: true,
          fecha: true,
        },
      },
      orden_trabajo: {
        select: {
          id_orden_trabajo: true,
          codigo: true,
          estado: true,
          trabajo_realizado: true,
          monto: true,
          fecha_inicio: true,
          fecha_fin: true,
        },
      },
      _count: { select: { cotizaciones: true } },
    },
  });

  if (!solicitud) {
    res.status(404).json({ error: "Solicitud no encontrada" });
    return;
  }

  res.json({ solicitud });
});

/**
 * GET /api/mi/ordenes
 * Órdenes asignadas al técnico
 */
miRouter.get("/ordenes", async (req, res) => {
  const filtros = validar(listarOrdenesSchema, req.query, res) as
    z.output<typeof listarOrdenesSchema> & {
      creado_en_desde?: string;
      creado_en_hasta?: string;
      fecha_inicio_desde?: string;
      fecha_inicio_hasta?: string;
      fecha_fin_desde?: string;
      fecha_fin_hasta?: string;
      actualizado_en_desde?: string;
      actualizado_en_hasta?: string;
      pagina: number;
      limite: number;
    };
  if (!filtros) return;

  const sesion = res.locals.sesion as { id: string; rol: string };

  const where = {
    id_tecnico: sesion.id,
    ...(filtros.estado ? { estado: filtros.estado as EstadoOrden } : {}),
    ...whereRangoFecha("creado_en", filtros.creado_en_desde, filtros.creado_en_hasta),
    ...whereRangoFecha("fecha_inicio", filtros.fecha_inicio_desde, filtros.fecha_inicio_hasta),
    ...whereRangoFecha("fecha_fin", filtros.fecha_fin_desde, filtros.fecha_fin_hasta),
    ...whereRangoFecha("actualizado_en", filtros.actualizado_en_desde, filtros.actualizado_en_hasta),
    ...(filtros.q ? { codigo: { contains: filtros.q, mode: "insensitive" as const } } : {}),
  };

  const [ordenes, total] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      where,
      include: resumenOrden,
      orderBy: { creado_en: "desc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.ordenTrabajo.count({ where }),
  ]);

  res.json({ ordenes, total, pagina: filtros.pagina, limite: filtros.limite });
});

/**
 * GET /api/mi/dashboard
 * Resumen para el dashboard del técnico
 */
miRouter.get("/dashboard", async (_req, res) => {
  const sesion = res.locals.sesion as { id: string; rol: string };

  const [
    solicitudesPendientes,
    solicitudesEnProceso,
    solicitudesFinalizadasHoy,
    ordenesPendientes,
    ordenesEnProceso,
    ordenesFinalizadasHoy,
    diagnosticosPendientes,
  ] = await Promise.all([
    prisma.solicitud.count({
      where: {
        OR: [
          { diagnostico: { id_tecnico: sesion.id } },
          { orden_trabajo: { id_tecnico: sesion.id } },
        ],
        estado: { in: ["ASIGNADA", "EN_PROCESO"] },
      },
    }),
    prisma.solicitud.count({
      where: {
        OR: [
          { diagnostico: { id_tecnico: sesion.id } },
          { orden_trabajo: { id_tecnico: sesion.id } },
        ],
        estado: "EN_PROCESO",
      },
    }),
    prisma.solicitud.count({
      where: {
        OR: [
          { diagnostico: { id_tecnico: sesion.id } },
          { orden_trabajo: { id_tecnico: sesion.id } },
        ],
        estado: "FINALIZADA",
        actualizado_en: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.ordenTrabajo.count({ where: { id_tecnico: sesion.id, estado: "PENDIENTE" } }),
    prisma.ordenTrabajo.count({ where: { id_tecnico: sesion.id, estado: "EN_PROCESO" } }),
    prisma.ordenTrabajo.count({
      where: {
        id_tecnico: sesion.id,
        estado: "FINALIZADA",
        fecha_fin: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.solicitud.count({
      where: {
        OR: [
          // Cola de diagnóstico: solicitudes nuevas aún sin tomar.
          { estado: "RECIBIDA", diagnostico: null },
          // Diagnósticos propios que la solicitud aún no superó.
          { diagnostico: { id_tecnico: sesion.id }, estado: "EN_DIAGNOSTICO" },
        ],
      },
    }),
  ]);

  res.json({
    solicitudes: {
      pendientes: solicitudesPendientes,
      en_proceso: solicitudesEnProceso,
      finalizadas_hoy: solicitudesFinalizadasHoy,
    },
    ordenes: {
      pendientes: ordenesPendientes,
      en_proceso: ordenesEnProceso,
      finalizadas_hoy: ordenesFinalizadasHoy,
    },
    diagnosticos_pendientes: diagnosticosPendientes,
  });
});
