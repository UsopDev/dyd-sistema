import { staffApi } from "@/lib/api";
import { limpiarParametros, type ParametrosApi } from "@/lib/api-params";
import type {
  DashboardTecnico,
  DetalleSolicitudTecnico,
  ListaMisOrdenes,
  ListaMisSolicitudes,
} from "@/types/technician";

async function get<T>(url: string, params?: ParametrosApi): Promise<T> {
  const { data } = await staffApi.get<T>(url, {
    params: limpiarParametros(params),
  });
  return data;
}

export const tecnicoApi = {
  dashboard: () => get<DashboardTecnico>("/mi/dashboard"),

  solicitudes: (filtros?: ParametrosApi) =>
    get<ListaMisSolicitudes>("/mi/solicitudes", filtros),

  solicitud: async (id: string) =>
    (await get<{ solicitud: DetalleSolicitudTecnico }>(`/mi/solicitudes/${id}`))
      .solicitud,

  ordenes: (filtros?: ParametrosApi) =>
    get<ListaMisOrdenes>("/mi/ordenes", filtros),
};
