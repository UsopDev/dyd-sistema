import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import { aFecha, hoyLocal } from "../../lib/fechas.js";
import { correoConfigurado, enviarCorreo } from "../../lib/correo.js";
import { cargar } from "./preventivos.routes.js";

export const alertasCorreoRouter = Router();

const enviarSchema = z.object({ forzar: z.enum(["true", "false"]).optional() });

export async function enviarAlertasPreventivas(forzar = false) {
  const hoy = aFecha(hoyLocal());
  const todas = await cargar({ activo: true });
  const pendientes = todas.filter((p) => p.estado_mantenimiento.estado !== "AL_DIA");

  const usuarios = await prisma.usuario.findMany({ where: { activo: true }, select: { email: true } });
  const destinatarios = usuarios.map((u) => u.email);

  const resultado = { revisadas: pendientes.length, enviadas: 0, ya_enviadas: 0, fallidas: 0 };

  for (const p of pendientes) {
    const clave = p.proximo_mant ?? p.fecha_ultimo_mant ?? hoy;

    if (forzar) {
      await prisma.alertaPreventiva.deleteMany({ where: { id_programacion: p.id_programacion } });
    }

    let alerta;
    try {
      alerta = await prisma.alertaPreventiva.create({
        data: { id_programacion: p.id_programacion, proximo_mant: clave },
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") {
        resultado.ya_enviadas++;
        continue;
      }
      throw e;
    }

    const est = p.estado_mantenimiento;
    const lineas = [
      `Mantenimiento preventivo ${est.estado === "VENCIDO" ? "VENCIDO" : "próximo"}`,
      "",
      `Máquina: ${p.maquina.codigo ? p.maquina.codigo + " · " : ""}${p.maquina.nombre}`,
      `Tarea: ${p.descripcion}`,
      est.dias_restantes !== null ? `Días restantes: ${est.dias_restantes}` : null,
      est.horas_restantes !== null ? `Horas restantes: ${est.horas_restantes}` : null,
      p.proximo_mant ? `Fecha programada: ${p.proximo_mant.toISOString().slice(0, 10)}` : null,
      "",
      "Soldaduras Especiales y Rectificaciones DYD E.I.R.L. · Sistema DyD",
    ].filter((l): l is string => l !== null);

    try {
      await enviarCorreo(
        destinatarios,
        `[DyD] Mantenimiento ${est.estado === "VENCIDO" ? "vencido" : "próximo"}: ${p.maquina.nombre}`,
        lineas.join("\n"),
      );
      resultado.enviadas++;
    } catch (err) {
      await prisma.alertaPreventiva.delete({ where: { id_alerta: alerta.id_alerta } });
      resultado.fallidas++;
      console.error("No se pudo enviar la alerta:", err);
    }
  }

  return resultado;
}

alertasCorreoRouter.post("/enviar", async (req, res) => {
  const filtros = validar(enviarSchema, req.query, res);
  if (!filtros) return;

  if (!correoConfigurado) {
    res.status(503).json({ error: "El correo no está configurado en el servidor (revisa el .env)" });
    return;
  }

  res.json(await enviarAlertasPreventivas(filtros.forzar === "true"));
});

export function iniciarRevisionAutomatica() {
  if (!correoConfigurado) {
    console.warn("Alertas por correo desactivadas: faltan variables SMTP en el .env");
    return;
  }

  const revisar = () =>
    enviarAlertasPreventivas().catch((e) => console.error("Error en la revisión de alertas:", e));

  setTimeout(revisar, 15_000);
  setInterval(revisar, 6 * 60 * 60 * 1000);
}
