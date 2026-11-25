import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/admin-api";

interface OpcionesReporte {
  desde?: string;
  hasta?: string;
  enabled?: boolean;
}

function useReporte<T>(
  recurso: string,
  consulta: () => Promise<T>,
  { desde, hasta, enabled = true }: OpcionesReporte,
) {
  return useQuery({
    queryKey: ["admin", "reportes", recurso, desde ?? "", hasta ?? ""],
    queryFn: consulta,
    enabled,
  });
}

export function useReporteResumen({ desde, hasta, enabled }: OpcionesReporte) {
  return useReporte("resumen", () => dashboardApi.resumen(desde, hasta), {
    desde,
    hasta,
    enabled,
  });
}

export function useReporteIngresos({ desde, hasta, enabled }: OpcionesReporte) {
  return useReporte(
    "ingresos",
    () => dashboardApi.ingresosPorMes(desde, hasta),
    { desde, hasta, enabled },
  );
}

export function useReporteEstados({ desde, hasta, enabled }: OpcionesReporte) {
  return useReporte(
    "estados",
    () => dashboardApi.solicitudesPorEstado(desde, hasta),
    { desde, hasta, enabled },
  );
}

export function useReporteTipos({ desde, hasta, enabled }: OpcionesReporte) {
  return useReporte(
    "tipos",
    () => dashboardApi.solicitudesPorTipo(desde, hasta),
    { desde, hasta, enabled },
  );
}

export function useReportePrioridades({
  desde,
  hasta,
  enabled,
}: OpcionesReporte) {
  return useReporte(
    "prioridades",
    () => dashboardApi.solicitudesPorPrioridad(desde, hasta),
    { desde, hasta, enabled },
  );
}

export function useReporteTiempoDiagnostico({
  desde,
  hasta,
  enabled,
}: OpcionesReporte) {
  return useReporte(
    "tiempo-diagnostico",
    () => dashboardApi.tiempoPromedioDiagnostico(desde, hasta),
    { desde, hasta, enabled },
  );
}

export function useReporteTiempoOrden({
  desde,
  hasta,
  enabled,
}: OpcionesReporte) {
  return useReporte(
    "tiempo-orden",
    () => dashboardApi.tiempoPromedioOrden(desde, hasta),
    { desde, hasta, enabled },
  );
}

export function useReporteMateriales({
  desde,
  hasta,
  enabled,
}: OpcionesReporte) {
  return useReporte(
    "materiales",
    () => dashboardApi.materialesMasUsados(desde, hasta),
    { desde, hasta, enabled },
  );
}

export function useReporteTecnicos({ desde, hasta, enabled }: OpcionesReporte) {
  return useReporte(
    "tecnicos",
    () => dashboardApi.tecnicosRendimiento(desde, hasta),
    { desde, hasta, enabled },
  );
}

export function useReporteClientes({ desde, hasta, enabled }: OpcionesReporte) {
  return useReporte(
    "clientes",
    () => dashboardApi.solicitudesPorCliente(desde, hasta),
    { desde, hasta, enabled },
  );
}
