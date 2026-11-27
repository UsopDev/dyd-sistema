import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { rangoMesActual } from "./reporte-formato.js";
import {
  filtroReporteOrdenesSchema,
  FiltrosReporteOrdenes,
} from "./reporte-schemas.js";
import { construirReporteOrdenes } from "./reportData.service.js";
import { generarExcelOrdenes } from "./excelReport.service.js";
import { generarPdfOrdenes } from "./pdfReport.service.js";

export async function nombreUsuario(idUsuario: string): Promise<string> {
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: idUsuario },
    select: { nombres: true, apellidos: true, email: true },
  });
  if (!usuario) return "Desconocido";
  return `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email;
}

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 40);
}

export const reporteOrdenesController = {
  async excel(req: Request, res: Response): Promise<void> {
    const resultado = validar(filtroReporteOrdenesSchema, req.query, res);
    if (!resultado) return;
    const filtros = resultado as FiltrosReporteOrdenes;

    const sesion = (res as any).locals?.sesion as {
      id?: string;
      rol?: string;
    } | undefined;
    const generadoPor = sesion?.id ? await nombreUsuario(sesion.id) : "Sistema";

    try {
      const { vm } = await construirReporteOrdenes(generadoPor, filtros);
      const { buffer } = await generarExcelOrdenes(vm);

      const desde = filtros.fecha_desde ?? rangoMesActual().desde;
      const hasta = filtros.fecha_hasta ?? rangoMesActual().hasta;
      const clienteSlug = slug(filtros.id_cliente ?? "todos");

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="ordenes_${clienteSlug}_${desde}_${hasta}.xlsx"`,
      );
      res.send(buffer);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error generando Excel" });
    }
  },

  async pdf(req: Request, res: Response): Promise<void> {
    const resultado = validar(filtroReporteOrdenesSchema, req.query, res);
    if (!resultado) return;
    const filtros = resultado as FiltrosReporteOrdenes;

    const sesion = (res as any).locals?.sesion as {
      id?: string;
      rol?: string;
    } | undefined;
    const generadoPor = sesion?.id ? await nombreUsuario(sesion.id) : "Sistema";

    const [cliente, tecnico] = await Promise.all([
      filtros.id_cliente
        ? prisma.cliente.findUnique({
            where: { id_cliente: filtros.id_cliente },
            select: { razon_social: true },
          })
        : Promise.resolve(null),
      filtros.id_tecnico
        ? prisma.usuario.findUnique({
            where: { id_usuario: filtros.id_tecnico },
            select: { nombres: true, apellidos: true },
          })
        : Promise.resolve(null),
    ]);

    try {
      const { vm } = await construirReporteOrdenes(generadoPor, filtros);
      const { buffer, nombreArchivo } = await generarPdfOrdenes(vm, {
        id_cliente: filtros.id_cliente,
        id_tecnico: filtros.id_tecnico,
        cliente: cliente?.razon_social,
        tecnico: tecnico
          ? `${tecnico.nombres} ${tecnico.apellidos}`.trim()
          : undefined,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}"`);
      res.send(buffer);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error generando PDF" });
    }
  },
};
