import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { EstadoOrden, EstadoSolicitud, Programacion } from "./etiquetas";

export interface MaterialBajo {
  id_material: string;
  codigo: string | null;
  nombre: string;
  unidad: string;
  stock_actual: unknown;
  stock_minimo: unknown;
}

export interface SolicitudResumen {
  id_solicitud: string;
  codigo: string | null;
  estado: EstadoSolicitud;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  tipo_servicio: "PREVENTIVO" | "CORRECTIVO";
  descripcion: string;
  fecha_recepcion: string;
  maquina: { id_maquina: string; codigo: string | null; nombre: string };
  cliente: { id_cliente: string; razon_social: string } | null;
}

export interface ResumenDashboard {
  /** Conteo por estado de solicitud. */
  solicitudes: Record<EstadoSolicitud, number>;
  /** Conteo por estado de orden. */
  ordenes: Record<EstadoOrden, number>;
  /** Materiales cuyo stock está en o por debajo del mínimo. */
  stockBajo: MaterialBajo[];
  /** Programaciones que están próximas o vencidas. */
  alertasPreventivo: Programacion[];
  /** Totales de programaciones activas y de las que están al día. */
  preventivos: { total: number; alDia: number; proximos: number; vencidos: number };
  /** Totales de contexto del taller. */
  contextuales: { maquinas: number; clientes: number };
  /** Solicitudes ordenadas por prioridad y fecha de recepción. */
  prioritarias: SolicitudResumen[];
}

const ESTADOS_SOLICITUD: EstadoSolicitud[] = [
  "RECIBIDA",
  "EN_DIAGNOSTICO",
  "COTIZADA",
  "ASIGNADA",
  "EN_PROCESO",
  "FINALIZADA",
  "CANCELADA",
];

const ESTADOS_ORDEN: EstadoOrden[] = ["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"];

type Resultado<T> = { ok: true; valor: T } | { ok: false };

async function pedir<T>(ruta: string): Promise<Resultado<T>> {
  try {
    return { ok: true, valor: await api<T>(ruta) };
  } catch {
    // Un endpoint caído no debe dejar el resto del dashboard en blanco.
    return { ok: false };
  }
}

/** Suma los conteos de un grupo de consultas: los que fallan cuentan como 0. */
function totalDe<T extends Record<string, number>>(
  resultados: Array<Resultado<{ total: number }>>,
  claves: string[],
): T {
  const conteo: Record<string, number> = {};
  claves.forEach((clave, indice) => {
    const r = resultados[indice];
    conteo[clave] = r && r.ok ? r.valor.total : 0;
  });
  return conteo as T;
}

export function useResumenDashboard() {
  const [datos, setDatos] = useState<ResumenDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [recarga, setRecarga] = useState(0);

  const refrescar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    let activo = true;
    setCargando(true);

    async function cargar() {
      const [
        solicitudes,
        ordenes,
        stockBajo,
        alertas,
        preventivos,
        maquinas,
        clientes,
        prioritarias,
      ] = await Promise.all([
        Promise.all(
          ESTADOS_SOLICITUD.map((e) => pedir<{ total: number }>(`/solicitudes?estado=${e}&limite=1`)),
        ),
        Promise.all(
          ESTADOS_ORDEN.map((e) => pedir<{ total: number }>(`/ordenes?estado=${e}&limite=1`)),
        ),
        pedir<{ materiales: MaterialBajo[] }>("/materiales/stock-bajo"),
        pedir<{ preventivos: Programacion[] }>("/preventivos/alertas"),
        pedir<{ preventivos: Programacion[] }>("/preventivos?activo=true"),
        pedir<{ total: number }>("/maquinas?limite=1"),
        pedir<{ total: number }>("/clientes?limite=1"),
        pedir<{ solicitudes: SolicitudResumen[] }>("/solicitudes?limite=6"),
      ]);

      if (!activo) return;

      const conteoSolicitudes = totalDe<Record<EstadoSolicitud, number>>(
        solicitudes,
        ESTADOS_SOLICITUD,
      );
      const conteoOrdenes = totalDe<Record<EstadoOrden, number>>(ordenes, ESTADOS_ORDEN);

      const todas = preventivos.ok ? preventivos.valor.preventivos : [];
      const alertasLista = alertas.ok ? alertas.valor.preventivos : [];

      setDatos({
        solicitudes: conteoSolicitudes,
        ordenes: conteoOrdenes,
        stockBajo: stockBajo.ok ? stockBajo.valor.materiales : [],
        alertasPreventivo: alertasLista,
        preventivos: {
          total: todas.length,
          alDia: todas.filter((p) => p.estado_mantenimiento.estado === "AL_DIA").length,
          proximos: alertasLista.filter((p) => p.estado_mantenimiento.estado === "PROXIMO").length,
          vencidos: alertasLista.filter((p) => p.estado_mantenimiento.estado === "VENCIDO").length,
        },
        contextuales: {
          maquinas: maquinas.ok ? maquinas.valor.total : 0,
          clientes: clientes.ok ? clientes.valor.total : 0,
        },
        prioritarias: prioritarias.ok ? prioritarias.valor.solicitudes : [],
      });
      setCargando(false);
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [recarga]);

  return { datos, cargando, refrescar };
}
