import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { requireRol } from "../../middleware/auth.js";

export const clientesRouter = Router();

const soloAdmin = requireRol("ADMINISTRADOR");

const texto = (max: number) => z.string().trim().min(1).max(max).nullable().optional();

const idSchema = z.object({ id: z.uuid() });

const crearSchema = z.object({
  razon_social: z.string().trim().min(1).max(150),
  ruc_dni: texto(15),
  contacto: texto(100),
  telefono: texto(20),
  email: z.email().max(120).nullable().optional(),
  direccion: texto(200),
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

clientesRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res);
  if (!filtros) return;

  const where = {
    ...(filtros.activo ? { activo: filtros.activo === "true" } : {}),
    ...(filtros.q
      ? {
          OR: [
            { razon_social: { contains: filtros.q, mode: "insensitive" as const } },
            { ruc_dni: { contains: filtros.q, mode: "insensitive" as const } },
            { contacto: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { razon_social: "asc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.cliente.count({ where }),
  ]);

  res.json({ clientes, total, pagina: filtros.pagina, limite: filtros.limite });
});

clientesRouter.post("/", soloAdmin, async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  if (datos.ruc_dni) {
    const repetido = await prisma.cliente.findUnique({ where: { ruc_dni: datos.ruc_dni } });
    if (repetido) {
      res.status(409).json({ error: "Ya existe un cliente con ese RUC/DNI" });
      return;
    }
  }

  const cliente = await prisma.cliente.create({ data: datos });
  res.status(201).json({ cliente });
});

clientesRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const cliente = await prisma.cliente.findUnique({
    where: { id_cliente: params.id },
    include: { _count: { select: { maquinas: true, solicitudes: true } } },
  });

  if (!cliente) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }

  res.json({ cliente });
});

clientesRouter.patch("/:id", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const existente = await prisma.cliente.findUnique({ where: { id_cliente: params.id } });

  if (!existente) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }

  if (datos.ruc_dni) {
    const repetido = await prisma.cliente.findUnique({ where: { ruc_dni: datos.ruc_dni } });
    if (repetido && repetido.id_cliente !== params.id) {
      res.status(409).json({ error: "Ya existe un cliente con ese RUC/DNI" });
      return;
    }
  }

  const cliente = await prisma.cliente.update({ where: { id_cliente: params.id }, data: datos });
  res.json({ cliente });
});
