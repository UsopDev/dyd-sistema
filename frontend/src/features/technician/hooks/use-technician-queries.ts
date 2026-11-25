import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tecnicoApi } from "@/lib/technician-api";
import type { FiltrosAdmin } from "@/types/admin";

export const tecnicoKeys = {
  dashboard: ["tecnico", "dashboard"] as const,
  solicitudes: {
    lista: (filtros: FiltrosAdmin) =>
      ["tecnico", "solicitudes", "lista", filtros] as const,
    detalle: (id: string) => ["tecnico", "solicitudes", "detalle", id] as const,
  },
  ordenes: {
    lista: (filtros: FiltrosAdmin) =>
      ["tecnico", "ordenes", "lista", filtros] as const,
  },
};

export function useDashboardTecnico() {
  return useQuery({
    queryKey: tecnicoKeys.dashboard,
    queryFn: () => tecnicoApi.dashboard(),
    staleTime: 30_000,
  });
}

export function useMisSolicitudes(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: tecnicoKeys.solicitudes.lista(filtros),
    queryFn: () => tecnicoApi.solicitudes(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useMiSolicitud(id: string | null) {
  return useQuery({
    queryKey: tecnicoKeys.solicitudes.detalle(id ?? ""),
    queryFn: () => tecnicoApi.solicitud(id!),
    enabled: Boolean(id),
  });
}

export function useMisOrdenes(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: tecnicoKeys.ordenes.lista(filtros),
    queryFn: () => tecnicoApi.ordenes(filtros),
    placeholderData: keepPreviousData,
  });
}
