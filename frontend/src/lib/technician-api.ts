import { staffApi } from "@/lib/api";
import { limpiarParametros, type ParametrosApi } from "@/lib/api-params";
import type {
  DashboardTecnico,
  DetalleSolicitudTecnico,
  DiagnosticoTecnico,
  ListaMisOrdenes,
  ListaMisSolicitudes,
} from "@/types/technician";
import type { EstadoGeneral } from "@/types/admin";

export interface PayloadDiagnostico {
  estado_general: EstadoGeneral;
  fallas_detectadas: string;
  observaciones?: string | null;
  recomendaciones?: string | null;
}

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

  diagnosticos: {
    crear: async (payload: PayloadDiagnostico) => {
      const { data } = await staffApi.post<{ diagnostico: DiagnosticoTecnico }>(
        "/diagnosticos",
        payload,
      );
      return data.diagnostico;
    },

    actualizar: async (id: string, payload: Partial<PayloadDiagnostico>) => {
      const { data } = await staffApi.patch<{ diagnostico: DiagnosticoTecnico }>(
        `/diagnosticos/${id}`,
        payload,
      );
      return data.diagnostico;
    },
  },

  ordenes: (filtros?: ParametrosApi) =>
    get<ListaMisOrdenes>("/mi/ordenes", filtros),
};