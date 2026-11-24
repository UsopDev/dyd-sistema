import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { requireClienteAuth } from "../../middleware/cliente-auth.js";
import { whereRangoFecha, rangosFechaCampos } from "../../lib/filtros.js";
import type { EstadoSolicitud } from "@prisma/client";

export const clienteRouter = Router();

// Todas requieren autenticación de cliente
clienteRouter.use(requireClienteAuth);

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

const listarMaquinasSchema = z.object({
  q: z.string().trim().max(100).optional(),
  estado: z.enum(["OPERATIVA", "EN_MANTENIMIENTO", "FUERA_DE_SERVICIO"]).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

const resumenSolicitud = {
  maquina: { select: { id_maquina: true, codigo: true, nombre: true } },
} as const;

const resumenMaquina = {
  programaciones: { where: { activo: true }, select: { id_programacion: true, descripcion: true, proximo_mant: true } },
} as const;

/**
 * GET /api/cliente/solicitudes
 * Solicitudes del cliente logueado
 */
clienteRouter.get("/solicitudes", async (req, res) => {
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

  const sesion = res.locals.sesionCliente as { id: string; email: string };

  const where = {
    id_cliente: sesion.id,
    ...(filtros.estado ? { estado: filtros.estado as EstadoSolicitud } : {}),
    ...(filtros.prioridad ? { prioridad: filtros.prioridad as "ALTA" | "MEDIA" | "BAJA" } : {}),
    ...(filtros.tipo_servicio ? { tipo_servicio: filtros.tipo_servicio as "PREVENTIVO" | "CORRECTIVO" } : {}),
    ...(filtros.id_maquina ? { id_maquina: filtros.id_maquina } : {}),
    ...whereRangoFecha("fecha_recepcion", filtros.fecha_recepcion_desde, filtros.fecha_recepcion_hasta),
    ...whereRangoFecha("actualizado_en", filtros.actualizado_en_desde, filtros.actualizado_en_hasta),
    ...(filtros.q
      ? {
          OR: [
            { codigo: { contains: filtros.q, mode: "insensitive" as const } },
            { descripcion: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
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
 * GET /api/cliente/solicitudes/:id
 * Detalle de solicitud del cliente
 */
clienteRouter.get("/solicitudes/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const sesion = res.locals.sesionCliente as { id: string; email: string };

  const solicitud = await prisma.solicitud.findFirst({
    where: { id_solicitud: params.id, id_cliente: sesion.id },
    include: {
      ...resumenSolicitud,
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
      cotizaciones: {
        select: {
          id_cotizacion: true,
          codigo: true,
          total: true,
          fecha: true,
        },
      },
    },
  });

  if (!solicitud) {
    res.status(404).json({ error: "Solicitud no encontrada" });
    return;
  }

  res.json({ solicitud });
});

/**
 * GET /api/cliente/maquinas
 * Máquinas del cliente logueado
 */
clienteRouter.get("/maquinas", async (req, res) => {
  const filtros = validar(listarMaquinasSchema, req.query, res) as
    z.output<typeof listarMaquinasSchema> & {
      pagina: number;
      limite: number;
    };
  if (!filtros) return;

  const sesion = res.locals.sesionCliente as { id: string; email: string };

  const where = {
    id_cliente: sesion.id,
    ...(filtros.estado ? { estado: filtros.estado as "OPERATIVA" | "EN_MANTENIMIENTO" | "FUERA_DE_SERVICIO" } : {}),
    ...(filtros.q
      ? {
          OR: [
            { codigo: { contains: filtros.q, mode: "insensitive" as const } },
            { nombre: { contains: filtros.q, mode: "insensitive" as const } },
            { marca: { contains: filtros.q, mode: "insensitive" as const } },
            { modelo: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [maquinas, total] = await Promise.all([
    prisma.maquina.findMany({
      where,
      include: resumenMaquina,
      orderBy: { nombre: "asc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.maquina.count({ where }),
  ]);

  res.json({ maquinas, total, pagina: filtros.pagina, limite: filtros.limite });
});

/**
 * GET /api/cliente/maquinas/:id
 * Detalle de máquina del cliente
 */
clienteRouter.get("/maquinas/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const sesion = res.locals.sesionCliente as { id: string; email: string };

  const maquina = await prisma.maquina.findFirst({
    where: { id_maquina: params.id, id_cliente: sesion.id },
    include: {
      programaciones: { where: { activo: true }, select: { id_programacion: true, descripcion: true, proximo_mant: true } },
      solicitudes: {
        select: { id_solicitud: true, codigo: true, estado: true, fecha_recepcion: true },
        orderBy: { fecha_recepcion: "desc" },
        take: 10,
      },
    },
  });

  if (!maquina) {
    res.status(404).json({ error: "Máquina no encontrada" });
    return;
  }

  res.json({ maquina });
});

/**
 * GET /api/cliente/dashboard
 * Resumen para el dashboard del cliente
 */
clienteRouter.get("/dashboard", async (_req, res) => {
  const sesion = res.locals.sesionCliente as { id: string; email: string };

  const [
    solicitudesPendientes,
    solicitudesEnProceso,
    solicitudesFinalizadas,
    maquinasTotal,
    maquinasOperativas,
    preventivosProximos,
  ] = await Promise.all([
    prisma.solicitud.count({ where: { id_cliente: sesion.id, estado: { in: ["RECIBIDA", "EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA"] } } }),
    prisma.solicitud.count({ where: { id_cliente: sesion.id, estado: "EN_PROCESO" } }),
    prisma.solicitud.count({ where: { id_cliente: sesion.id, estado: "FINALIZADA" } }),
    prisma.maquina.count({ where: { id_cliente: sesion.id } }),
    prisma.maquina.count({ where: { id_cliente: sesion.id, estado: "OPERATIVA" } }),
    prisma.programacionPreventiva.count({
      where: {
        maquina: { id_cliente: sesion.id },
        activo: true,
        proximo_mant: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Próximos 7 días
      },
    }),
  ]);

  res.json({
    solicitudes: {
      pendientes: solicitudesPendientes,
      en_proceso: solicitudesEnProceso,
      finalizadas: solicitudesFinalizadas,
    },
    maquinas: {
      total: maquinasTotal,
      operativas: maquinasOperativas,
    },
    preventivos_proximos: preventivosProximos,
  });
});
