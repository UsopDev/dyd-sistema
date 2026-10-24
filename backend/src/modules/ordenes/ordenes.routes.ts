import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { siguienteCodigo } from "../../lib/codigos.js";
import { requireRol } from "../../middleware/auth.js";
import type { SesionUsuario } from "../../lib/jwt.js";

export const ordenesRouter = Router();

const soloAdmin = requireRol("ADMINISTRADOR");

const MAXIMO = 99999999.99;

const estadoSchema = z.enum(["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"]);

const idSchema = z.object({ id: z.uuid() });

const crearSchema = z.object({
  id_solicitud: z.uuid(),
  id_tecnico: z.uuid(),
  monto: z.number().min(0).max(MAXIMO).optional(),
});

const materialSchema = z.object({
  id_material: z.uuid(),
  cantidad: z.number().positive().max(MAXIMO),
});

const finalizarSchema = z.object({
  trabajo_realizado: z.string().trim().min(5).max(5000),
  monto: z.number().min(0).max(MAXIMO).optional(),
});

const listarSchema = z.object({
  q: z.string().trim().max(50).optional(),
  estado: estadoSchema.optional(),
  id_tecnico: z.uuid().optional(),
  id_solicitud: z.uuid().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

const resumen = {
  solicitud: { select: { id_solicitud: true, codigo: true, estado: true } },
  tecnico: { select: { id_usuario: true, nombres: true, apellidos: true } },
} as const;

const detalle = {
  solicitud: {
    select: {
      id_solicitud: true,
      codigo: true,
      estado: true,
      tipo_servicio: true,
      prioridad: true,
      descripcion: true,
      maquina: { select: { id_maquina: true, codigo: true, nombre: true } },
      cliente: { select: { id_cliente: true, razon_social: true } },
    },
  },
  diagnostico: {
    select: {
      id_diagnostico: true,
      estado_general: true,
      fallas_detectadas: true,
      recomendaciones: true,
    },
  },
  tecnico: { select: { id_usuario: true, nombres: true, apellidos: true } },
  materiales: {
    include: { material: { select: { codigo: true, nombre: true, unidad: true } } },
  },
} as const;

function conSubtotales<T extends { materiales: Array<{ cantidad: unknown; precio_unitario: unknown }> }>(
  orden: T,
) {
  return {
    ...orden,
    materiales: orden.materiales.map((m) => ({
      ...m,
      subtotal:
        m.precio_unitario === null
          ? null
          : (Number(m.cantidad) * Number(m.precio_unitario)).toFixed(2),
    })),
  };
}

// Carga la orden solo si el usuario puede operarla: su técnico asignado o un administrador.
// Para cualquier otro responde 404, así no se revela que la orden existe.
async function ordenParaOperar(id: string, res: Response) {
  const sesion = res.locals.sesion as SesionUsuario;

  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id_orden_trabajo: id },
    select: { id_orden_trabajo: true, codigo: true, id_solicitud: true, id_tecnico: true },
  });

  if (!orden || (sesion.rol !== "ADMINISTRADOR" && orden.id_tecnico !== sesion.id)) {
    res.status(404).json({ error: "Orden no encontrada" });
    return null;
  }

  return orden;
}

ordenesRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res);
  if (!filtros) return;

  const sesion = res.locals.sesion as SesionUsuario;
  const esAdmin = sesion.rol === "ADMINISTRADOR";

  const where = {
    // Un técnico solo ve sus órdenes, aunque pida otra cosa en el filtro.
    ...(esAdmin
      ? filtros.id_tecnico
        ? { id_tecnico: filtros.id_tecnico }
        : {}
      : { id_tecnico: sesion.id }),
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.id_solicitud ? { id_solicitud: filtros.id_solicitud } : {}),
    ...(filtros.q ? { codigo: { contains: filtros.q, mode: "insensitive" as const } } : {}),
  };

  const [ordenes, total] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      where,
      include: resumen,
      orderBy: { creado_en: "desc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.ordenTrabajo.count({ where }),
  ]);

  res.json({ ordenes, total, pagina: filtros.pagina, limite: filtros.limite });
});

ordenesRouter.post("/", soloAdmin, async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id_solicitud: datos.id_solicitud },
    select: { id_solicitud: true, diagnostico: { select: { id_diagnostico: true } } },
  });

  if (!solicitud) {
    res.status(400).json({ error: "La solicitud indicada no existe" });
    return;
  }

  if (!solicitud.diagnostico) {
    res.status(409).json({ error: "La solicitud todavía no tiene diagnóstico" });
    return;
  }

  const tecnico = await prisma.usuario.findUnique({ where: { id_usuario: datos.id_tecnico } });

  if (!tecnico || !tecnico.activo) {
    res.status(400).json({ error: "El técnico indicado no existe o está desactivado" });
    return;
  }

  // Monto: el enviado o, si no hay, el total de la última cotización.
  let monto = datos.monto;

  if (monto === undefined) {
    const ultima = await prisma.cotizacion.findFirst({
      where: { id_solicitud: solicitud.id_solicitud },
      orderBy: { fecha: "desc" },
      select: { total: true },
    });
    monto = ultima ? Number(ultima.total) : undefined;
  }

  const codigo = await siguienteCodigo("orden");
  const idDiagnostico = solicitud.diagnostico.id_diagnostico;

  const orden = await prisma.$transaction(async (tx) => {
    const movida = await tx.solicitud.updateMany({
      where: {
        id_solicitud: solicitud.id_solicitud,
        estado: { in: ["EN_DIAGNOSTICO", "COTIZADA"] },
      },
      data: { estado: "ASIGNADA" },
    });

    if (movida.count === 0) return null;

    return tx.ordenTrabajo.create({
      data: {
        codigo,
        id_solicitud: solicitud.id_solicitud,
        id_diagnostico: idDiagnostico,
        id_tecnico: tecnico.id_usuario,
        monto,
      },
      include: resumen,
    });
  });

  if (!orden) {
    res.status(409).json({
      error: "Solo se puede asignar una solicitud con diagnóstico, sin orden y no cancelada",
    });
    return;
  }

  res.status(201).json({ orden });
});

ordenesRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  if (!(await ordenParaOperar(params.id, res))) return;

  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id_orden_trabajo: params.id },
    include: detalle,
  });

  if (!orden) {
    res.status(404).json({ error: "Orden no encontrada" });
    return;
  }

  res.json({ orden: conSubtotales(orden) });
});

ordenesRouter.post("/:id/iniciar", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const orden = await ordenParaOperar(params.id, res);
  if (!orden) return;

  const iniciada = await prisma.$transaction(async (tx) => {
    const movida = await tx.ordenTrabajo.updateMany({
      where: { id_orden_trabajo: orden.id_orden_trabajo, estado: "PENDIENTE" },
      data: { estado: "EN_PROCESO", fecha_inicio: new Date() },
    });

    if (movida.count === 0) return false;

    await tx.solicitud.updateMany({
      where: { id_solicitud: orden.id_solicitud, estado: "ASIGNADA" },
      data: { estado: "EN_PROCESO" },
    });

    return true;
  });

  if (!iniciada) {
    res.status(409).json({ error: "Solo se puede iniciar una orden en estado PENDIENTE" });
    return;
  }

  const actualizada = await prisma.ordenTrabajo.findUnique({
    where: { id_orden_trabajo: orden.id_orden_trabajo },
    include: resumen,
  });

  res.json({ orden: actualizada });
});

// Registra un material usado: descuenta el stock, deja el movimiento y suma la línea de la orden,
// todo en una transacción. Si algo falla, no se aplica nada.
ordenesRouter.post("/:id/materiales", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(materialSchema, req.body, res);
  if (!datos) return;

  const orden = await ordenParaOperar(params.id, res);
  if (!orden) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const resultado = await prisma.$transaction(async (tx) => {
    // Este UPDATE sin cambios verifica que la orden siga EN_PROCESO y bloquea su fila:
    // si otro proceso la finaliza al mismo tiempo, uno de los dos espera al otro.
    const viva = await tx.ordenTrabajo.updateMany({
      where: { id_orden_trabajo: orden.id_orden_trabajo, estado: "EN_PROCESO" },
      data: { estado: "EN_PROCESO" },
    });

    if (viva.count === 0) return "ORDEN_NO_EN_PROCESO" as const;

    const material = await tx.material.findUnique({ where: { id_material: datos.id_material } });

    if (!material || !material.activo) return "MATERIAL_INVALIDO" as const;

    // La condición de stock va dentro del UPDATE: dos descuentos simultáneos no pueden pasarse.
    const descontado = await tx.material.updateMany({
      where: { id_material: material.id_material, stock_actual: { gte: datos.cantidad } },
      data: { stock_actual: { decrement: datos.cantidad } },
    });

    if (descontado.count === 0) return "STOCK_INSUFICIENTE" as const;

    await tx.movimientoInventario.create({
      data: {
        id_material: material.id_material,
        id_usuario: sesion.id,
        id_orden_trabajo: orden.id_orden_trabajo,
        tipo: "SALIDA",
        cantidad: datos.cantidad,
        motivo: `Orden ${orden.codigo ?? orden.id_orden_trabajo}`,
      },
    });

    return tx.ordenMaterial.upsert({
      where: {
        id_orden_trabajo_id_material: {
          id_orden_trabajo: orden.id_orden_trabajo,
          id_material: material.id_material,
        },
      },
      create: {
        id_orden_trabajo: orden.id_orden_trabajo,
        id_material: material.id_material,
        cantidad: datos.cantidad,
        precio_unitario: material.precio_unitario,
      },
      update: { cantidad: { increment: datos.cantidad } },
    });
  });

  if (resultado === "ORDEN_NO_EN_PROCESO") {
    res.status(409).json({ error: "Solo se pueden registrar materiales en una orden EN_PROCESO" });
    return;
  }

  if (resultado === "MATERIAL_INVALIDO") {
    res.status(400).json({ error: "El material no existe o está desactivado" });
    return;
  }

  if (resultado === "STOCK_INSUFICIENTE") {
    res.status(409).json({ error: "Stock insuficiente para este material" });
    return;
  }

  res.status(201).json({ linea: resultado });
});

ordenesRouter.post("/:id/finalizar", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(finalizarSchema, req.body, res);
  if (!datos) return;

  const orden = await ordenParaOperar(params.id, res);
  if (!orden) return;

  const finalizada = await prisma.$transaction(async (tx) => {
    const movida = await tx.ordenTrabajo.updateMany({
      where: { id_orden_trabajo: orden.id_orden_trabajo, estado: "EN_PROCESO" },
      data: {
        estado: "FINALIZADA",
        fecha_fin: new Date(),
        trabajo_realizado: datos.trabajo_realizado,
        ...(datos.monto !== undefined ? { monto: datos.monto } : {}),
      },
    });

    if (movida.count === 0) return false;

    await tx.solicitud.updateMany({
      where: { id_solicitud: orden.id_solicitud, estado: "EN_PROCESO" },
      data: { estado: "FINALIZADA" },
    });

    return true;
  });

  if (!finalizada) {
    res.status(409).json({ error: "Solo se puede finalizar una orden en estado EN_PROCESO" });
    return;
  }

  const actualizada = await prisma.ordenTrabajo.findUnique({
    where: { id_orden_trabajo: orden.id_orden_trabajo },
    include: resumen,
  });

  res.json({ orden: actualizada });
});

ordenesRouter.post("/:id/cancelar", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const orden = await ordenParaOperar(params.id, res);
  if (!orden) return;

  const cancelada = await prisma.$transaction(async (tx) => {
    const movida = await tx.ordenTrabajo.updateMany({
      where: { id_orden_trabajo: orden.id_orden_trabajo, estado: "PENDIENTE" },
      data: { estado: "CANCELADA" },
    });

    if (movida.count === 0) return false;

    await tx.solicitud.updateMany({
      where: { id_solicitud: orden.id_solicitud, estado: "ASIGNADA" },
      data: { estado: "CANCELADA" },
    });

    return true;
  });

  if (!cancelada) {
    res.status(409).json({ error: "Solo se puede cancelar una orden en estado PENDIENTE" });
    return;
  }

  const actualizada = await prisma.ordenTrabajo.findUnique({
    where: { id_orden_trabajo: orden.id_orden_trabajo },
    include: resumen,
  });

  res.json({ orden: actualizada });
});
