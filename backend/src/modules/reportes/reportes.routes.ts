import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";

export const reportesRouter = Router();

const idSchema = z.object({ id: z.uuid() });

const filtroSchema = z.object({
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"]).default("FINALIZADA"),
});

const incluirOrden = {
  solicitud: {
    select: {
      codigo: true,
      tipo_servicio: true,
      prioridad: true,
      descripcion: true,
      maquina: { select: { id_maquina: true, codigo: true, nombre: true } },
      cliente: { select: { id_cliente: true, razon_social: true } },
    },
  },
  tecnico: { select: { id_usuario: true, nombres: true, apellidos: true } },
  diagnostico: { select: { estado_general: true, fallas_detectadas: true } },
  materiales: {
    include: { material: { select: { codigo: true, nombre: true, unidad: true } } },
  },
} as const;

reportesRouter.get("/maquinas/:id/historial", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;
  const filtros = validar(filtroSchema, req.query, res);
  if (!filtros) return;

  const maquina = await prisma.maquina.findUnique({
    where: { id_maquina: params.id },
    select: {
      id_maquina: true,
      codigo: true,
      nombre: true,
      tipo: true,
      marca: true,
      modelo: true,
      horas_uso: true,
      es_propia: true,
      cliente: { select: { razon_social: true } },
    },
  });

  if (!maquina) {
    res.status(404).json({ error: "Máquina no encontrada" });
    return;
  }

  const [ordenes, diagnosticos] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      where: { estado: filtros.estado, solicitud: { id_maquina: params.id } },
      include: incluirOrden,
      orderBy: { creado_en: "desc" },
    }),
    prisma.diagnostico.findMany({
      where: { id_maquina: params.id },
      select: {
        id_diagnostico: true,
        fecha: true,
        estado_general: true,
        fallas_detectadas: true,
        recomendaciones: true,
        solicitud: { select: { codigo: true } },
        tecnico: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { fecha: "desc" },
    }),
  ]);

  res.json({ maquina, ordenes, diagnosticos });
});

reportesRouter.get("/clientes/:id/historial", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;
  const filtros = validar(filtroSchema, req.query, res);
  if (!filtros) return;

  const cliente = await prisma.cliente.findUnique({
    where: { id_cliente: params.id },
    select: { id_cliente: true, razon_social: true, ruc_dni: true, contacto: true, telefono: true },
  });

  if (!cliente) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: { estado: filtros.estado, solicitud: { id_cliente: params.id } },
    include: incluirOrden,
    orderBy: { creado_en: "desc" },
  });

  res.json({ cliente, ordenes });
});
