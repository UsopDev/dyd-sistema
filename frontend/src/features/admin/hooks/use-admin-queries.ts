import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  clientesApi,
  cotizacionesApi,
  diagnosticosApi,
  maquinasApi,
  materialesApi,
  ordenesApi,
  preventivosApi,
  solicitudesApi,
  usoApi,
  usuariosApi,
} from "@/lib/admin-api";
import type {
  ActualizarCotizacionPayload,
  ActualizarPreventivoPayload,
  ActualizarSolicitudPayload,
  ActualizarUsoPayload,
  ActualizarUsuarioPayload,
  ClientePayload,
  CotizacionPayload,
  DiagnosticoPayload,
  EstadoSolicitud,
  FiltrosAdmin,
  FinalizarOrdenPayload,
  MaquinaPayload,
  MaterialPayload,
  MovimientoPayload,
  OrdenMaterialPayload,
  OrdenPayload,
  PreventivoPayload,
  RegistrarUsoPayload,
  SolicitudPayload,
} from "@/types/admin";

export const adminKeys = {
  todo: ["admin"] as const,
  dashboard: {
    resumen: (desde?: string, hasta?: string) =>
      ["admin", "dashboard", "resumen", desde ?? "", hasta ?? ""] as const,
    ingresos: (desde?: string, hasta?: string) =>
      ["admin", "dashboard", "ingresos", desde ?? "", hasta ?? ""] as const,
    estados: (desde?: string, hasta?: string) =>
      ["admin", "dashboard", "estados", desde ?? "", hasta ?? ""] as const,
    stockBajo: ["admin", "dashboard", "stock-bajo"] as const,
    materiales: ["admin", "dashboard", "materiales"] as const,
    solicitudesMes: (clave: string) =>
      ["admin", "dashboard", "solicitudes-mes", clave] as const,
    reportes: (desde?: string, hasta?: string) =>
      ["admin", "reportes", desde ?? "", hasta ?? ""] as const,
  },
  solicitudes: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "solicitudes", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "solicitudes", "detalle", id] as const,
    opciones: (estado?: string) =>
      ["admin", "solicitudes", "opciones", estado ?? ""] as const,
  },
  diagnosticos: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "diagnosticos", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "diagnosticos", "detalle", id] as const,
  },
  cotizaciones: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "cotizaciones", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "cotizaciones", "detalle", id] as const,
    opciones: ["admin", "cotizaciones", "opciones"] as const,
  },
  ordenes: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "ordenes", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "ordenes", "detalle", id] as const,
  },
  clientes: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "clientes", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "clientes", "detalle", id] as const,
    opciones: ["admin", "clientes", "opciones"] as const,
  },
  maquinas: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "maquinas", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "maquinas", "detalle", id] as const,
    opciones: ["admin", "maquinas", "opciones"] as const,
  },
  materiales: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "materiales", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "materiales", "detalle", id] as const,
    movimientos: (id: string, pagina: number) =>
      ["admin", "materiales", "movimientos", id, pagina] as const,
    opciones: ["admin", "materiales", "opciones"] as const,
  },
  preventivos: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "preventivos", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "preventivos", "detalle", id] as const,
    alertas: (idMaquina?: string) =>
      ["admin", "preventivos", "alertas", idMaquina ?? ""] as const,
  },
  uso: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "uso", "lista", filtros] as const,
  },
  usuarios: {
    lista: (filtros: FiltrosAdmin) =>
      ["admin", "usuarios", "lista", filtros] as const,
    detalle: (id: string) => ["admin", "usuarios", "detalle", id] as const,
    opciones: (rol: string) => ["admin", "usuarios", "opciones", rol] as const,
  },
};

function invalidarAdmin(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminKeys.todo });
}

// ==================== SOLICITUDES ====================

export function useSolicitudes(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.solicitudes.lista(filtros),
    queryFn: () => solicitudesApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useSolicitudDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.solicitudes.detalle(id ?? ""),
    queryFn: () => solicitudesApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useSolicitudesOpciones(estado?: EstadoSolicitud | "all") {
  const filtroEstado = estado === "all" ? undefined : estado;
  return useQuery({
    queryKey: adminKeys.solicitudes.opciones(estado ?? "all"),
    queryFn: () => solicitudesApi.listar({ estado: filtroEstado, limite: 100 }),
    select: (respuesta) =>
      respuesta.solicitudes.filter((s) =>
        estado === "all" || !estado
          ? s.estado === "EN_DIAGNOSTICO" || s.estado === "COTIZADA"
          : s.estado === estado,
      ),
    staleTime: 15_000,
  });
}

export function useCrearSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SolicitudPayload) => solicitudesApi.crear(payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useActualizarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ActualizarSolicitudPayload;
    }) => solicitudesApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useCancelarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => solicitudesApi.cancelar(id),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

// ==================== DIAGNOSTICOS ====================

export function useDiagnosticos(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.diagnosticos.lista(filtros),
    queryFn: () => diagnosticosApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useDiagnosticoDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.diagnosticos.detalle(id ?? ""),
    queryFn: () => diagnosticosApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useCrearDiagnostico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DiagnosticoPayload) =>
      diagnosticosApi.crear(payload),
    onSuccess: () => invalidarAdmin(queryClient),
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
      payload: Omit<DiagnosticoPayload, "id_solicitud">;
    }) => diagnosticosApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

// ==================== COTIZACIONES ====================

export function useCotizaciones(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.cotizaciones.lista(filtros),
    queryFn: () => cotizacionesApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useCotizacionDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.cotizaciones.detalle(id ?? ""),
    queryFn: () => cotizacionesApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useCrearCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CotizacionPayload) =>
      cotizacionesApi.crear(payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useActualizarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ActualizarCotizacionPayload;
    }) => cotizacionesApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useAprobarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cotizacionesApi.aprobar(id),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useRechazarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cotizacionesApi.rechazar(id),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useEliminarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cotizacionesApi.eliminar(id),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

// ==================== ORDENES ====================

export function useOrdenes(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.ordenes.lista(filtros),
    queryFn: () => ordenesApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useOrdenDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.ordenes.detalle(id ?? ""),
    queryFn: () => ordenesApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useCrearOrden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrdenPayload) => ordenesApi.crear(payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useIniciarOrden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordenesApi.iniciar(id),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useAgregarMaterialOrden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: OrdenMaterialPayload;
    }) => ordenesApi.agregarMaterial(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useFinalizarOrden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FinalizarOrdenPayload;
    }) => ordenesApi.finalizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useCancelarOrden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordenesApi.cancelar(id),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

// ==================== CLIENTES ====================

export function useClientes(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.clientes.lista(filtros),
    queryFn: () => clientesApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useClienteDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.clientes.detalle(id ?? ""),
    queryFn: () => clientesApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useClientesOpciones() {
  return useQuery({
    queryKey: adminKeys.clientes.opciones,
    queryFn: () => clientesApi.listar({ activo: "true", limite: 100 }),
    select: (respuesta) => respuesta.clientes,
    staleTime: 30_000,
  });
}

export function useCrearCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClientePayload) => clientesApi.crear(payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useActualizarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ClientePayload>;
    }) => clientesApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

// ==================== MAQUINAS ====================

export function useMaquinas(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.maquinas.lista(filtros),
    queryFn: () => maquinasApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useMaquinaDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.maquinas.detalle(id ?? ""),
    queryFn: () => maquinasApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useMaquinasOpciones() {
  return useQuery({
    queryKey: adminKeys.maquinas.opciones,
    queryFn: () => maquinasApi.listar({ limite: 100 }),
    select: (respuesta) => respuesta.maquinas,
    staleTime: 30_000,
  });
}

export function useCrearMaquina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MaquinaPayload) => maquinasApi.crear(payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useActualizarMaquina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<MaquinaPayload>;
    }) => maquinasApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

// ==================== MATERIALES ====================

export function useMateriales(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.materiales.lista(filtros),
    queryFn: () => materialesApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useMaterialDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.materiales.detalle(id ?? ""),
    queryFn: () => materialesApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useMaterialesOpciones() {
  return useQuery({
    queryKey: adminKeys.materiales.opciones,
    queryFn: () => materialesApi.listar({ activo: "true", limite: 100 }),
    select: (respuesta) => respuesta.materiales,
    staleTime: 30_000,
  });
}

export function useMovimientosMaterial(
  id: string | null,
  pagina: number,
  limite = 8,
) {
  return useQuery({
    queryKey: adminKeys.materiales.movimientos(id ?? "", pagina),
    queryFn: () => materialesApi.movimientos(id!, pagina, limite),
    enabled: Boolean(id),
  });
}

export function useCrearMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MaterialPayload) => materialesApi.crear(payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useActualizarMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<MaterialPayload>;
    }) => materialesApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: MovimientoPayload;
    }) => materialesApi.registrarMovimiento(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

// ==================== PREVENTIVOS ====================

export function usePreventivos(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.preventivos.lista(filtros),
    queryFn: () => preventivosApi.listar(filtros),
  });
}

export function usePreventivoDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.preventivos.detalle(id ?? ""),
    queryFn: () => preventivosApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useCrearPreventivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PreventivoPayload) => preventivosApi.crear(payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useActualizarPreventivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ActualizarPreventivoPayload;
    }) => preventivosApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useDesactivarPreventivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => preventivosApi.desactivar(id),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useAlertasPreventivas(idMaquina?: string) {
  return useQuery({
    queryKey: adminKeys.preventivos.alertas(idMaquina),
    queryFn: () => preventivosApi.alertas(idMaquina),
    placeholderData: keepPreviousData,
  });
}

export function useForzarEnvioAlertas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => preventivosApi.forzarEnvioAlertas(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.preventivos.alertas() });
    },
  });
}

// ==================== USO ====================

export function useRegistrosUso(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: ["admin", "uso", "lista", filtros] as const,
    queryFn: () => usoApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useRegistrarUso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegistrarUsoPayload) => usoApi.registrar(payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useActualizarUso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ActualizarUsoPayload;
    }) => usoApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useEliminarUso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usoApi.eliminar(id),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

// ==================== USUARIOS ====================

export function useUsuarios(filtros: FiltrosAdmin) {
  return useQuery({
    queryKey: adminKeys.usuarios.lista(filtros),
    queryFn: () => usuariosApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useUsuarioDetalle(id: string | null) {
  return useQuery({
    queryKey: adminKeys.usuarios.detalle(id ?? ""),
    queryFn: () => usuariosApi.obtener(id!),
    enabled: Boolean(id),
  });
}

export function useUsuariosOpciones(rol = "TECNICO") {
  return useQuery({
    queryKey: adminKeys.usuarios.opciones(rol),
    queryFn: () => usuariosApi.listar({ rol, activo: "true", limite: 100 }),
    select: (respuesta) => respuesta.usuarios,
    staleTime: 30_000,
  });
}

export function useCrearUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usuariosApi.crear,
    onSuccess: () => invalidarAdmin(queryClient),
  });
}

export function useActualizarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ActualizarUsuarioPayload;
    }) => usuariosApi.actualizar(id, payload),
    onSuccess: () => invalidarAdmin(queryClient),
  });
}
