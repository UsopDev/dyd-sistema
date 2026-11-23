import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { aFecha, hoyLocal, sumarDias } from "../../lib/fechas.js";
import { requireRol } from "../../middleware/auth.js";
import { whereRangoFecha, whereRangoFechaDia, rangosFechaCampos } from "../../lib/filtros.js";

export const preventivosRouter = Router();

const soloAdmin = requireRol("ADMINISTRADOR");

const idSchema = z.object({ id: z.uuid() });

const base = z.object({
  id_maquina: z.uuid(),
  descripcion: z.string().trim().min(3).max(200),
  frecuencia_horas: z.number().int().positive().max(1000000).nullable().optional(),
  frecuencia_dias: z.number().int().positive().max(36500).nullable().optional(),
  dias_aviso: z.number().int().min(0).max(365).optional(),
  horas_aviso: z.number().min(0).max(100000).optional(),
  horas_ultimo_mant: z.number().min(0).max(999999999).optional(),
  fecha_ultimo_mant: z.iso.date().optional(),
});

const crearSchema = base.refine(
  (d) => d.frecuencia_horas != null || d.frecuencia_dias != null,
  { message: "Indica la frecuencia en horas, en días o ambas", path: ["frecuencia_horas"] },
);

// Las horas y la fecha base las actualiza el sistema al finalizar una orden preventiva.
const actualizarSchema = base
  .omit({ id_maquina: true, horas_ultimo_mant: true, fecha_ultimo_mant: true })
  .partial()
  .extend({ activo: z.boolean().optional() })
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" });

const estadoSchema = z.enum(["AL_DIA", "PROXIMO", "VENCIDO"]);

const listarSchema = z.object({
  id_maquina: z.uuid().optional(),
  activo: z.enum(["true", "false"]).optional(),
  estado: estadoSchema.optional(),
  // Shortcuts para estado calculado
  vencido: z.enum(["true", "false"]).optional(),
  proximo_dias: z.coerce.number().int().positive().optional(),
}).merge(
  rangosFechaCampos("fecha_ultimo_mant", "proximo_mant", "creado_en"),
);

const alertasSchema = z.object({ id_maquina: z.uuid().optional() });

const conMaquina = {
  maquina: { select: { id_maquina: true, codigo: true, nombre: true, horas_uso: true } },
} as const;

interface Programacion {
  frecuencia_horas: number | null;
  frecuencia_dias: number | null;
  dias_aviso: number;
  horas_aviso: unknown;
  horas_ultimo_mant: unknown;
  proximo_mant: Date | null;
  maquina: { horas_uso: unknown };
}

// El estado se calcula al consultar: así nunca queda desactualizado respecto al uso real.
function conEstado<T extends Programacion>(p: T, hoy: Date) {
  let diasRestantes: number | null = null;

  if (p.frecuencia_dias !== null && p.proximo_mant) {
    diasRestantes = Math.round((p.proximo_mant.getTime() - hoy.getTime()) / 86400000);
  }

  let horasRestantes: number | null = null;

  if (p.frecuencia_horas !== null) {
    const base = p.horas_ultimo_mant !== null ? Number(p.horas_ultimo_mant) : 0;
    const usadas = Number(p.maquina.horas_uso) - base;
    horasRestantes = Math.round((p.frecuencia_horas - usadas) * 10) / 10;
  }

  const vencido =
    (diasRestantes !== null && diasRestantes <= 0) ||
    (horasRestantes !== null && horasRestantes <= 0);

  const proximo =
    (diasRestantes !== null && diasRestantes <= p.dias_aviso) ||
    (horasRestantes !== null && horasRestantes <= Number(p.horas_aviso));

  const estado: "AL_DIA" | "PROXIMO" | "VENCIDO" = vencido
    ? "VENCIDO"
    : proximo
      ? "PROXIMO"
      : "AL_DIA";

  return {
    ...p,
    estado_mantenimiento: { estado, dias_restantes: diasRestantes, horas_restantes: horasRestantes },
  };
}

export async function cargar(where: { id_maquina?: string; activo?: boolean }) {
  const hoy = aFecha(hoyLocal());

  const filas = await prisma.programacionPreventiva.findMany({
    where,
    include: conMaquina,
    orderBy: { proximo_mant: { sort: "asc", nulls: "last" } },
    take: 500,
  });

  return filas.map((fila) => conEstado(fila, hoy));
}

const PESO = { VENCIDO: 0, PROXIMO: 1, AL_DIA: 2 } as const;

preventivosRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res) as
    z.output<typeof listarSchema> & {
      fecha_ultimo_mant_desde?: string;
      fecha_ultimo_mant_hasta?: string;
      proximo_mant_desde?: string;
      proximo_mant_hasta?: string;
      creado_en_desde?: string;
      creado_en_hasta?: string;
      pagina: number;
      limite: number;
    };
  if (!filtros) return;

  const todas = await cargar({
    ...(filtros.id_maquina ? { id_maquina: filtros.id_maquina } : {}),
    ...(filtros.activo ? { activo: filtros.activo === "true" } : {}),
    ...whereRangoFechaDia("fecha_ultimo_mant", filtros.fecha_ultimo_mant_desde, filtros.fecha_ultimo_mant_hasta),
    ...whereRangoFechaDia("proximo_mant", filtros.proximo_mant_desde, filtros.proximo_mant_hasta),
    ...whereRangoFecha("creado_en", filtros.creado_en_desde, filtros.creado_en_hasta),
  });

  let preventivos = filtros.estado
    ? todas.filter((p) => p.estado_mantenimiento.estado === filtros.estado)
    : todas;

  // Filtros adicionales por estado calculado
  if (filtros.vencido === "true") {
    preventivos = preventivos.filter((p) => p.estado_mantenimiento.estado === "VENCIDO");
  }
  if (filtros.proximo_dias) {
    const diasLimite = Number(filtros.proximo_dias);
    preventivos = preventivos.filter(
      (p) =>
        p.estado_mantenimiento.estado === "PROXIMO" &&
        (p.estado_mantenimiento.dias_restantes ?? Infinity) <= diasLimite,
    );
  }

  res.json({ preventivos, total: preventivos.length });
});

// Debe ir antes de "/:id" para que "alertas" no se interprete como un id.
preventivosRouter.get("/alertas", async (req, res) => {
  const filtros = validar(alertasSchema, req.query, res);
  if (!filtros) return;

  const todas = await cargar({
    activo: true,
    ...(filtros.id_maquina ? { id_maquina: filtros.id_maquina } : {}),
  });

  const preventivos = todas
    .filter((p) => p.estado_mantenimiento.estado !== "AL_DIA")
    .sort((a, b) => PESO[a.estado_mantenimiento.estado] - PESO[b.estado_mantenimiento.estado]);

  res.json({ preventivos, total: preventivos.length });
});

preventivosRouter.post("/", soloAdmin, async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const maquina = await prisma.maquina.findUnique({ where: { id_maquina: datos.id_maquina } });

  if (!maquina) {
    res.status(400).json({ error: "La máquina indicada no existe" });
    return;
  }

  const fechaUltimo = datos.fecha_ultimo_mant ?? hoyLocal();

  if (fechaUltimo > hoyLocal()) {
    res.status(400).json({ error: "La fecha del último mantenimiento no puede ser futura" });
    return;
  }

  const horasUltimo = datos.horas_ultimo_mant ?? Number(maquina.horas_uso);
  const proximo = datos.frecuencia_dias
    ? sumarDias(aFecha(fechaUltimo), datos.frecuencia_dias)
    : null;

  const creada = await prisma.programacionPreventiva.create({
    data: {
      id_maquina: maquina.id_maquina,
      descripcion: datos.descripcion,
      frecuencia_horas: datos.frecuencia_horas,
      frecuencia_dias: datos.frecuencia_dias,
      dias_aviso: datos.dias_aviso,
      horas_aviso: datos.horas_aviso,
      horas_ultimo_mant: horasUltimo,
      fecha_ultimo_mant: aFecha(fechaUltimo),
      proximo_mant: proximo,
    },
    include: conMaquina,
  });

  res.status(201).json({ preventivo: conEstado(creada, aFecha(hoyLocal())) });
});

preventivosRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const preventivo = await prisma.programacionPreventiva.findUnique({
    where: { id_programacion: params.id },
    include: conMaquina,
  });

  if (!preventivo) {
    res.status(404).json({ error: "Programación no encontrada" });
    return;
  }

  res.json({ preventivo: conEstado(preventivo, aFecha(hoyLocal())) });
});

preventivosRouter.patch("/:id", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const existente = await prisma.programacionPreventiva.findUnique({
    where: { id_programacion: params.id },
  });

  if (!existente) {
    res.status(404).json({ error: "Programación no encontrada" });
    return;
  }

  const frecuenciaHoras =
    datos.frecuencia_horas !== undefined ? datos.frecuencia_horas : existente.frecuencia_horas;
  const frecuenciaDias =
    datos.frecuencia_dias !== undefined ? datos.frecuencia_dias : existente.frecuencia_dias;

  if (frecuenciaHoras === null && frecuenciaDias === null) {
    res.status(400).json({ error: "La programación debe conservar al menos una frecuencia" });
    return;
  }

  // Si cambia la frecuencia en días, la próxima fecha se recalcula desde el último mantenimiento.
  let proximo = existente.proximo_mant;

  if (datos.frecuencia_dias !== undefined) {
    proximo =
      frecuenciaDias !== null && existente.fecha_ultimo_mant
        ? sumarDias(existente.fecha_ultimo_mant, frecuenciaDias)
        : null;
  }

  const actualizada = await prisma.programacionPreventiva.update({
    where: { id_programacion: params.id },
    data: { ...datos, proximo_mant: proximo },
    include: conMaquina,
  });

  res.json({ preventivo: conEstado(actualizada, aFecha(hoyLocal())) });
});

// DELETE /:id - Eliminar/desactivar programación (solo ADMIN)
preventivosRouter.delete("/:id", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const existente = await prisma.programacionPreventiva.findUnique({
    where: { id_programacion: params.id },
  });

  if (!existente) {
    res.status(404).json({ error: "Programación no encontrada" });
    return;
  }

  // Soft delete: solo desactivar
  await prisma.programacionPreventiva.update({
    where: { id_programacion: params.id },
    data: { activo: false },
  });

  res.status(204).end();
});