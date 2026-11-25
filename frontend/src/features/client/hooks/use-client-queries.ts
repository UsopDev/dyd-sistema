import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { portalClienteApi } from "@/lib/client-api";
import type { FiltrosAdmin } from "@/types/admin";

export const portalClienteKeys = {
  dashboard: ["cliente-portal", "dashboard"] as const,
  solicitudes: {
    lista: (filtros: FiltrosAdmin) =>
      ["cliente-portal", "solicitudes", "lista", filtros] as const,
    detalle: (id: string) =>
      ["cliente-portal", "solicitudes", "detalle", id] as const,
  },
  maquinas: {
    lista: (filtros: FiltrosAdmin) =>
      ["cliente-portal", "maquinas", "lista", filtros] as const,
    detalle: (id: string) =>
      ["cliente-portal", "maquinas", "detalle", id] as const,
  },
};

export function useDashboardCliente() {
  return useQuery({
    queryKey: portalClienteKeys.dashboard,
    queryFn: () => portalClienteApi.dashboard(),
    staleTime: 30_000,
  });
}

export function useSolicitudesCliente(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: portalClienteKeys.solicitudes.lista(filtros),
    queryFn: () => portalClienteApi.solicitudes(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useSolicitudCliente(id: string | null) {
  return useQuery({
    queryKey: portalClienteKeys.solicitudes.detalle(id ?? ""),
    queryFn: () => portalClienteApi.solicitud(id!),
    enabled: Boolean(id),
  });
}

export function useMaquinasCliente(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: portalClienteKeys.maquinas.lista(filtros),
    queryFn: () => portalClienteApi.maquinas(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useMaquinaCliente(id: string | null) {
  return useQuery({
    queryKey: portalClienteKeys.maquinas.detalle(id ?? ""),
    queryFn: () => portalClienteApi.maquina(id!),
    enabled: Boolean(id),
  });
}
