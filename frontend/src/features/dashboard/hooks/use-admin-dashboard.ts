import { useQueries, useQuery } from "@tanstack/react-query";
import { dashboardApi, solicitudesApi } from "@/lib/admin-api";
import { adminKeys } from "@/features/admin/hooks/use-admin-queries";

export function useResumen(desde?: string, hasta?: string) {
  return useQuery({
    queryKey: adminKeys.dashboard.resumen(desde, hasta),
    queryFn: () => dashboardApi.resumen(desde, hasta),
  });
}

export function useIngresosPorMes(desde?: string, hasta?: string) {
  return useQuery({
    queryKey: adminKeys.dashboard.ingresos(desde, hasta),
    queryFn: () => dashboardApi.ingresosPorMes(desde, hasta),
  });
}

export function useSolicitudesPorEstado(desde?: string, hasta?: string) {
  return useQuery({
    queryKey: adminKeys.dashboard.estados(desde, hasta),
    queryFn: () => dashboardApi.solicitudesPorEstado(desde, hasta),
  });
}

export function useStockBajo() {
  return useQuery({
    queryKey: adminKeys.dashboard.stockBajo,
    queryFn: dashboardApi.stockBajo,
  });
}

export function useMaterialesActivos() {
  return useQuery({
    queryKey: adminKeys.dashboard.materiales,
    queryFn: dashboardApi.materialesActivos,
  });
}

export interface MesRango {
  clave: string;
  desde: string;
  hasta: string;
}

/** Conteo mensual de solicitudes para la segunda serie del gráfico de tendencia. */
export function useSolicitudesPorMes(meses: MesRango[]) {
  return useQueries({
    queries: meses.map((mes) => ({
      queryKey: adminKeys.dashboard.solicitudesMes(mes.clave),
      queryFn: async () => {
        const respuesta = await solicitudesApi.listar({
          fecha_recepcion_desde: mes.desde,
          fecha_recepcion_hasta: mes.hasta,
          limite: 1,
        });
        return respuesta.total;
      },
      staleTime: 60_000,
    })),
  });
}
