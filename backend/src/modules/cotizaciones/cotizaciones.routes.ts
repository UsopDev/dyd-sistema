import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { siguienteCodigo } from "../../lib/codigos.js";
import type { SesionUsuario } from "../../lib/jwt.js";

export const cotizacionesRouter = Router();

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

const listarSchema = z.object({
  id_solicitud: z.uuid().optional(),
  q: z.string().trim().max(50).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

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

function conSubtotales<T extends { detalles: Array<{ cantidad: unknown; precio_unitario: unknown }> }>(
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

cotizacionesRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res);
  if (!filtros) return;

  const where = {
    ...(filtros.id_solicitud ? { id_solicitud: filtros.id_solicitud } : {}),
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

  // Materiales de todas las líneas, en una sola consulta.
  const idsMaterial = [
    ...new Set(datos.detalles.flatMap((d) => (d.id_material ? [d.id_material] : []))),
  ];
  const materiales = idsMaterial.length
    ? await prisma.material.findMany({ where: { id_material: { in: idsMaterial } } })
    : [];
  const porId = new Map(materiales.map((m) => [m.id_material, m]));

  const lineas: Linea[] = [];

  for (const [indice, d] of datos.detalles.entries()) {
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
      return;
    }

    const precio =
      d.precio_unitario ??
      (material.precio_unitario !== null ? Number(material.precio_unitario) : undefined);

    if (precio === undefined) {
      res.status(400).json({
        error: `La línea ${numero} necesita precio: el material no tiene uno registrado`,
      });
      return;
    }

    lineas.push({
      tipo: "MATERIAL",
      descripcion: d.descripcion ?? material.nombre,
      id_material: material.id_material,
      cantidad: d.cantidad,
      precio_unitario: precio,
    });
  }

  // El total se calcula aquí, en centavos enteros para evitar errores de decimales.
  const centavos = lineas.reduce(
    (suma, l) => suma + Math.round(l.cantidad * l.precio_unitario * 100),
    0,
  );

  if (centavos > Math.round(MAXIMO * 100)) {
    res.status(400).json({ error: "El total de la cotización excede el máximo permitido" });
    return;
  }

  const codigo = await siguienteCodigo("cotizacion");

  // La solicitud pasa a COTIZADA y se crea la cotización en un solo paso atómico.
  const cotizacion = await prisma.$transaction(async (tx) => {
    const movida = await tx.solicitud.updateMany({
      where: {
        id_solicitud: solicitud.id_solicitud,
        estado: { in: ["EN_DIAGNOSTICO", "COTIZADA"] },
      },
      data: { estado: "COTIZADA" },
    });

    if (movida.count === 0) return null;

    return tx.cotizacion.create({
      data: {
        codigo,
        id_solicitud: solicitud.id_solicitud,
        id_usuario: sesion.id,
        total: centavos / 100,
        observaciones: datos.observaciones,
        detalles: { create: lineas },
      },
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
