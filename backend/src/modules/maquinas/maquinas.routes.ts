import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { requireRol } from "../../middleware/auth.js";
import { whereRangoFecha, rangosFechaCampos } from "../../lib/filtros.js";
import type { EstadoMaquina } from "@prisma/client";

export const maquinasRouter = Router();

const soloAdmin = requireRol("ADMINISTRADOR");

const texto = (max: number) =>
  z.string().trim().min(1).max(max).nullable().optional();

const estadoSchema = z.enum([
  "OPERATIVA",
  "EN_MANTENIMIENTO",
  "FUERA_DE_SERVICIO",
]);

const idSchema = z.object({ id: z.uuid() });

// Sin valores por defecto en Zod: los omitidos usan el valor por defecto de la base de datos.
const crearSchema = z.object({
  id_cliente: z.uuid().nullable().optional(),
  codigo: texto(30),
  nombre: z.string().trim().min(1).max(100),
  tipo: texto(50),
  marca: texto(50),
  modelo: texto(50),
  nro_serie: texto(50),
  es_propia: z.boolean().optional(),
  horas_uso: z.number().min(0).max(999999999).optional(),
  estado: estadoSchema.optional(),
});

const actualizarSchema = crearSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Envía al menos un campo",
  });

const listarSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    estado: estadoSchema.optional(),
    id_cliente: z.uuid().optional(),
    es_propia: z.enum(["true", "false"]).optional(),
    // Filtro por rango de horas de uso
    horas_min: z.coerce.number().int().min(0).optional(),
    horas_max: z.coerce.number().int().min(0).optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20),
  })
  .merge(rangosFechaCampos("creado_en", "actualizado_en"));

const clienteResumen = {
  select: { id_cliente: true, razon_social: true },
} as const;

// Una máquina es propia de DYD o pertenece a un cliente activo. Responde 400 si no se cumple.
async function validarPropiedad(
  esPropia: boolean,
  idCliente: string | null,
  res: Response,
): Promise<boolean> {
  if (esPropia && idCliente) {
    res.status(400).json({
      error:
        "Una máquina propia de DYD no puede tener cliente (envía id_cliente: null)",
    });
    return false;
  }

  if (!esPropia && !idCliente) {
    res
      .status(400)
      .json({
        error: "Indica el cliente dueño de la máquina o márcala como propia",
      });
    return false;
  }

  if (idCliente) {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: idCliente },
    });

    if (!cliente) {
      res.status(400).json({ error: "El cliente indicado no existe" });
      return false;
    }

    if (!cliente.activo) {
      res.status(400).json({ error: "El cliente indicado está desactivado" });
      return false;
    }
  }

  return true;
}

maquinasRouter.get("/", async (req, res) => {
  const filtros = validar(listarSchema, req.query, res) as z.output<
    typeof listarSchema
  > & {
    creado_en_desde?: string;
    creado_en_hasta?: string;
    actualizado_en_desde?: string;
    actualizado_en_hasta?: string;
    pagina: number;
    limite: number;
  };
  if (!filtros) return;

  const where = {
    ...(filtros.estado ? { estado: filtros.estado as EstadoMaquina } : {}),
    ...(filtros.id_cliente ? { id_cliente: filtros.id_cliente } : {}),
    ...(filtros.es_propia ? { es_propia: filtros.es_propia === "true" } : {}),
    ...whereRangoFecha(
      "creado_en",
      filtros.creado_en_desde,
      filtros.creado_en_hasta,
    ),
    ...whereRangoFecha(
      "actualizado_en",
      filtros.actualizado_en_desde,
      filtros.actualizado_en_hasta,
    ),
    ...(filtros.horas_min !== undefined || filtros.horas_max !== undefined
      ? {
          horas_uso: {
            ...(filtros.horas_min !== undefined
              ? { gte: filtros.horas_min }
              : {}),
            ...(filtros.horas_max !== undefined
              ? { lte: filtros.horas_max }
              : {}),
          },
        }
      : {}),
    ...(filtros.q
      ? {
          OR: [
            { nombre: { contains: filtros.q, mode: "insensitive" as const } },
            { codigo: { contains: filtros.q, mode: "insensitive" as const } },
            { marca: { contains: filtros.q, mode: "insensitive" as const } },
            { modelo: { contains: filtros.q, mode: "insensitive" as const } },
            {
              nro_serie: { contains: filtros.q, mode: "insensitive" as const },
            },
          ],
        }
      : {}),
  };

  const [maquinas, total] = await Promise.all([
    prisma.maquina.findMany({
      where,
      include: { cliente: clienteResumen },
      orderBy: { nombre: "asc" },
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.maquina.count({ where }),
  ]);

  res.json({ maquinas, total, pagina: filtros.pagina, limite: filtros.limite });
});

maquinasRouter.post("/", soloAdmin, async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const idCliente = datos.id_cliente ?? null;

  if (!(await validarPropiedad(datos.es_propia ?? false, idCliente, res)))
    return;

  if (datos.codigo) {
    const repetido = await prisma.maquina.findUnique({
      where: { codigo: datos.codigo },
    });
    if (repetido) {
      res.status(409).json({ error: "Ya existe una máquina con ese código" });
      return;
    }
  }

  const maquina = await prisma.maquina.create({
    data: { ...datos, id_cliente: idCliente },
    include: { cliente: clienteResumen },
  });

  res.status(201).json({ maquina });
});

maquinasRouter.get("/:id", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const maquina = await prisma.maquina.findUnique({
    where: { id_maquina: params.id },
    include: {
      cliente: clienteResumen,
      _count: {
        select: {
          programaciones: true,
          solicitudes: true,
          registros_uso: true,
        },
      },
    },
  });

  if (!maquina) {
    res.status(404).json({ error: "Máquina no encontrada" });
    return;
  }

  res.json({ maquina });
});

maquinasRouter.patch("/:id", soloAdmin, async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const existente = await prisma.maquina.findUnique({
    where: { id_maquina: params.id },
  });

  if (!existente) {
    res.status(404).json({ error: "Máquina no encontrada" });
    return;
  }

  // Solo se revisa la propiedad si el cambio la toca, para no bloquear ediciones menores.
  if (datos.id_cliente !== undefined || datos.es_propia !== undefined) {
    const esPropia = datos.es_propia ?? existente.es_propia;
    const idCliente =
      datos.id_cliente !== undefined ? datos.id_cliente : existente.id_cliente;

    if (!(await validarPropiedad(esPropia, idCliente, res))) return;
  }

  if (datos.codigo) {
    const repetido = await prisma.maquina.findUnique({
      where: { codigo: datos.codigo },
    });
    if (repetido && repetido.id_maquina !== params.id) {
      res.status(409).json({ error: "Ya existe una máquina con ese código" });
      return;
    }
  }

  const maquina = await prisma.maquina.update({
    where: { id_maquina: params.id },
    data: datos,
    include: { cliente: clienteResumen },
  });

  res.json({ maquina });
});
