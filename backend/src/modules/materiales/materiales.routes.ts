import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { requireRol } from "../../middleware/auth.js";
import type { SesionUsuario } from "../../lib/jwt.js";

export const materialesRouter = Router();

const soloAdmin = requireRol("ADMINISTRADOR");

const texto = (max: number) => z.string().trim().min(1).max(max).nullable().optional();

const MAXIMO = 99999999.99;

const idSchema = z.object({ id: z.uuid() });

// El stock_actual no se envía aquí: solo cambia mediante movimientos.
const crearSchema = z.object({
  codigo: texto(30),
  nombre: z.string().trim().min(1).max(100),
  unidad: z.string().trim().min(1).max(20),
  stock_minimo: z.number().min(0).max(MAXIMO).optional(),
  precio_unitario: z.number().min(0).max(MAXIMO).nullable().optional(),
});

const actualizarSchema = crearSchema
  .partial()
  .extend({ activo: z.boolean().optional() })
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" });

const listarSchema = z.object({
  q: z.string().trim().max(100).optional(),
  activo: z.enum(["true", "false"]).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

const paginacionSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

const movimientoSchema = z.object({
  tipo: z.enum(["ENTRADA", "SALIDA"]),
  cantidad: z.number().positive().max(MAXIMO),
  motivo: z.string().trim().min(1).max(150).optional(),
});

materialesRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res);
  if (!filtros) return;

  const where = {
    ...(filtros.activo ? { activo: filtros.activo === "true" } : {}),
    ...(filtros.q
      ? {
          OR: [
            { nombre: { contains: filtros.q, mode: "insensitive" as const } },
            { codigo: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [materiales, total] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.material.count({ where }),
  ]);

  res.json({ materiales, total, pagina: filtros.pagina, limite: filtros.limite });
});

// Prisma no compara dos columnas entre sí, por eso esta consulta es SQL directo.
// Debe ir antes de "/:id" para que "stock-bajo" no se interprete como un id.
materialesRouter.get("/stock-bajo", async (_req, res) => {
  const materiales = await prisma.$queryRaw<
    Array<{
      id_material: string;
      codigo: string | null;
      nombre: string;
      unidad: string;
      stock_actual: unknown;
      stock_minimo: unknown;
    }>
  >`
    SELECT id_material, codigo, nombre, unidad, stock_actual, stock_minimo
    FROM materiales
    WHERE activo = true AND stock_minimo > 0 AND stock_actual <= stock_minimo
    ORDER BY nombre ASC
  `;

  res.json({ materiales, total: materiales.length });
});

materialesRouter.post("/", soloAdmin, async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  if (datos.codigo) {
    const repetido = await prisma.material.findUnique({ where: { codigo: datos.codigo } });
    if (repetido) {
      res.status(409).json({ error: "Ya existe un material con ese código" });
      return;
    }
  }

  const material = await prisma.material.create({ data: datos });
  res.status(201).json({ material });
});

materialesRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const material = await prisma.material.findUnique({ where: { id_material: params.id } });

  if (!material) {
    res.status(404).json({ error: "Material no encontrado" });
    return;
  }

  res.json({ material });
});

materialesRouter.patch("/:id", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const existente = await prisma.material.findUnique({ where: { id_material: params.id } });

  if (!existente) {
    res.status(404).json({ error: "Material no encontrado" });
    return;
  }

  if (datos.codigo) {
    const repetido = await prisma.material.findUnique({ where: { codigo: datos.codigo } });
    if (repetido && repetido.id_material !== params.id) {
      res.status(409).json({ error: "Ya existe un material con ese código" });
      return;
    }
  }

  const material = await prisma.material.update({ where: { id_material: params.id }, data: datos });
  res.json({ material });
});

materialesRouter.post("/:id/movimientos", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(movimientoSchema, req.body, res);
  if (!datos) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const material = await prisma.material.findUnique({ where: { id_material: params.id } });

  if (!material) {
    res.status(404).json({ error: "Material no encontrado" });
    return;
  }

  if (!material.activo) {
    res.status(400).json({ error: "El material está desactivado" });
    return;
  }

  // Todo en una transacción: o se actualiza el stock Y se registra el movimiento, o no se hace nada.
  const resultado = await prisma.$transaction(async (tx) => {
    // En una salida, la condición stock_actual >= cantidad va dentro del propio UPDATE,
    // así dos descuentos simultáneos no pueden dejar el stock en negativo.
    const where =
      datos.tipo === "SALIDA"
        ? { id_material: params.id, stock_actual: { gte: datos.cantidad } }
        : { id_material: params.id };

    const actualizados = await tx.material.updateMany({
      where,
      data:
        datos.tipo === "ENTRADA"
          ? { stock_actual: { increment: datos.cantidad } }
          : { stock_actual: { decrement: datos.cantidad } },
    });

    if (actualizados.count === 0) return null;

    const movimiento = await tx.movimientoInventario.create({
      data: {
        id_material: params.id,
        id_usuario: sesion.id,
        tipo: datos.tipo,
        cantidad: datos.cantidad,
        motivo: datos.motivo,
      },
    });

    const actual = await tx.material.findUnique({
      where: { id_material: params.id },
      select: { stock_actual: true },
    });

    return { movimiento, stock_actual: actual?.stock_actual };
  });

  if (!resultado) {
    res.status(409).json({ error: "Stock insuficiente para esta salida" });
    return;
  }

  res.status(201).json(resultado);
});

materialesRouter.get("/:id/movimientos", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const paginacion = validar(paginacionSchema, req.query, res);
  if (!paginacion) return;

  const existente = await prisma.material.findUnique({ where: { id_material: params.id } });

  if (!existente) {
    res.status(404).json({ error: "Material no encontrado" });
    return;
  }

  const where = { id_material: params.id };

  const [movimientos, total] = await Promise.all([
    prisma.movimientoInventario.findMany({
      where,
      include: { usuario: { select: { nombres: true, apellidos: true } } },
      orderBy: { fecha: "desc" },
      skip: (paginacion.pagina - 1) * paginacion.limite,
      take: paginacion.limite,
    }),
    prisma.movimientoInventario.count({ where }),
  ]);

  res.json({ movimientos, total, pagina: paginacion.pagina, limite: paginacion.limite });
});
