import {
  EstadoOrden,
  Prioridad,
  TipoServicio,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import {
  rangoMesActual,
  dias,
  fechaCorta,
  fechaHoraCorta,
  numero,
  moneda,
  porcentaje,
  redondear,
} from "./reporte-formato.js";
import {
  ETIQUETA_DIAGNOSTICO,
  ETIQUETA_ESTADO_ORDEN,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_SERVICIO,
  TONO_ESTADO_ORDEN,
} from "../../lib/reporte-theme.js";
import {
  ReporteOrdenesVM,
  ResultadoReporteOrdenes,
  FilaEstado,
  FilaTecnico,
  FilaCliente,
  FilaMaterial,
  FilaOrden,
  LIMITE_REPORTE,
} from "./reporte-tipos.js";

const EstadosCompleto: EstadoOrden[] = [
  "PENDIENTE",
  "EN_PROCESO",
  "FINALIZADA",
  "CANCELADA",
];

function nombreCompleto(nombres: string | null, apellidos: string | null): string {
  return `${nombres ?? ""} ${apellidos ?? ""}`.trim() || "Sin técnico";
}

function estandarizarMonto(valor: Prisma.Decimal | number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const n = typeof valor === "object" ? valor.toNumber() : Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Ejecuta todas las consultas del reporte de órdenes y arma el ViewModel.
 * Las agrupaciones se hacen en Prisma/SQL; JS solo mapea y redondea.
 */
export async function construirReporteOrdenes(
  generadoPor: string,
  filtros: {
    fecha_desde?: string;
    fecha_hasta?: string;
    id_cliente?: string;
    id_tecnico?: string;
    estado?: EstadoOrden;
    tipo_servicio?: TipoServicio;
    prioridad?: Prioridad;
    q?: string;
  },
): Promise<ResultadoReporteOrdenes> {
  const desde = filtros.fecha_desde ?? rangoMesActual().desde;
  const hasta = filtros.fecha_hasta ?? rangoMesActual().hasta;

  const idTecnico = filtros.id_tecnico ?? undefined;
  const idCliente = filtros.id_cliente ?? undefined;

  const whereOrdenes: Record<string, unknown> = {
    estado: filtros.estado ?? undefined,
    creado_en: {
      gte: new Date(`${desde}T00:00:00.000Z`),
      lte: new Date(`${hasta}T23:59:59.999Z`),
    },
    ...(idCliente ? { solicitud: { id_cliente: idCliente } } : {}),
    ...(idTecnico ? { id_tecnico: idTecnico } : {}),
    ...(filtros.tipo_servicio
      ? { solicitud: { tipo_servicio: filtros.tipo_servicio } }
      : {}),
    ...(filtros.prioridad ? { solicitud: { prioridad: filtros.prioridad } } : {}),
    ...(filtros.q
      ? {
          OR: [
            { codigo: { contains: filtros.q, mode: "insensitive" } },
            {
              solicitud: {
                codigo: { contains: filtros.q, mode: "insensitive" },
              },
            },
            {
              solicitud: {
                descripcion: { contains: filtros.q, mode: "insensitive" },
              },
            },
            {
              solicitud: {
                cliente: {
                  razon_social: { contains: filtros.q, mode: "insensitive" },
                },
              },
            },
            {
              diagnostico: {
                fallas_detectadas: { contains: filtros.q, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: whereOrdenes,
    orderBy: { creado_en: "desc" },
    take: LIMITE_REPORTE.maxOrdenes + 1,
    include: {
      solicitud: {
        select: {
          codigo: true,
          tipo_servicio: true,
          prioridad: true,
          descripcion: true,
          id_cliente: true,
          cliente: { select: { id_cliente: true, razon_social: true } },
          maquina: { select: { id_maquina: true, codigo: true, nombre: true } },
        },
      },
      tecnico: { select: { id_usuario: true, nombres: true, apellidos: true } },
      diagnostico: {
        select: { estado_general: true, fallas_detectadas: true },
      },
      materiales: {
        include: { material: { select: { codigo: true, nombre: true, unidad: true } } },
        orderBy: { material: { nombre: "asc" } },
      },
    },
  });

  const totalRegistros = ordenes.length;
  if (totalRegistros > LIMITE_REPORTE.maxOrdenes) {
    throw new Error(
      `Demasiadas órdenes para exportar (${totalRegistros}). Ajusta los filtros para reducir el resultado a ${LIMITE_REPORTE.maxOrdenes} o menos.`,
    );
  }

  // ---- KPIs agregados en SQL ----
  const whereEstado = { ...whereOrdenes };
  delete whereEstado.estado;

  const [ordenesEstado, _ordenesTecnico] = await Promise.all([
    prisma.ordenTrabajo.groupBy({
      by: ["estado"],
      where: whereEstado,
      _count: { id_orden_trabajo: true },
    }),
    prisma.ordenTrabajo.groupBy({
      by: ["id_tecnico"],
      where: {
        ...whereEstado,
        estado: "FINALIZADA",
      },
      _count: { id_orden_trabajo: true },
      _sum: { monto: true },
    }),
  ]);

  // ---- filas de detalle ----
  const filas: FilaOrden[] = [];
  let montoTotal = 0;
  let totalFinalizadas = 0;
  let diasSum = 0;
  let diasCon = 0;

  for (const o of ordenes) {
    const s = o.solicitud;
    const d = o.diagnostico;
    const m = estandarizarMonto(o.monto);
    const dia =
      o.fecha_inicio && o.fecha_fin
        ? redondear(
            (new Date(o.fecha_fin).getTime() - new Date(o.fecha_inicio).getTime()) /
              86_400_000,
            1,
          )
        : null;

    if (m !== null) montoTotal += m;
    if (o.estado === "FINALIZADA") totalFinalizadas++;
    if (dia !== null) {
      diasSum += dia;
      diasCon++;
    }

    filas.push({
      id_orden_trabajo: o.id_orden_trabajo,
      codigo: o.codigo ?? null,
      fecha: fechaCorta(o.creado_en),
      cliente: s.cliente?.razon_social ?? "Sin cliente",
      maquina: `${s.maquina.codigo ?? ""} ${s.maquina.nombre}`.trim(),
      tecnico: nombreCompleto(o.tecnico.nombres, o.tecnico.apellidos),
      tipo: ETIQUETA_TIPO_SERVICIO[s.tipo_servicio],
      prioridad: ETIQUETA_PRIORIDAD[s.prioridad],
      estado: ETIQUETA_ESTADO_ORDEN[o.estado],
      diagnostico: d ? ETIQUETA_DIAGNOSTICO[d.estado_general] : "—",
      fallas: d?.fallas_detectadas ?? null,
      fecha_inicio: o.fecha_inicio ? fechaHoraCorta(o.fecha_inicio) : null,
      fecha_fin: o.fecha_fin ? fechaHoraCorta(o.fecha_fin) : null,
      dias: dia,
      materiales: o.materiales
        .map(
          (mat) =>
            `${mat.material.codigo ?? ""} ${mat.material.nombre}`.trim() +
            ` (${numero(mat.cantidad.toNumber())})`,
        )
        .join("; "),
      monto: m,
      trabajo_realizado: o.trabajo_realizado ?? null,
    });
  }

  const cumplimientoGeneral =
    filas.length > 0 ? redondear((totalFinalizadas / filas.length) * 100, 1) : 0;
  const horasPromedio =
    diasCon > 0 ? redondear(diasSum / diasCon, 1) : null;

  // ---- estados ----
  const estados: FilaEstado[] = EstadosCompleto.map((estado) => {
    const cuenta = ordenesEstado.find((e) => e.estado === estado)?._count
      .id_orden_trabajo ?? 0;
    return {
      estado: ETIQUETA_ESTADO_ORDEN[estado],
      cantidad: cuenta,
      porcentaje: filas.length > 0 ? redondear((cuenta / filas.length) * 100, 1) : 0,
      tono: TONO_ESTADO_ORDEN[estado],
    };
  });

  // ---- técnicos (agrupado por nombre desde las filas) ----
  const filasTecnicoMap = new Map<
    string,
    {
      ordenes: number;
      finalizadas: number;
      en_proceso: number;
      pendientes: number;
      canceladas: number;
      monto_total: number;
      diasSum: number;
      diasCon: number;
    }
  >();

  for (const f of filas) {
    const actual = filasTecnicoMap.get(f.tecnico) ?? {
      ordenes: 0,
      finalizadas: 0,
      en_proceso: 0,
      pendientes: 0,
      canceladas: 0,
      monto_total: 0,
      diasSum: 0,
      diasCon: 0,
    };
    actual.ordenes++;
    if (f.estado === "Finalizada") actual.finalizadas++;
    else if (f.estado === "En proceso") actual.en_proceso++;
    else if (f.estado === "Pendiente") actual.pendientes++;
    else if (f.estado === "Cancelada") actual.canceladas++;
    if (f.monto !== null) actual.monto_total += f.monto;
    if (f.dias !== null) {
      actual.diasSum += f.dias;
      actual.diasCon++;
    }
    filasTecnicoMap.set(f.tecnico, actual);
  }

  const tecnicos: FilaTecnico[] = Array.from(filasTecnicoMap.entries())
    .map(([tecnico, v]) => ({
      tecnico,
      ordenes: v.ordenes,
      finalizadas: v.finalizadas,
      en_proceso: v.en_proceso,
      pendientes: v.pendientes,
      canceladas: v.canceladas,
      cumplimiento:
        v.ordenes > 0 ? redondear((v.finalizadas / v.ordenes) * 100, 1) : 0,
      monto_total: redondear(v.monto_total, 2),
      dias_promedio:
        v.diasCon > 0 ? redondear(v.diasSum / v.diasCon, 1) : null,
    }))
    .sort((a, b) => b.ordenes - a.ordenes);

  // ---- clientes ----
  const filasClienteMap = new Map<
    string,
    {
      ordenes: number;
      finalizadas: number;
      monto_total: number;
    }
  >();

  for (const f of filas) {
    const actual = filasClienteMap.get(f.cliente) ?? {
      ordenes: 0,
      finalizadas: 0,
      monto_total: 0,
    };
    actual.ordenes++;
    if (f.estado === "Finalizada") actual.finalizadas++;
    if (f.monto !== null) actual.monto_total += f.monto;
    filasClienteMap.set(f.cliente, actual);
  }

  const clientes: FilaCliente[] = Array.from(filasClienteMap.entries())
    .map(([cliente, v]) => ({
      cliente,
      ordenes: v.ordenes,
      finalizadas: v.finalizadas,
      cumplimiento:
        v.ordenes > 0 ? redondear((v.finalizadas / v.ordenes) * 100, 1) : 0,
      monto_total: redondear(v.monto_total, 2),
      ticket_promedio:
        v.ordenes > 0 ? redondear(v.monto_total / v.ordenes, 2) : 0,
    }))
    .sort((a, b) => b.ordenes - a.ordenes);

  // ---- materiales más usados (top 20) ----
  const idOrdenes = filas.map((f) => f.id_orden_trabajo);
  const materialesMovimientos =
    idOrdenes.length > 0
      ? await prisma.movimientoInventario.findMany({
          where: {
            id_orden_trabajo: { in: idOrdenes },
            tipo: "SALIDA",
          },
          select: { id_material: true, cantidad: true },
        })
      : [];

  const porMaterial = new Map<
    string,
    { cantidad: number; nombre: string; codigo: string | null }
  >();
  for (const m of materialesMovimientos) {
    const actual = porMaterial.get(m.id_material) ?? {
      cantidad: 0,
      nombre: "",
      codigo: null,
    };
    actual.cantidad += Number(m.cantidad);
    porMaterial.set(m.id_material, actual);
  }

  const idsMateriales = Array.from(porMaterial.keys());
  const materialesDB =
    idsMateriales.length > 0
      ? await prisma.material.findMany({
          where: { id_material: { in: idsMateriales } },
          select: { id_material: true, nombre: true, codigo: true },
        })
      : [];

  for (const mat of materialesDB) {
    const entry = porMaterial.get(mat.id_material);
    if (entry) {
      entry.nombre = mat.nombre;
      entry.codigo = mat.codigo;
    }
  }

  const materiales: FilaMaterial[] = Array.from(porMaterial.entries())
    .map(([id_material, v]) => ({
      id_material,
      ...v,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 20)
    .map(({ id_material, ...r }) => ({
      codigo: r.codigo,
      nombre: r.nombre,
      cantidad: Math.round(r.cantidad * 100) / 100,
    }));

  // ---- filas tabla plana para export antiguo ----
  const filasTabla = filas.map((f) => ({
    OT: f.codigo,
    Fecha: f.fecha,
    Cliente: f.cliente,
    Maquina: f.maquina,
    Tecnico: f.tecnico,
    Tipo: f.tipo,
    Prioridad: f.prioridad,
    Estado: f.estado,
    Diagnostico: f.diagnostico,
    "Fecha Inicio": f.fecha_inicio,
    "Fecha Fin": f.fecha_fin,
    Dias: f.dias ?? "",
    Materiales: f.materiales,
    Monto: f.monto ?? "",
    "Trabajo Realizado": f.trabajo_realizado ?? "",
  }));

  const vm: ReporteOrdenesVM = {
    titulo: "Reporte operativo de órdenes de trabajo",
    subtitulo: "Órdenes, materiales, técnicos y cumplimiento por período",
    generado_por: generadoPor,
    generado_en: fechaHoraCorta(new Date()),
    periodo: `${fechaCorta(desde)} — ${fechaCorta(hasta)}`,
    filtros_aplicados: [],
    kpis: [
      {
        etiqueta: "Órdenes",
        valor: numero(filas.length),
        subtexto: "creadas en el período",
        tono: "primary",
      },
      {
        etiqueta: "Finalizadas",
        valor: numero(totalFinalizadas),
        subtexto: `cumplimiento ${porcentaje(cumplimientoGeneral)}`,
        tono: "success",
      },
      {
        etiqueta: "En proceso",
        valor: numero(filas.filter((f) => f.estado === "En proceso").length),
        tono: "info",
      },
      {
        etiqueta: "Pendientes",
        valor: numero(filas.filter((f) => f.estado === "Pendiente").length),
        tono: "warning",
      },
      {
        etiqueta: "Canceladas",
        valor: numero(filas.filter((f) => f.estado === "Cancelada").length),
        tono: "danger",
      },
      {
        etiqueta: "% Cumplimiento",
        valor: porcentaje(cumplimientoGeneral),
        subtexto: "finalizadas / total",
        tono: "success",
      },
      {
        etiqueta: "Monto total",
        valor: moneda(redondear(montoTotal, 2)),
        subtexto: "suma de montos de las órdenes",
        tono: "primary",
      },
      {
        etiqueta: "Tiempo promedio",
        valor: horasPromedio !== null ? `${dias(horasPromedio)}` : "—",
        subtexto: "inicio → fin",
        tono: "info",
      },
    ],
    estados,
    tecnicos,
    clientes,
    materiales,
    filas,
    totales: {
      ordenes: filas.length,
      monto_total: redondear(montoTotal, 2),
      horas_promedio: horasPromedio,
    },
    filasTabla,
  };

  return { vm, totalRegistros };
}
