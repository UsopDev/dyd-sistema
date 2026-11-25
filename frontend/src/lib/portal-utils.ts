import type { BadgeTone } from "@/lib/admin-labels";
import type { ProgramacionCliente } from "@/types/client";

/** Programación activa con la fecha de mantenimiento más próxima. */
export function proximaProgramacion(
  programaciones: ProgramacionCliente[],
): ProgramacionCliente | null {
  const conFecha = programaciones.filter(
    (programacion) => programacion.proximo_mant,
  );

  if (conFecha.length === 0) return null;

  return conFecha.reduce((actual, candidata) =>
    new Date(candidata.proximo_mant!).getTime() <
    new Date(actual.proximo_mant!).getTime()
      ? candidata
      : actual,
  );
}

export interface EstadoMantenimientoPortal {
  etiqueta: string;
  tono: BadgeTone;
  dias: number | null;
}

export function estadoMantenimiento(
  fecha: string | null | undefined,
): EstadoMantenimientoPortal {
  if (!fecha) {
    return { etiqueta: "Sin fecha", tono: "neutral", dias: null };
  }

  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);

  if (!anio || !mes || !dia) {
    return { etiqueta: "Sin fecha", tono: "neutral", dias: null };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const objetivo = new Date(anio, mes - 1, dia);
  const dias = Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);

  if (dias < 0) return { etiqueta: "Vencido", tono: "danger", dias };
  if (dias <= 7) return { etiqueta: "Próximo", tono: "warning", dias };
  return { etiqueta: "Al día", tono: "success", dias };
}
