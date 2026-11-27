import { Router } from "express";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { requireRol } from "../../middleware/auth.js";
import { whereRangoFecha } from "../../lib/filtros.js";
import { aExcel, aExcelResumen } from "../../lib/excel.js";
import type { EstadoSolicitud, TipoServicio, Prioridad } from "@prisma/client";

export const reportesRouter = Router();

const soloAdmin = requireRol("ADMINISTRADOR");

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

const rangoFechaSchema = z.object({
  fecha_desde: z.iso.date().optional(),
  fecha_hasta: z.iso.date().optional(),
}).refine(
  (data) => !data.fecha_desde || !data.fecha_hasta || data.fecha_desde <= data.fecha_hasta,
  { message: "fecha_desde debe ser anterior o igual a fecha_hasta", path: ["fecha_desde"] }
);

const listarBaseSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(50),
}).merge(rangoFechaSchema);

// ==================== HISTORIALES EXISTENTES ====================

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

// ==================== NUEVOS REPORTES DE NEGOCIO ====================

// 1. Solicitudes por estado
reportesRouter.get("/solicitudes-por-estado", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_recepcion", filtros.fecha_desde, filtros.fecha_hasta);

  const [porEstado, total] = await Promise.all([
    prisma.solicitud.groupBy({
      by: ["estado"],
      where,
      _count: { id_solicitud: true },
    }),
    prisma.solicitud.count({ where }),
  ]);

  const estadosOrden: EstadoSolicitud[] = [
    "RECIBIDA",
    "EN_DIAGNOSTICO",
    "COTIZADA",
    "ASIGNADA",
    "EN_PROCESO",
    "FINALIZADA",
    "CANCELADA",
  ];

  const data = estadosOrden.map((estado) => ({
    estado,
    cantidad: porEstado.find((p) => p.estado === estado)?._count.id_solicitud ?? 0,
  }));

  res.json({ data, total });
});

// 2. Solicitudes por técnico
reportesRouter.get("/solicitudes-por-tecnico", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_recepcion", filtros.fecha_desde, filtros.fecha_hasta);

  const data = await prisma.solicitud.groupBy({
    by: ["id_usuario_registrado"],
    where,
    _count: { id_solicitud: true },
    orderBy: { _count: { id_solicitud: "desc" } },
    take: 20,
  });

  const tecnicos = await prisma.usuario.findMany({
    where: { id_usuario: { in: data.map((d) => d.id_usuario_registrado) } },
    select: { id_usuario: true, nombres: true, apellidos: true },
  });

  const porTecnico = data.map((d) => ({
    tecnico: tecnicos.find((t) => t.id_usuario === d.id_usuario_registrado),
    cantidad: d._count.id_solicitud,
  }));

  res.json({ data: porTecnico });
});

// 3. Solicitudes por cliente
reportesRouter.get("/solicitudes-por-cliente", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_recepcion", filtros.fecha_desde, filtros.fecha_hasta);

  const data = await prisma.solicitud.groupBy({
    by: ["id_cliente"],
    where,
    _count: { id_solicitud: true },
    orderBy: { _count: { id_solicitud: "desc" } },
    take: 20,
  });

  const clientes = await prisma.cliente.findMany({
    where: { id_cliente: { in: data.map((d) => d.id_cliente).filter(Boolean) as string[] } },
    select: { id_cliente: true, razon_social: true },
  });

  const porCliente = data.map((d) => ({
    cliente: d.id_cliente ? clientes.find((c) => c.id_cliente === d.id_cliente) : { id_cliente: null, razon_social: "Sin cliente" },
    cantidad: d._count.id_solicitud,
  }));

  res.json({ data: porCliente });
});

// 4. Solicitudes por tipo de servicio
reportesRouter.get("/solicitudes-por-tipo", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_recepcion", filtros.fecha_desde, filtros.fecha_hasta);

  const data = await prisma.solicitud.groupBy({
    by: ["tipo_servicio"],
    where,
    _count: { id_solicitud: true },
  });

  const tipos: TipoServicio[] = ["PREVENTIVO", "CORRECTIVO"];
  const result = tipos.map((tipo) => ({
    tipo,
    cantidad: data.find((d) => d.tipo_servicio === tipo)?._count.id_solicitud ?? 0,
  }));

  res.json({ data: result });
});

// 5. Solicitudes por prioridad
reportesRouter.get("/solicitudes-por-prioridad", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_recepcion", filtros.fecha_desde, filtros.fecha_hasta);

  const data = await prisma.solicitud.groupBy({
    by: ["prioridad"],
    where,
    _count: { id_solicitud: true },
  });

  const prioridades: Prioridad[] = ["ALTA", "MEDIA", "BAJA"];
  const result = prioridades.map((prioridad) => ({
    prioridad,
    cantidad: data.find((d) => d.prioridad === prioridad)?._count.id_solicitud ?? 0,
  }));

  res.json({ data: result });
});

// 6. Tiempo promedio diagnóstico (días desde recepción hasta diagnóstico)
reportesRouter.get("/tiempo-promedio-diagnostico", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_recepcion", filtros.fecha_desde, filtros.fecha_hasta);

  const solicitudes = await prisma.solicitud.findMany({
    where: { ...where, diagnostico: { isNot: null } },
    select: {
      fecha_recepcion: true,
      diagnostico: { select: { fecha: true } },
    },
  });

  if (solicitudes.length === 0) {
    res.json({ promedio_dias: 0, total: 0 });
    return;
  }

  const sumaDias = solicitudes.reduce((acc, s) => {
    const recepcion = new Date(s.fecha_recepcion).getTime();
    const diagnostico = new Date(s.diagnostico!.fecha).getTime();
    return acc + (diagnostico - recepcion) / 86400000;
  }, 0);

  res.json({ promedio_dias: Math.round((sumaDias / solicitudes.length) * 10) / 10, total: solicitudes.length });
});

// 7. Tiempo promedio orden (días desde inicio hasta fin)
reportesRouter.get("/tiempo-promedio-orden", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_inicio", filtros.fecha_desde, filtros.fecha_hasta);

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: { ...where, estado: "FINALIZADA", fecha_inicio: { not: null }, fecha_fin: { not: null } },
    select: { fecha_inicio: true, fecha_fin: true },
  });

  if (ordenes.length === 0) {
    res.json({ promedio_dias: 0, total: 0 });
    return;
  }

  const sumaDias = ordenes.reduce((acc, o) => {
    const inicio = new Date(o.fecha_inicio!).getTime();
    const fin = new Date(o.fecha_fin!).getTime();
    return acc + (fin - inicio) / 86400000;
  }, 0);

  res.json({ promedio_dias: Math.round((sumaDias / ordenes.length) * 10) / 10, total: ordenes.length });
});

// 8. Materiales más usados (en órdenes finalizadas)
reportesRouter.get("/materiales-mas-usados", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha", filtros.fecha_desde, filtros.fecha_hasta);

  const movimientos = await prisma.movimientoInventario.findMany({
    where: { ...where, tipo: "SALIDA", orden_trabajo: { estado: "FINALIZADA" } },
    select: { id_material: true, cantidad: true },
  });

  const porMaterial = new Map<string, { cantidad: number; nombre: string; codigo: string | null }>();

  for (const m of movimientos) {
    const actual = porMaterial.get(m.id_material) ?? { cantidad: 0, nombre: "", codigo: null };
    actual.cantidad += Number(m.cantidad);
    porMaterial.set(m.id_material, actual);
  }

  const ids = Array.from(porMaterial.keys());
  const materiales = await prisma.material.findMany({
    where: { id_material: { in: ids } },
    select: { id_material: true, nombre: true, codigo: true },
  });

  for (const mat of materiales) {
    const entry = porMaterial.get(mat.id_material)!;
    entry.nombre = mat.nombre;
    entry.codigo = mat.codigo;
  }

  const data = Array.from(porMaterial.entries())
    .map(([id_material, v]) => ({ id_material, ...v }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 20);

  res.json({ data });
});

// 9. Ingresos por mes (órdenes finalizadas con monto)
reportesRouter.get("/ingresos-por-mes", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_fin", filtros.fecha_desde, filtros.fecha_hasta);

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: { ...where, estado: "FINALIZADA", monto: { not: null } },
    select: { fecha_fin: true, monto: true },
  });

  const porMes = new Map<string, number>();

  for (const o of ordenes) {
    if (!o.fecha_fin || o.monto === null) continue;
    const mes = new Date(o.fecha_fin).toISOString().slice(0, 7); // YYYY-MM
    porMes.set(mes, (porMes.get(mes) ?? 0) + Number(o.monto));
  }

  const data = Array.from(porMes.entries())
    .map(([mes, total]) => ({ mes, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  res.json({ data });
});

// 10. Rendimiento de técnicos (órdenes finalizadas, tiempo promedio, monto total)
reportesRouter.get("/tecnicos-rendimiento", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const where = whereRangoFecha("fecha_fin", filtros.fecha_desde, filtros.fecha_hasta);

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: { ...where, estado: "FINALIZADA" },
    select: {
      id_tecnico: true,
      fecha_inicio: true,
      fecha_fin: true,
      monto: true,
    },
  });

  const porTecnico = new Map<string, { ordenes: number; diasTotal: number; montoTotal: number; conFechas: number }>();

  for (const o of ordenes) {
    const entry = porTecnico.get(o.id_tecnico) ?? { ordenes: 0, diasTotal: 0, montoTotal: 0, conFechas: 0 };
    entry.ordenes++;
    if (o.monto !== null) entry.montoTotal += Number(o.monto);
    if (o.fecha_inicio && o.fecha_fin) {
      entry.diasTotal += (new Date(o.fecha_fin).getTime() - new Date(o.fecha_inicio).getTime()) / 86400000;
      entry.conFechas++;
    }
    porTecnico.set(o.id_tecnico, entry);
  }

  const ids = Array.from(porTecnico.keys());
  const tecnicos = await prisma.usuario.findMany({
    where: { id_usuario: { in: ids } },
    select: { id_usuario: true, nombres: true, apellidos: true },
  });

  const data = Array.from(porTecnico.entries())
    .map(([id_tecnico, v]) => {
      const t = tecnicos.find((te) => te.id_usuario === id_tecnico);
      return {
        tecnico: t ? { id_usuario: t.id_usuario, nombre: `${t.nombres} ${t.apellidos}` } : { id_usuario: id_tecnico, nombre: "Desconocido" },
        ordenes_finalizadas: v.ordenes,
        tiempo_promedio_dias: v.conFechas > 0 ? Math.round((v.diasTotal / v.conFechas) * 10) / 10 : 0,
        monto_total: Math.round(v.montoTotal * 100) / 100,
      };
    })
    .sort((a, b) => b.ordenes_finalizadas - a.ordenes_finalizadas);

  res.json({ data });
});

// 11. Resumen general del dashboard
reportesRouter.get("/resumen", soloAdmin, async (req, res) => {
  const filtros = validar(listarBaseSchema, req.query, res);
  if (!filtros) return;

  const whereSolicitud = whereRangoFecha("fecha_recepcion", filtros.fecha_desde, filtros.fecha_hasta);
  const whereOrden = whereRangoFecha("fecha_fin", filtros.fecha_desde, filtros.fecha_hasta);

  const [
    totalSolicitudes,
    solicitudesFinalizadas,
    solicitudesEnProceso,
    ordenesFinalizadas,
    ingresoTotal,
    maquinasActivas,
    clientesActivos,
  ] = await Promise.all([
    prisma.solicitud.count({ where: whereSolicitud }),
    prisma.solicitud.count({ where: { ...whereSolicitud, estado: "FINALIZADA" } }),
    prisma.solicitud.count({ where: { ...whereSolicitud, estado: { in: ["EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA", "EN_PROCESO"] } } }),
    prisma.ordenTrabajo.count({ where: { ...whereOrden, estado: "FINALIZADA" } }),
    prisma.ordenTrabajo.aggregate({ where: { ...whereOrden, estado: "FINALIZADA", monto: { not: null } }, _sum: { monto: true } }),
    prisma.maquina.count({ where: { estado: "OPERATIVA" } }),
    prisma.cliente.count({ where: { activo: true } }),
  ]);

  res.json({
    solicitudes: {
      total: totalSolicitudes,
      finalizadas: solicitudesFinalizadas,
      en_proceso: solicitudesEnProceso,
      tasa_finalizacion: totalSolicitudes > 0 ? Math.round((solicitudesFinalizadas / totalSolicitudes) * 1000) / 10 : 0,
    },
    ordenes: {
      finalizadas: ordenesFinalizadas,
      ingreso_total: Math.round((Number(ingresoTotal._sum.monto ?? 0)) * 100) / 100,
    },
    maquinas_activas: maquinasActivas,
    clientes_activos: clientesActivos,
  });
});

// Helper para convertir a CSV
function aCSV(data: unknown[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0] as object);
  const filas = data.map((row) =>
    headers.map((h) => {
      const val = (row as Record<string, unknown>)[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(","),
  );
  return [headers.join(","), ...filas].join("\n");
}

// 12. Exportar a CSV (genérico para cualquier reporte)
reportesRouter.get("/exportar/:tipo", soloAdmin, async (req, res) => {
  const tipo = Array.isArray(req.params.tipo) ? req.params.tipo[0] : req.params.tipo;
  const format = Array.isArray(req.query.format) ? req.query.format[0] : req.query.format;

  const reportesDisponibles = [
    "solicitudes-por-estado",
    "solicitudes-por-tecnico",
    "solicitudes-por-cliente",
    "solicitudes-por-tipo",
    "solicitudes-por-prioridad",
    "tiempo-promedio-diagnostico",
    "tiempo-promedio-orden",
    "materiales-mas-usados",
    "ingresos-por-mes",
    "tecnicos-rendimiento",
    "resumen",
  ];

  if (!reportesDisponibles.includes(tipo)) {
    res.status(404).json({ error: "Tipo de reporte no válido", disponibles: reportesDisponibles });
    return;
  }

  // Reutilizar la lógica de cada reporte llamando a la función interna
  // Como los handlers están inline, creamos una función que devuelve los datos
  async function obtenerDatosReporte(tipoReporte: string) {
    const filtros = validar(listarBaseSchema, req.query, res);
    if (!filtros) return null;

    const whereSolicitud = whereRangoFecha("fecha_recepcion", filtros.fecha_desde, filtros.fecha_hasta);
    const whereOrden = whereRangoFecha("fecha_fin", filtros.fecha_desde, filtros.fecha_hasta);

    switch (tipoReporte) {
      case "solicitudes-por-estado": {
        const [porEstado, total] = await Promise.all([
          prisma.solicitud.groupBy({ by: ["estado"], where: whereSolicitud, _count: { id_solicitud: true } }),
          prisma.solicitud.count({ where: whereSolicitud }),
        ]);
        const estadosOrden: EstadoSolicitud[] = ["RECIBIDA", "EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA", "EN_PROCESO", "FINALIZADA", "CANCELADA"];
        return { data: estadosOrden.map((e) => ({ estado: e, cantidad: porEstado.find((p) => p.estado === e)?._count.id_solicitud ?? 0 })), total };
      }
      case "solicitudes-por-tecnico": {
        const data = await prisma.solicitud.groupBy({
          by: ["id_usuario_registrado"], where: whereSolicitud, _count: { id_solicitud: true },
          orderBy: { _count: { id_solicitud: "desc" } }, take: 20,
        });
        const tecnicos = await prisma.usuario.findMany({
          where: { id_usuario: { in: data.map((d) => d.id_usuario_registrado) } },
          select: { id_usuario: true, nombres: true, apellidos: true },
        });
        return { data: data.map((d) => ({ tecnico: tecnicos.find((t) => t.id_usuario === d.id_usuario_registrado), cantidad: d._count.id_solicitud })) };
      }
      case "solicitudes-por-cliente": {
        const data = await prisma.solicitud.groupBy({
          by: ["id_cliente"], where: whereSolicitud, _count: { id_solicitud: true },
          orderBy: { _count: { id_solicitud: "desc" } }, take: 20,
        });
        const clientes = await prisma.cliente.findMany({
          where: { id_cliente: { in: data.map((d) => d.id_cliente).filter(Boolean) as string[] } },
          select: { id_cliente: true, razon_social: true },
        });
        return { data: data.map((d) => ({ cliente: d.id_cliente ? clientes.find((c) => c.id_cliente === d.id_cliente) : { id_cliente: null, razon_social: "Sin cliente" }, cantidad: d._count.id_solicitud })) };
      }
      case "solicitudes-por-tipo": {
        const data = await prisma.solicitud.groupBy({ by: ["tipo_servicio"], where: whereSolicitud, _count: { id_solicitud: true } });
        const tipos: TipoServicio[] = ["PREVENTIVO", "CORRECTIVO"];
        return { data: tipos.map((t) => ({ tipo: t, cantidad: data.find((d) => d.tipo_servicio === t)?._count.id_solicitud ?? 0 })) };
      }
      case "solicitudes-por-prioridad": {
        const data = await prisma.solicitud.groupBy({ by: ["prioridad"], where: whereSolicitud, _count: { id_solicitud: true } });
        const prioridades: Prioridad[] = ["ALTA", "MEDIA", "BAJA"];
        return { data: prioridades.map((p) => ({ prioridad: p, cantidad: data.find((d) => d.prioridad === p)?._count.id_solicitud ?? 0 })) };
      }
      case "tiempo-promedio-diagnostico": {
        const solicitudes = await prisma.solicitud.findMany({
          where: { ...whereSolicitud, diagnostico: { isNot: null } },
          select: { fecha_recepcion: true, diagnostico: { select: { fecha: true } } },
        });
        if (solicitudes.length === 0) return { promedio_dias: 0, total: 0 };
        const sumaDias = solicitudes.reduce((acc, s) => acc + (new Date(s.diagnostico!.fecha).getTime() - new Date(s.fecha_recepcion).getTime()) / 86400000, 0);
        return { promedio_dias: Math.round((sumaDias / solicitudes.length) * 10) / 10, total: solicitudes.length };
      }
      case "tiempo-promedio-orden": {
        const ordenes = await prisma.ordenTrabajo.findMany({
          where: { ...whereOrden, estado: "FINALIZADA", fecha_inicio: { not: null }, fecha_fin: { not: null } },
          select: { fecha_inicio: true, fecha_fin: true },
        });
        if (ordenes.length === 0) return { promedio_dias: 0, total: 0 };
        const sumaDias = ordenes.reduce((acc, o) => acc + (new Date(o.fecha_fin!).getTime() - new Date(o.fecha_inicio!).getTime()) / 86400000, 0);
        return { promedio_dias: Math.round((sumaDias / ordenes.length) * 10) / 10, total: ordenes.length };
      }
      case "materiales-mas-usados": {
        const movimientos = await prisma.movimientoInventario.findMany({
          where: { ...whereOrden, tipo: "SALIDA", orden_trabajo: { estado: "FINALIZADA" } },
          select: { id_material: true, cantidad: true },
        });
        const porMaterial = new Map<string, { cantidad: number; nombre: string; codigo: string | null }>();
        for (const m of movimientos) {
          const actual = porMaterial.get(m.id_material) ?? { cantidad: 0, nombre: "", codigo: null };
          actual.cantidad += Number(m.cantidad);
          porMaterial.set(m.id_material, actual);
        }
        const ids = Array.from(porMaterial.keys());
        const materiales = await prisma.material.findMany({ where: { id_material: { in: ids } }, select: { id_material: true, nombre: true, codigo: true } });
        for (const mat of materiales) { const entry = porMaterial.get(mat.id_material)!; entry.nombre = mat.nombre; entry.codigo = mat.codigo; }
        return { data: Array.from(porMaterial.entries()).map(([id_material, v]) => ({ id_material, ...v })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 20) };
      }
      case "ingresos-por-mes": {
        const ordenes = await prisma.ordenTrabajo.findMany({
          where: { ...whereOrden, estado: "FINALIZADA", monto: { not: null } },
          select: { fecha_fin: true, monto: true },
        });
        const porMes = new Map<string, number>();
        for (const o of ordenes) { if (!o.fecha_fin || o.monto === null) continue; const mes = new Date(o.fecha_fin).toISOString().slice(0, 7); porMes.set(mes, (porMes.get(mes) ?? 0) + Number(o.monto)); }
        return { data: Array.from(porMes.entries()).map(([mes, total]) => ({ mes, total: Math.round(total * 100) / 100 })).sort((a, b) => a.mes.localeCompare(b.mes)) };
      }
      case "tecnicos-rendimiento": {
        const ordenes = await prisma.ordenTrabajo.findMany({
          where: { ...whereOrden, estado: "FINALIZADA" },
          select: { id_tecnico: true, fecha_inicio: true, fecha_fin: true, monto: true },
        });
        const porTecnico = new Map<string, { ordenes: number; diasTotal: number; montoTotal: number; conFechas: number }>();
        for (const o of ordenes) {
          const entry = porTecnico.get(o.id_tecnico) ?? { ordenes: 0, diasTotal: 0, montoTotal: 0, conFechas: 0 };
          entry.ordenes++; if (o.monto !== null) entry.montoTotal += Number(o.monto);
          if (o.fecha_inicio && o.fecha_fin) { entry.diasTotal += (new Date(o.fecha_fin).getTime() - new Date(o.fecha_inicio).getTime()) / 86400000; entry.conFechas++; }
          porTecnico.set(o.id_tecnico, entry);
        }
        const ids = Array.from(porTecnico.keys());
        const tecnicos = await prisma.usuario.findMany({ where: { id_usuario: { in: ids } }, select: { id_usuario: true, nombres: true, apellidos: true } });
        return { data: Array.from(porTecnico.entries()).map(([id_tecnico, v]) => { const t = tecnicos.find((te) => te.id_usuario === id_tecnico); return { tecnico: t ? { id_usuario: t.id_usuario, nombre: `${t.nombres} ${t.apellidos}` } : { id_usuario: id_tecnico, nombre: "Desconocido" }, ordenes_finalizadas: v.ordenes, tiempo_promedio_dias: v.conFechas > 0 ? Math.round((v.diasTotal / v.conFechas) * 10) / 10 : 0, monto_total: Math.round(v.montoTotal * 100) / 100 }; }).sort((a, b) => b.ordenes_finalizadas - a.ordenes_finalizadas) };
      }
      case "resumen": {
        const [totalSolicitudes, solicitudesFinalizadas, solicitudesEnProceso, ordenesFinalizadas, ingresoTotal, maquinasActivas, clientesActivos] = await Promise.all([
          prisma.solicitud.count({ where: whereSolicitud }),
          prisma.solicitud.count({ where: { ...whereSolicitud, estado: "FINALIZADA" } }),
          prisma.solicitud.count({ where: { ...whereSolicitud, estado: { in: ["EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA", "EN_PROCESO"] } } }),
          prisma.ordenTrabajo.count({ where: { ...whereOrden, estado: "FINALIZADA" } }),
          prisma.ordenTrabajo.aggregate({ where: { ...whereOrden, estado: "FINALIZADA", monto: { not: null } }, _sum: { monto: true } }),
          prisma.maquina.count({ where: { estado: "OPERATIVA" } }),
          prisma.cliente.count({ where: { activo: true } }),
        ]);
        return {
          solicitudes: { total: totalSolicitudes, finalizadas: solicitudesFinalizadas, en_proceso: solicitudesEnProceso, tasa_finalizacion: totalSolicitudes > 0 ? Math.round((solicitudesFinalizadas / totalSolicitudes) * 1000) / 10 : 0 },
          ordenes: { finalizadas: ordenesFinalizadas, ingreso_total: Math.round((Number(ingresoTotal._sum.monto ?? 0)) * 100) / 100 },
          maquinas_activas: maquinasActivas, clientes_activos: clientesActivos,
        };
      }
      default:
        return null;
    }
  }

  const resultado = await obtenerDatosReporte(tipo);
  if (!resultado) {
    res.status(500).json({ error: "Error generando reporte" });
    return;
  }

  const formato = format === "xlsx" ? "xlsx" : format === "csv" ? "csv" : format === "pdf" ? "pdf" : "json";

  if (formato === "xlsx") {
    let buffer: Buffer;
    if ("data" in resultado && Array.isArray((resultado as { data: unknown[] }).data)) {
      buffer = await aExcel((resultado as { data: unknown[] }).data);
    } else {
      buffer = await aExcelResumen(resultado as Record<string, unknown>);
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${tipo}-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buffer);
  } else if (formato === "csv") {
    let csvData: string;
    if ("data" in resultado && Array.isArray((resultado as { data: unknown[] }).data)) {
      csvData = aCSV((resultado as { data: unknown[] }).data);
    } else {
      csvData = aCSV([resultado]);
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${tipo}-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvData);
  } else if (formato === "pdf") {
    const buffer = await generarPDF(resultado, tipo);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${tipo}-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.send(buffer);
  } else {
    res.json(resultado);
  }
});
// Función auxiliar para generar PDF
async function generarPDF(resultado: unknown, tipo: string): Promise<Buffer> {
  const data = resultado as Record<string, unknown>;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Título del reporte
    const titulos: Record<string, string> = {
      "solicitudes-por-estado": "Solicitudes por Estado",
      "solicitudes-por-tecnico": "Solicitudes por Técnico",
      "solicitudes-por-cliente": "Solicitudes por Cliente",
      "solicitudes-por-tipo": "Solicitudes por Tipo de Servicio",
      "solicitudes-por-prioridad": "Solicitudes por Prioridad",
      "tiempo-promedio-diagnostico": "Tiempo Promedio de Diagnóstico",
      "tiempo-promedio-orden": "Tiempo Promedio de Orden",
      "materiales-mas-usados": "Materiales Más Usados",
      "ingresos-por-mes": "Ingresos por Mes",
      "tecnicos-rendimiento": "Rendimiento de Técnicos",
      "resumen": "Resumen General",
    };

    doc.fontSize(18).font("Helvetica-Bold").text(titulos[tipo] || tipo, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).font("Helvetica").text(`Generado: ${new Date().toLocaleString("es-PE")}`, { align: "center" });
    doc.moveDown(2);

    // Datos del reporte
    if ("data" in data && Array.isArray((data as { data: unknown[] }).data)) {
      const datos = (data as { data: unknown[] }).data;
      if (datos.length > 0) {
        // Tabla simple
        const keys = Object.keys(datos[0] as object);
        const colWidth = (doc.page.width - 80) / keys.length;

        // Encabezado
        doc.font("Helvetica-Bold").fontSize(8);
        keys.forEach((key, i) => {
          doc.text(key.toUpperCase(), 40 + i * colWidth, doc.y, { width: colWidth, align: "left" });
        });
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
        doc.moveDown(0.3);

        // Filas
        doc.font("Helvetica").fontSize(7);
        for (const row of datos) {
          const vals = keys.map((k) => {
            const v = (row as Record<string, unknown>)[k];
            if (v === null || v === undefined) return "";
            if (typeof v === "object") return JSON.stringify(v);
            return String(v);
          });
          vals.forEach((val, i) => {
            doc.text(val.slice(0, 30), 40 + i * colWidth, doc.y, { width: colWidth, align: "left" });
          });
          doc.moveDown(0.4);
          if (doc.y > doc.page.height - 60) {
            doc.addPage();
          }
        }
      } else {
        doc.fontSize(10).text("Sin datos para el período seleccionado.", { align: "center" });
      }
    } else {
      // Objeto simple (resumen, tiempos promedio, etc.)
      doc.font("Helvetica").fontSize(10);
      const obj = data;
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) continue;
        if (typeof value === "object") {
          doc.font("Helvetica-Bold").text(`${key}:`);
          doc.font("Helvetica");
          const subObj = value as Record<string, unknown>;
          for (const [sk, sv] of Object.entries(subObj)) {
            doc.text(`  ${sk}: ${sv ?? ""}`);
          }
          doc.moveDown(0.3);
        } else {
          doc.text(`${key}: ${value}`);
        }
      }
    }

    doc.end();
  });
}

// Agregar PDF al exportador (modificar la sección de formatos)
