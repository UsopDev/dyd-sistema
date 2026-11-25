import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { siguienteCodigo } from "../../lib/codigos.js";
import { requireRol } from "../../middleware/auth.js";
import type { SesionUsuario } from "../../lib/jwt.js";
import { whereRangoFecha, rangosFechaCampos } from "../../lib/filtros.js";
import { calcularPrioridad, explicarPrioridad } from "../../lib/prioridad.js";
import type { EstadoSolicitud, TipoServicio, Prioridad } from "@prisma/client";

export const solicitudesRouter = Router();

const soloAdmin = requireRol("ADMINISTRADOR");

const estadoSchema = z.enum([
  "RECIBIDA",
  "EN_DIAGNOSTICO",
  "COTIZADA",
  "ASIGNADA",
  "EN_PROCESO",
  "FINALIZADA",
  "CANCELADA",
]);
const tipoSchema = z.enum(["PREVENTIVO", "CORRECTIVO"]);
const prioridadSchema = z.enum(["ALTA", "MEDIA", "BAJA"]);

const idSchema = z.object({ id: z.uuid() });

const crearSchema = z.object({
  id_maquina: z.uuid(),
  tipo_servicio: tipoSchema,
  descripcion: z.string().trim().min(5).max(2000),
  prioridad: prioridadSchema.optional(),
  id_programacion: z.uuid().nullable().optional(),
});

const actualizarSchema = z
  .object({
    descripcion: z.string().trim().min(5).max(2000).optional(),
    prioridad: prioridadSchema.optional(),
    id_programacion: z.uuid().nullable().optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" });

const listarSchema = z.object({
  q: z.string().trim().max(100).optional(),
  estado: estadoSchema.optional(),
  prioridad: prioridadSchema.optional(),
  tipo_servicio: tipoSchema.optional(),
  id_maquina: z.uuid().optional(),
  id_cliente: z.uuid().optional(),
  id_tecnico: z.uuid().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
}).merge(
  rangosFechaCampos("fecha_recepcion", "actualizado_en"),
);

const resumen = {
  maquina: { select: { id_maquina: true, codigo: true, nombre: true } },
  cliente: { select: { id_cliente: true, razon_social: true } },
} as const;

solicitudesRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res) as 
    z.output<typeof listarSchema> & {
      fecha_recepcion_desde?: string;
      fecha_recepcion_hasta?: string;
      actualizado_en_desde?: string;
      actualizado_en_hasta?: string;
      pagina: number;
      limite: number;
    };
  if (!filtros) return;

  const where = {
    ...(filtros.estado ? { estado: filtros.estado as EstadoSolicitud } : {}),
    ...(filtros.prioridad ? { prioridad: filtros.prioridad as Prioridad } : {}),
    ...(filtros.tipo_servicio ? { tipo_servicio: filtros.tipo_servicio as TipoServicio } : {}),
    ...(filtros.id_maquina ? { id_maquina: filtros.id_maquina } : {}),
    ...(filtros.id_cliente ? { id_cliente: filtros.id_cliente } : {}),
    ...(filtros.id_tecnico ? { id_usuario_registrado: filtros.id_tecnico } : {}),
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
      include: resumen,
      orderBy: [{ prioridad: "asc" }, { fecha_recepcion: "asc" }],
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.solicitud.count({ where }),
  ]);

  res.json({ solicitudes, total, pagina: filtros.pagina, limite: filtros.limite });
});

solicitudesRouter.post("/", soloAdmin, async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const maquina = await prisma.maquina.findUnique({ where: { id_maquina: datos.id_maquina } });

  if (!maquina) {
    res.status(400).json({ error: "La máquina indicada no existe" });
    return;
  }

  let programacion: { proximo_mant: Date | null } | null = null;

  if (datos.id_programacion) {
    if (datos.tipo_servicio !== "PREVENTIVO") {
      res.status(400).json({ error: "Solo una solicitud preventiva puede tener programación" });
      return;
    }

    const encontrada = await prisma.programacionPreventiva.findUnique({
      where: { id_programacion: datos.id_programacion },
    });

    if (!encontrada || encontrada.id_maquina !== maquina.id_maquina || !encontrada.activo) {
      res.status(400).json({
        error: "La programación indicada no existe, está inactiva o es de otra máquina",
      });
      return;
    }

    programacion = encontrada;
  }

  // La prioridad se calcula en el servidor con las reglas del dominio.
  // La que envia el usuario solo es una sugerencia: el servidor decide.
  const contextoPrioridad = {
    esPropia: maquina.es_propia,
    estadoMaquina: maquina.estado,
    tipoServicio: datos.tipo_servicio,
    proximoMantenimiento: programacion?.proximo_mant ?? null,
    prioridadSugerida: datos.prioridad ?? null,
  };

  const prioridad = calcularPrioridad(contextoPrioridad);
  const motivos = explicarPrioridad(contextoPrioridad);

  const solicitud = await prisma.solicitud.create({
    data: {
      codigo: await siguienteCodigo("solicitud"),
      id_maquina: maquina.id_maquina,
      id_cliente: maquina.id_cliente,
      id_usuario_registrado: sesion.id,
      tipo_servicio: datos.tipo_servicio,
      descripcion: datos.descripcion,
      prioridad,
      id_programacion: datos.id_programacion,
    },
    include: resumen,
  });

  res.status(201).json({
    solicitud,
    ...(motivos.length > 0 ? { prioridad_asignada: { prioridad, motivos } } : {}),
  });
});

solicitudesRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id_solicitud: params.id },
    include: {
      ...resumen,
      usuario: { select: { id_usuario: true, nombres: true, apellidos: true } },
      diagnostico: { select: { id_diagnostico: true, estado_general: true, fecha: true } },
      orden_trabajo: { select: { id_orden_trabajo: true, codigo: true, estado: true } },
      _count: { select: { cotizaciones: true } },
    },
  });

  if (!solicitud) {
    res.status(404).json({ error: "Solicitud no encontrada" });
    return;
  }

  res.json({ solicitud });
});

solicitudesRouter.patch("/:id", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const existente = await prisma.solicitud.findUnique({
    where: { id_solicitud: params.id },
    include: { maquina: true },
  });

  if (!existente) {
    res.status(404).json({ error: "Solicitud no encontrada" });
    return;
  }

  if (existente.estado !== "RECIBIDA") {
    res.status(409).json({ error: "Solo se puede editar una solicitud en estado RECIBIDA" });
    return;
  }

  // La prioridad se recalcula en el servidor con las reglas del dominio.
  let programacion: { proximo_mant: Date | null } | null = null;
  const idProgramacion = datos.id_programacion ?? existente.id_programacion;

  if (idProgramacion) {
    programacion = await prisma.programacionPreventiva.findUnique({
      where: { id_programacion: idProgramacion },
      select: { proximo_mant: true },
    });
  }

  const contextoPrioridad = {
    esPropia: existente.maquina.es_propia,
    estadoMaquina: existente.maquina.estado,
    tipoServicio: existente.tipo_servicio,
    proximoMantenimiento: programacion?.proximo_mant ?? null,
    prioridadSugerida: datos.prioridad ?? existente.prioridad,
  };

  const prioridad = calcularPrioridad(contextoPrioridad);
  const motivos = explicarPrioridad(contextoPrioridad);

  // La condición de estado va dentro del UPDATE: si otro proceso la movió, no se modifica.
  const actualizadas = await prisma.solicitud.updateMany({
    where: { id_solicitud: params.id, estado: "RECIBIDA" },
    data: { ...datos, prioridad },
  });

  if (actualizadas.count === 0) {
    res.status(409).json({ error: "Solo se puede editar una solicitud en estado RECIBIDA" });
    return;
  }

  const solicitud = await prisma.solicitud.findUnique({
    where: { id_solicitud: params.id },
    include: resumen,
  });

  res.json({
    solicitud,
    ...(motivos.length > 0 ? { prioridad_asignada: { prioridad, motivos } } : {}),
  });
});

solicitudesRouter.post("/:id/cancelar", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const actualizadas = await prisma.solicitud.updateMany({
    where: {
      id_solicitud: params.id,
      estado: { in: ["RECIBIDA", "EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA"] },
    },
    data: { estado: "CANCELADA" },
  });

  if (actualizadas.count === 0) {
    const existe = await prisma.solicitud.findUnique({
      where: { id_solicitud: params.id },
      select: { id_solicitud: true },
    });

    if (!existe) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }

    res.status(409).json({
      error: "No se puede cancelar una solicitud en proceso, finalizada o ya cancelada",
    });
    return;
  }

  const solicitud = await prisma.solicitud.findUnique({
    where: { id_solicitud: params.id },
    include: resumen,
  });

  res.json({ solicitud });
});
