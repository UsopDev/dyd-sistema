import { clienteApi } from "@/lib/api";
import { limpiarParametros, type ParametrosApi } from "@/lib/api-params";
import type {
  DashboardCliente,
  DetalleMaquinaCliente,
  DetalleSolicitudCliente,
  ListaMaquinasCliente,
  ListaSolicitudesCliente,
} from "@/types/client";

async function get<T>(url: string, params?: ParametrosApi): Promise<T> {
  const { data } = await clienteApi.get<T>(url, {
    params: limpiarParametros(params),
  });
  return data;
}

export const portalClienteApi = {
  dashboard: () => get<DashboardCliente>("/cliente/dashboard"),

  solicitudes: (filtros?: ParametrosApi) =>
    get<ListaSolicitudesCliente>("/cliente/solicitudes", filtros),

  solicitud: async (id: string) =>
    (
      await get<{ solicitud: DetalleSolicitudCliente }>(
        `/cliente/solicitudes/${id}`,
      )
    ).solicitud,

  maquinas: (filtros?: ParametrosApi) =>
    get<ListaMaquinasCliente>("/cliente/maquinas", filtros),

  maquina: async (id: string) =>
    (await get<{ maquina: DetalleMaquinaCliente }>(`/cliente/maquinas/${id}`))
      .maquina,
};
