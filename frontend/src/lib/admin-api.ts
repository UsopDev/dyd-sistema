import { staffApi } from "@/lib/api";
import { hoyISO } from "@/lib/format";
import type {
  ActualizarCotizacionPayload,
  ActualizarPreventivoPayload,
  ActualizarSolicitudPayload,
  ActualizarUsoPayload,
  ActualizarUsuarioPayload,
  Cliente,
  ClientePayload,
  CotizacionDetalle,
  CotizacionPayload,
  CrearUsuarioPayload,
  DiagnosticoDetalle,
  DiagnosticoPayload,
  FiltrosAdmin,
  FinalizarOrdenPayload,
  IngresoMes,
  ListaClientes,
  ListaCotizaciones,
  ListaDiagnosticos,
  ListaMaquinas,
  ListaMateriales,
  ListaMovimientos,
  ListaOrdenes,
  ListaPreventivos,
  ListaRegistrosUso,
  ListaSolicitudes,
  ListaUsuarios,
  Maquina,
  MaquinaPayload,
  Material,
  MaterialPayload,
  MaterialUsado,
  MovimientoInventario,
  MovimientoPayload,
  OrdenDetalle,
  OrdenMaterial,
  OrdenMaterialPayload,
  OrdenPayload,
  OrdenTrabajo,
  Preventivo,
  PreventivoPayload,
  RegistroUso,
  RegistrarUsoPayload,
  ReporteExportable,
  ResumenReporte,
  RespuestaSolicitudesPorEstado,
  RespuestaStockBajo,
  SolicitudClienteItem,
  SolicitudDetalle,
  SolicitudPayload,
  SolicitudPrioridadItem,
  SolicitudTecnicoItem,
  SolicitudTipoItem,
  TecnicoRendimiento,
  TiempoPromedio,
  UsuarioAdmin,
} from "@/types/admin";

type Parametros = Record<string, string | number | boolean | undefined | null>;

function limpiar(params?: Parametros): Record<string, string | number | boolean> {
  if (!params) return {};

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, valor]) => valor !== undefined && valor !== null && valor !== "",
    ),
  ) as Record<string, string | number | boolean>;
}

async function get<T>(url: string, params?: Parametros): Promise<T> {
  const { data } = await staffApi.get<T>(url, { params: limpiar(params) });
  return data;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await staffApi.post<T>(url, body);
  return data;
}

async function patch<T>(url: string, body: unknown): Promise<T> {
  const { data } = await staffApi.patch<T>(url, body);
  return data;
}

async function eliminar(url: string): Promise<void> {
  await staffApi.delete(url);
}

// ==================== DASHBOARD / REPORTES ====================

export const dashboardApi = {
  resumen: (desde?: string, hasta?: string) =>
    get<ResumenReporte>("/reportes/resumen", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  ingresosPorMes: (desde?: string, hasta?: string) =>
    get<{ data: IngresoMes[] }>("/reportes/ingresos-por-mes", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  solicitudesPorEstado: (desde?: string, hasta?: string) =>
    get<RespuestaSolicitudesPorEstado>("/reportes/solicitudes-por-estado", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  stockBajo: () => get<RespuestaStockBajo>("/materiales/stock-bajo"),

  /** Trae todas las páginas de materiales activos (máximo 1.000). */
  materialesActivos: async (): Promise<Material[]> => {
    const limite = 100;
    const materiales: Material[] = [];
    let pagina = 1;
    let total = 0;

    do {
      const respuesta = await get<ListaMateriales>("/materiales", {
        activo: "true",
        pagina,
        limite,
      });

      materiales.push(...respuesta.materiales);
      total = respuesta.total;
      pagina += 1;
    } while (materiales.length < total && pagina <= 10);

    return materiales;
  },

  solicitudesPorTecnico: (desde?: string, hasta?: string) =>
    get<{ data: SolicitudTecnicoItem[] }>("/reportes/solicitudes-por-tecnico", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  solicitudesPorCliente: (desde?: string, hasta?: string) =>
    get<{ data: SolicitudClienteItem[] }>("/reportes/solicitudes-por-cliente", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  solicitudesPorTipo: (desde?: string, hasta?: string) =>
    get<{ data: SolicitudTipoItem[] }>("/reportes/solicitudes-por-tipo", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  solicitudesPorPrioridad: (desde?: string, hasta?: string) =>
    get<{ data: SolicitudPrioridadItem[] }>(
      "/reportes/solicitudes-por-prioridad",
      { fecha_desde: desde, fecha_hasta: hasta },
    ),

  tiempoPromedioDiagnostico: (desde?: string, hasta?: string) =>
    get<TiempoPromedio>("/reportes/tiempo-promedio-diagnostico", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  tiempoPromedioOrden: (desde?: string, hasta?: string) =>
    get<TiempoPromedio>("/reportes/tiempo-promedio-orden", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  materialesMasUsados: (desde?: string, hasta?: string) =>
    get<{ data: MaterialUsado[] }>("/reportes/materiales-mas-usados", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  tecnicosRendimiento: (desde?: string, hasta?: string) =>
    get<{ data: TecnicoRendimiento[] }>("/reportes/tecnicos-rendimiento", {
      fecha_desde: desde,
      fecha_hasta: hasta,
    }),

  descargarCsv: async (
    tipo: ReporteExportable,
    desde?: string,
    hasta?: string,
  ): Promise<void> => {
    const { data } = await staffApi.get<Blob>(`/reportes/exportar/${tipo}`, {
      params: limpiar({
        fecha_desde: desde,
        fecha_hasta: hasta,
        format: "csv",
      }),
      responseType: "blob",
    });

    const url = URL.createObjectURL(data);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${tipo}-${hoyISO()}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  },

  descargarXlsx: async (
    tipo: ReporteExportable,
    desde?: string,
    hasta?: string,
  ): Promise<void> => {
    const { data } = await staffApi.get<Blob>(`/reportes/exportar/${tipo}`, {
      params: limpiar({
        fecha_desde: desde,
        fecha_hasta: hasta,
        format: "xlsx",
      }),
      responseType: "blob",
    });

    const url = URL.createObjectURL(data);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${tipo}-${hoyISO()}.xlsx`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  },

  descargarPdf: async (
    tipo: ReporteExportable,
    desde?: string,
    hasta?: string,
  ): Promise<void> => {
    const { data } = await staffApi.get<Blob>("/reportes/exportar/" + tipo, {
      params: limpiar({
        fecha_desde: desde,
        fecha_hasta: hasta,
        format: "pdf",
      }),
      responseType: "blob",
    });

    const url = URL.createObjectURL(data);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = tipo + "-" + hoyISO() + ".pdf";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  },
};

/** Compatibilidad con la estructura pedida en el prompt. */
export const getResumen = dashboardApi.resumen;
export const getIngresosPorMes = dashboardApi.ingresosPorMes;
export const getSolicitudesPorEstado = dashboardApi.solicitudesPorEstado;
export const getStockBajo = dashboardApi.stockBajo;

// ==================== SOLICITUDES ====================

export const solicitudesApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaSolicitudes>("/solicitudes", filtros),

  obtener: async (id: string) =>
    (await get<{ solicitud: SolicitudDetalle }>(`/solicitudes/${id}`)).solicitud,

  crear: async (payload: SolicitudPayload) =>
    (await post<{ solicitud: SolicitudDetalle }>("/solicitudes", payload))
      .solicitud,

  actualizar: async (id: string, payload: ActualizarSolicitudPayload) =>
    (
      await patch<{ solicitud: SolicitudDetalle }>(
        `/solicitudes/${id}`,
        payload,
      )
    ).solicitud,

  cancelar: async (id: string) =>
    (
      await post<{ solicitud: SolicitudDetalle }>(
        `/solicitudes/${id}/cancelar`,
      )
    ).solicitud,
};

// ==================== DIAGNOSTICOS ====================

export const diagnosticosApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaDiagnosticos>("/diagnosticos", filtros),

  obtener: async (id: string) =>
    (await get<{ diagnostico: DiagnosticoDetalle }>(`/diagnosticos/${id}`))
      .diagnostico,

  crear: async (payload: DiagnosticoPayload) =>
    (await post<{ diagnostico: DiagnosticoDetalle }>("/diagnosticos", payload))
      .diagnostico,

  actualizar: async (
    id: string,
    payload: Omit<DiagnosticoPayload, "id_solicitud">,
  ) =>
    (
      await patch<{ diagnostico: DiagnosticoDetalle }>(
        `/diagnosticos/${id}`,
        payload,
      )
    ).diagnostico,
};

// ==================== COTIZACIONES ====================

export const cotizacionesApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaCotizaciones>("/cotizaciones", filtros),

  obtener: async (id: string) =>
    (await get<{ cotizacion: CotizacionDetalle }>(`/cotizaciones/${id}`))
      .cotizacion,

  crear: async (payload: CotizacionPayload) =>
    (await post<{ cotizacion: CotizacionDetalle }>("/cotizaciones", payload))
      .cotizacion,

  actualizar: async (id: string, payload: ActualizarCotizacionPayload) =>
    (
      await patch<{ cotizacion: CotizacionDetalle }>(
        `/cotizaciones/${id}`,
        payload,
      )
    ).cotizacion,

  aprobar: (id: string) =>
    post<{ mensaje: string }>(`/cotizaciones/${id}/aprobar`),

  rechazar: (id: string) =>
    post<{ mensaje: string }>(`/cotizaciones/${id}/rechazar`),

  eliminar: (id: string) => eliminar(`/cotizaciones/${id}`),
};

// ==================== ORDENES ====================

export const ordenesApi = {
  listar: (filtros?: FiltrosAdmin) => get<ListaOrdenes>("/ordenes", filtros),

  obtener: async (id: string) =>
    (await get<{ orden: OrdenDetalle }>(`/ordenes/${id}`)).orden,

  crear: async (payload: OrdenPayload) =>
    (await post<{ orden: OrdenTrabajo }>("/ordenes", payload)).orden,

  iniciar: async (id: string) =>
    (await post<{ orden: OrdenTrabajo }>(`/ordenes/${id}/iniciar`)).orden,

  agregarMaterial: async (id: string, payload: OrdenMaterialPayload) =>
    (await post<{ linea: OrdenMaterial }>(`/ordenes/${id}/materiales`, payload))
      .linea,

  finalizar: async (id: string, payload: FinalizarOrdenPayload) =>
    (await post<{ orden: OrdenTrabajo }>(`/ordenes/${id}/finalizar`, payload))
      .orden,

  cancelar: async (id: string) =>
    (await post<{ orden: OrdenTrabajo }>(`/ordenes/${id}/cancelar`)).orden,
};

// ==================== CLIENTES ====================

export const clientesApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaClientes>("/clientes", filtros),

  obtener: async (id: string) =>
    (await get<{ cliente: Cliente }>(`/clientes/${id}`)).cliente,

  crear: async (payload: ClientePayload) =>
    (await post<{ cliente: Cliente }>("/clientes", payload)).cliente,

  actualizar: async (id: string, payload: Partial<ClientePayload>) =>
    (await patch<{ cliente: Cliente }>(`/clientes/${id}`, payload)).cliente,
};

// ==================== MAQUINAS ====================

export const maquinasApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaMaquinas>("/maquinas", filtros),

  obtener: async (id: string) =>
    (await get<{ maquina: Maquina }>(`/maquinas/${id}`)).maquina,

  crear: async (payload: MaquinaPayload) =>
    (await post<{ maquina: Maquina }>("/maquinas", payload)).maquina,

  actualizar: async (id: string, payload: Partial<MaquinaPayload>) =>
    (await patch<{ maquina: Maquina }>(`/maquinas/${id}`, payload)).maquina,
};

// ==================== MATERIALES ====================

export const materialesApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaMateriales>("/materiales", filtros),

  obtener: async (id: string) =>
    (await get<{ material: Material }>(`/materiales/${id}`)).material,

  crear: async (payload: MaterialPayload) =>
    (await post<{ material: Material }>("/materiales", payload)).material,

  actualizar: async (id: string, payload: Partial<MaterialPayload>) =>
    (await patch<{ material: Material }>(`/materiales/${id}`, payload))
      .material,

  movimientos: (id: string, pagina = 1, limite = 10) =>
    get<ListaMovimientos>(`/materiales/${id}/movimientos`, {
      pagina,
      limite,
    }),

  registrarMovimiento: async (id: string, payload: MovimientoPayload) =>
    post<{ movimiento: MovimientoInventario; stock_actual: string }>(
      `/materiales/${id}/movimientos`,
      payload,
    ),
};

// ==================== PREVENTIVOS ====================

export const preventivosApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaPreventivos>("/preventivos", filtros),

  obtener: async (id: string) =>
    (await get<{ preventivo: Preventivo }>(`/preventivos/${id}`)).preventivo,

  crear: async (payload: PreventivoPayload) =>
    (await post<{ preventivo: Preventivo }>("/preventivos", payload))
      .preventivo,

  actualizar: async (id: string, payload: ActualizarPreventivoPayload) =>
    (await patch<{ preventivo: Preventivo }>(`/preventivos/${id}`, payload))
      .preventivo,

  desactivar: (id: string) => eliminar(`/preventivos/${id}`),

  alertas: (idMaquina?: string) =>
    get<{ preventivos: Preventivo[]; total: number }>("/preventivos/alertas", { id_maquina: idMaquina }),

  forzarEnvioAlertas: () =>
    post<{ enviadas: number; omitidas: number; errores: string[] }>("/alertas-correo/enviar", {}),
};

// ==================== USO ====================

export const usoApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaRegistrosUso>("/uso", filtros),

  registrar: async (payload: RegistrarUsoPayload) =>
    (await post<{ registro: RegistroUso }>("/uso", payload)).registro,

  actualizar: async (id: string, payload: ActualizarUsoPayload) =>
    (await patch<{ registro: RegistroUso }>(`/uso/${id}`, payload)).registro,

  eliminar: (id: string) => eliminar(`/uso/${id}`),
};

// ==================== USUARIOS ====================

export const usuariosApi = {
  listar: (filtros?: FiltrosAdmin) =>
    get<ListaUsuarios>("/usuarios", filtros),

  obtener: async (id: string) =>
    (await get<{ usuario: UsuarioAdmin }>(`/usuarios/${id}`)).usuario,

  crear: async (payload: CrearUsuarioPayload) =>
    (await post<{ usuario: UsuarioAdmin }>("/usuarios", payload)).usuario,

  actualizar: async (id: string, payload: ActualizarUsuarioPayload) =>
    (await patch<{ usuario: UsuarioAdmin }>(`/usuarios/${id}`, payload))
      .usuario,
};
