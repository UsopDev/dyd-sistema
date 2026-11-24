import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { siguienteCodigo } from "../../lib/codigos.js";
import { requireRol } from "../../middleware/auth.js";
import type { SesionUsuario } from "../../lib/jwt.js";
import { whereRangoFecha, rangosFechaCampos } from "../../lib/filtros.js";

export const cotizacionesRouter = Router();

const soloAdmin = requireRol("ADMINISTRADOR");

const MAXIMO = 99999999.99;

const idSchema = z.object({ id: z.uuid() });

const lineaSchema = z
  .object({
    tipo: z.enum(["SERVICIO", "MATERIAL"]),
    descripcion: z.string().trim().min(1).max(200).optional(),
    id_material: z.uuid().optional(),
    cantidad: z.number().positive().max(MAXIMO),
    precio_unitario: z.number().min(0).max(MAXIMO).optional(),
  })
  .superRefine((linea, ctx) => {
    if (linea.tipo === "SERVICIO") {
      if (linea.id_material) {
        ctx.addIssue({ code: "custom", message: "Un servicio no lleva material", path: ["id_material"] });
      }
      if (!linea.descripcion) {
        ctx.addIssue({ code: "custom", message: "La descripción es obligatoria", path: ["descripcion"] });
      }
      if (linea.precio_unitario === undefined) {
        ctx.addIssue({ code: "custom", message: "El precio es obligatorio", path: ["precio_unitario"] });
      }
    } else if (!linea.id_material) {
      ctx.addIssue({ code: "custom", message: "Indica el material", path: ["id_material"] });
    }
  });

const crearSchema = z.object({
  id_solicitud: z.uuid(),
  observaciones: z.string().trim().min(1).max(2000).nullable().optional(),
  detalles: z.array(lineaSchema).min(1).max(50),
});

const actualizarSchema = z
  .object({
    observaciones: z.string().trim().min(1).max(2000).nullable().optional(),
    detalles: z.array(lineaSchema).min(1).max(50).optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" });

const listarSchema = z.object({
  id_solicitud: z.uuid().optional(),
  q: z.string().trim().max(50).optional(),
  total_min: z.coerce.number().min(0).optional(),
  total_max: z.coerce.number().min(0).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
}).merge(
  rangosFechaCampos("fecha", "actualizado_en"),
);

const resumen = {
  solicitud: { select: { id_solicitud: true, codigo: true, estado: true } },
  usuario: { select: { id_usuario: true, nombres: true, apellidos: true } },
} as const;

const conDetalles = {
  ...resumen,
  detalles: {
    orderBy: [{ tipo: "asc" as const }, { descripcion: "asc" as const }],
  },
};

function conSubtotales<T extends { detalles: Array<{ cantidad: { toString: () => string }; precio_unitario: { toString: () => string } }> }>(
  cotizacion: T,
) {
  return {
    ...cotizacion,
    detalles: cotizacion.detalles.map((d) => ({
      ...d,
      subtotal: (Number(d.cantidad) * Number(d.precio_unitario)).toFixed(2),
    })),
  };
}

interface Linea {
  tipo: "SERVICIO" | "MATERIAL";
  descripcion: string;
  id_material: string | null;
  cantidad: number;
  precio_unitario: number;
}

async function validarYObtenerLineas(detalles: z.output<typeof lineaSchema>[], res: Response): Promise<Linea[] | undefined> {
  const idsMaterial = [
    ...new Set(detalles.flatMap((d) => (d.id_material ? [d.id_material] : []))),
  ];
  const materiales = idsMaterial.length
    ? await prisma.material.findMany({ where: { id_material: { in: idsMaterial } } })
    : [];
  const porId = new Map(materiales.map((m) => [m.id_material, m]));

  const lineas: Linea[] = [];

  for (const [indice, d] of detalles.entries()) {
    const numero = indice + 1;

    if (d.tipo === "SERVICIO") {
      lineas.push({
        tipo: "SERVICIO",
        descripcion: d.descripcion ?? "",
        id_material: null,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario ?? 0,
      });
      continue;
    }

    const material = d.id_material ? porId.get(d.id_material) : undefined;

    if (!material || !material.activo) {
      res.status(400).json({ error: `El material de la línea ${numero} no existe o está desactivado` });
      return undefined;
    }

    const precio =
      d.precio_unitario ??
      (material.precio_unitario !== null ? +material.precio_unitario : undefined);

    if (precio === undefined) {
      res.status(400).json({
        error: `La línea ${numero} necesita precio: el material no tiene uno registrado`,
      });
      return undefined;
    }

    lineas.push({
      tipo: "MATERIAL",
      descripcion: d.descripcion ?? material.nombre,
      id_material: material.id_material,
      cantidad: d.cantidad,
      precio_unitario: precio,
    });
  }

  const centavos = lineas.reduce(
    (suma, l) => suma + Math.round(l.cantidad * l.precio_unitario * 100),
    0,
  );

  if (centavos > Math.round(MAXIMO * 100)) {
    res.status(400).json({ error: "El total de la cotización excede el máximo permitido" });
    return undefined;
  }

  return lineas;
}

cotizacionesRouter.get("/", async (req, res) => {
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
    ...whereRangoFecha("fecha", filtros.fecha_desde, filtros.fecha_hasta),
    ...whereRangoFecha("actualizado_en", filtros.actualizado_en_desde, filtros.actualizado_en_hasta),
    ...(filtros.total_min !== undefined || filtros.total_max !== undefined
      ? {
          total: {
            ...(filtros.total_min !== undefined ? { gte: filtros.total_min } : {}),
            ...(filtros.total_max !== undefined ? { lte: filtros.total_max } : {}),
          },
        }
      : {}),
    ...(filtros.q ? { codigo: { contains: filtros.q, mode: "insensitive" as const } } : {}),
  };

  const [cotizaciones, total] = await Promise.all([
    prisma.cotizacion.findMany({
      where,
      include: resumen,
      orderBy: { fecha: "desc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.cotizacion.count({ where }),
  ]);

  res.json({ cotizaciones, total, pagina: filtros.pagina, limite: filtros.limite });
});

cotizacionesRouter.post("/", async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id_solicitud: datos.id_solicitud },
    select: { id_solicitud: true },
  });

  if (!solicitud) {
    res.status(400).json({ error: "La solicitud indicada no existe" });
    return;
  }

  const lineas = await validarYObtenerLineas(datos.detalles, res);
  if (!lineas) return;

  const codigo = await siguienteCodigo("cotizacion");

  const cotizacion = await prisma.$transaction(async (tx) => {
    const movida = await tx.solicitud.updateMany({
      where: {
        id_solicitud: solicitud.id_solicitud,
        estado: { in: ["EN_DIAGNOSTICO", "COTIZADA"] },
      },
      data: { estado: "COTIZADA" },
    });

    if (movida.count === 0) return null;

    const data = {
        codigo,
        id_solicitud: solicitud.id_solicitud,
        id_usuario: sesion.id,
        total: lineas.reduce((suma, l) => suma + Math.round(l.cantidad * l.precio_unitario * 100), 0) / 100,
        ...(datos.observaciones !== undefined ? { observaciones: datos.observaciones } : {}),
        detalles: { create: lineas },
      };
    return tx.cotizacion.create({
      data,
      include: conDetalles,
    });
  });

  if (!cotizacion) {
    res.status(409).json({
      error: "Solo se puede cotizar una solicitud con diagnóstico (EN_DIAGNOSTICO o COTIZADA)",
    });
    return;
  }

  res.status(201).json({ cotizacion: conSubtotales(cotizacion) });
});

cotizacionesRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id_cotizacion: params.id },
    include: conDetalles,
  });

  if (!cotizacion) {
    res.status(404).json({ error: "Cotización no encontrada" });
    return;
  }

  res.json({ cotizacion: conSubtotales(cotizacion) });
});

// PATCH /:id - Editar cotización (solo ADMIN, solo si solicitud está COTIZADA)
cotizacionesRouter.patch("/:id", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const existente = await prisma.cotizacion.findUnique({
    where: { id_cotizacion: params.id },
    include: { solicitud: { select: { estado: true } } },
  });

  if (!existente) {
    res.status(404).json({ error: "Cotización no encontrada" });
    return;
  }

  if (existente.solicitud.estado !== "COTIZADA") {
    res.status(409).json({ error: "Solo se puede editar una cotización mientras la solicitud está en COTIZADA" });
    return;
  }

  let lineas: Linea[] | undefined;
  if (datos.detalles) {
    lineas = await validarYObtenerLineas(datos.detalles, res);
    if (!lineas) return;
  }

  const centavos = lineas
    ? lineas.reduce((suma, l) => suma + Math.round(l.cantidad * l.precio_unitario * 100), 0)
    : undefined;

  const actualizada = await prisma.$transaction(async (tx) => {
    // Verificar que la solicitud siga en COTIZADA
    const movida = await tx.solicitud.updateMany({
      where: { id_solicitud: existente.id_solicitud, estado: "COTIZADA" },
      data: { estado: "COTIZADA" }, // no-op, solo verifica
    });

    if (movida.count === 0) return null;

    const updateData = {
        ...(datos.observaciones !== undefined ? { observaciones: datos.observaciones } : {}),
        ...(centavos !== undefined ? { total: centavos / 100 } : {}),
        ...(lineas
          ? {
              detalles: {
                deleteMany: {},
                create: lineas,
              },
            }
          : {}),
      };
    return tx.cotizacion.update({
      where: { id_cotizacion: params.id },
      data: updateData,
      include: conDetalles,
    });
  });

  if (!actualizada) {
    res.status(409).json({ error: "La solicitud ya no está en estado COTIZADA" });
    return;
  }

  res.json({ cotizacion: conSubtotales(actualizada) });
});

// POST /:id/aprobar - Aprobar cotización (solo ADMIN)
cotizacionesRouter.post("/:id/aprobar", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id_cotizacion: params.id },
    include: { solicitud: { select: { estado: true, id_solicitud: true } } },
  });

  if (!cotizacion) {
    res.status(404).json({ error: "Cotización no encontrada" });
    return;
  }

  if (cotizacion.solicitud.estado !== "COTIZADA") {
    res.status(409).json({ error: "Solo se puede aprobar una cotización con la solicitud en COTIZADA" });
    return;
  }

  // La aprobación es solo un marcador: la solicitud sigue en COTIZADA hasta que se cree la orden
  // Podríamos agregar un campo 'aprobada' en Cotizacion, pero por ahora solo validamos
  res.json({ mensaje: "Cotización aprobada. Puede crear la orden de trabajo.", cotizacion });
});

// POST /:id/rechazar - Rechazar cotización (solo ADMIN) -> solicitud vuelve a EN_DIAGNOSTICO
cotizacionesRouter.post("/:id/rechazar", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id_cotizacion: params.id },
    include: { solicitud: { select: { estado: true, id_solicitud: true } } },
  });

  if (!cotizacion) {
    res.status(404).json({ error: "Cotización no encontrada" });
    return;
  }

  if (cotizacion.solicitud.estado !== "COTIZADA") {
    res.status(409).json({ error: "Solo se puede rechazar una cotización con la solicitud en COTIZADA" });
    return;
  }

  const rechazada = await prisma.$transaction(async (tx) => {
    const movida = await tx.solicitud.updateMany({
      where: { id_solicitud: cotizacion.id_solicitud, estado: "COTIZADA" },
      data: { estado: "EN_DIAGNOSTICO" },
    });

    if (movida.count === 0) return null;

    return tx.cotizacion.findUnique({
      where: { id_cotizacion: params.id },
      include: conDetalles,
    });
  });

  if (!rechazada) {
    res.status(409).json({ error: "La solicitud ya no está en estado COTIZADA" });
    return;
  }

  res.json({ mensaje: "Cotización rechazada. La solicitud vuelve a EN_DIAGNOSTICO.", cotizacion: conSubtotales(rechazada) });
});

// DELETE /:id - Eliminar cotización (solo ADMIN, solo si solicitud está COTIZADA)
cotizacionesRouter.delete("/:id", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id_cotizacion: params.id },
    include: { solicitud: { select: { estado: true, id_solicitud: true } } },
  });

  if (!cotizacion) {
    res.status(404).json({ error: "Cotización no encontrada" });
    return;
  }

  if (cotizacion.solicitud.estado !== "COTIZADA") {
    res.status(409).json({ error: "Solo se puede eliminar una cotización con la solicitud en COTIZADA" });
    return;
  }

  const eliminada = await prisma.$transaction(async (tx) => {
    const movida = await tx.solicitud.updateMany({
      where: { id_solicitud: cotizacion.id_solicitud, estado: "COTIZADA" },
      data: { estado: "EN_DIAGNOSTICO" },
    });

    if (movida.count === 0) return false;

    await tx.cotizacion.delete({ where: { id_cotizacion: params.id } });
    return true;
  });

  if (!eliminada) {
    res.status(409).json({ error: "La solicitud ya no está en estado COTIZADA" });
    return;
  }

  res.status(204).end();
});