import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  tecnicoApi,
  type PayloadDiagnostico,
} from "@/lib/technician-api";
import type { FiltrosAdmin } from "@/types/admin";
import type { DiagnosticoTecnico } from "@/types/technician";

export const tecnicoKeys = {
  dashboard: ["tecnico", "dashboard"] as const,
  solicitudes: {
    todas: ["tecnico", "solicitudes"] as const,
    lista: (filtros: FiltrosAdmin) =>
      ["tecnico", "solicitudes", "lista", filtros] as const,
    detalle: (id: string) => ["tecnico", "solicitudes", "detalle", id] as const,
  },
  ordenes: {
    lista: (filtros: FiltrosAdmin) =>
      ["tecnico", "ordenes", "lista", filtros] as const,
  },
  diagnosticos: ["tecnico", "diagnosticos"] as const,
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

export function useCrearDiagnostico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PayloadDiagnostico & { id_solicitud: string }) =>
      tecnicoApi.diagnosticos.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tecnicoKeys.solicitudes.todas });
      queryClient.invalidateQueries({ queryKey: tecnicoKeys.diagnosticos });
    },
  });
}

export function useActualizarDiagnostico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<PayloadDiagnostico>;
    }) => tecnicoApi.diagnosticos.actualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tecnicoKeys.solicitudes.todas });
      queryClient.invalidateQueries({ queryKey: tecnicoKeys.diagnosticos });
    },
  });
}
