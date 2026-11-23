import type { OpenAPIV3 } from "openapi-types";
import { env } from "../config/env.js";

const baseSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  Error: {
    type: "object" as const,
    properties: {
      error: { type: "string" },
      detalles: { type: "object" as const },
    },
  },
  Usuario: {
    type: "object",
    properties: {
      id_usuario: { type: "string", format: "uuid" },
      nombres: { type: "string" },
      apellidos: { type: "string" },
      email: { type: "string", format: "email" },
      rol: { type: "string", enum: ["ADMINISTRADOR", "TECNICO"] },
      activo: { type: "boolean" },
      creado_en: { type: "string", format: "date-time" },
    },
  },
  Cliente: {
    type: "object",
    properties: {
      id_cliente: { type: "string", format: "uuid" },
      razon_social: { type: "string" },
      ruc_dni: { type: "string", nullable: true },
      contacto: { type: "string", nullable: true },
      telefono: { type: "string", nullable: true },
      email: { type: "string", format: "email", nullable: true },
      direccion: { type: "string", nullable: true },
      activo: { type: "boolean" },
      creado_en: { type: "string", format: "date-time" },
    },
  },
  Maquina: {
    type: "object",
    properties: {
      id_maquina: { type: "string", format: "uuid" },
      id_cliente: { type: "string", format: "uuid", nullable: true },
      codigo: { type: "string", nullable: true },
      nombre: { type: "string" },
      tipo: { type: "string", nullable: true },
      marca: { type: "string", nullable: true },
      modelo: { type: "string", nullable: true },
      nro_serie: { type: "string", nullable: true },
      es_propia: { type: "boolean" },
      horas_uso: { type: "number" },
      estado: { type: "string", enum: ["OPERATIVA", "EN_MANTENIMIENTO", "FUERA_DE_SERVICIO"] },
      creado_en: { type: "string", format: "date-time" },
    },
  },
  Material: {
    type: "object",
    properties: {
      id_material: { type: "string", format: "uuid" },
      codigo: { type: "string", nullable: true },
      nombre: { type: "string" },
      unidad: { type: "string" },
      stock_actual: { type: "number" },
      stock_minimo: { type: "number" },
      precio_unitario: { type: "number", nullable: true },
      activo: { type: "boolean" },
      creado_en: { type: "string", format: "date-time" },
    },
  },
  Solicitud: {
    type: "object",
    properties: {
      id_solicitud: { type: "string", format: "uuid" },
      codigo: { type: "string", nullable: true },
      id_cliente: { type: "string", format: "uuid", nullable: true },
      id_maquina: { type: "string", format: "uuid" },
      id_usuario_registrado: { type: "string", format: "uuid" },
      id_programacion: { type: "string", format: "uuid", nullable: true },
      tipo_servicio: { type: "string", enum: ["PREVENTIVO", "CORRECTIVO"] },
      descripcion: { type: "string" },
      prioridad: { type: "string", enum: ["ALTA", "MEDIA", "BAJA"] },
      estado: { type: "string", enum: ["RECIBIDA", "EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA", "EN_PROCESO", "FINALIZADA", "CANCELADA"] },
      fecha_recepcion: { type: "string", format: "date-time" },
    },
  },
  Diagnostico: {
    type: "object",
    properties: {
      id_diagnostico: { type: "string", format: "uuid" },
      id_solicitud: { type: "string", format: "uuid" },
      id_maquina: { type: "string", format: "uuid" },
      id_tecnico: { type: "string", format: "uuid" },
      estado_general: { type: "string", enum: ["BUENO", "REGULAR", "MALO", "CRITICO"] },
      fallas_detectadas: { type: "string" },
      observaciones: { type: "string", nullable: true },
      recomendaciones: { type: "string", nullable: true },
      fecha: { type: "string", format: "date-time" },
    },
  },
  Cotizacion: {
    type: "object",
    properties: {
      id_cotizacion: { type: "string", format: "uuid" },
      codigo: { type: "string", nullable: true },
      id_solicitud: { type: "string", format: "uuid" },
      id_usuario: { type: "string", format: "uuid" },
      total: { type: "number" },
      observaciones: { type: "string", nullable: true },
      fecha: { type: "string", format: "date-time" },
    },
  },
  OrdenTrabajo: {
    type: "object",
    properties: {
      id_orden_trabajo: { type: "string", format: "uuid" },
      codigo: { type: "string", nullable: true },
      id_solicitud: { type: "string", format: "uuid" },
      id_diagnostico: { type: "string", format: "uuid" },
      id_tecnico: { type: "string", format: "uuid" },
      estado: { type: "string", enum: ["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"] },
      trabajo_realizado: { type: "string", nullable: true },
      monto: { type: "number", nullable: true },
      fecha_inicio: { type: "string", format: "date-time", nullable: true },
      fecha_fin: { type: "string", format: "date-time", nullable: true },
      creado_en: { type: "string", format: "date-time" },
    },
  },
  RegistroUso: {
    type: "object",
    properties: {
      id_registro_uso: { type: "string", format: "uuid" },
      id_maquina: { type: "string", format: "uuid" },
      id_usuario_registrado: { type: "string", format: "uuid" },
      horas: { type: "number" },
      fecha: { type: "string", format: "date" },
      creado_en: { type: "string", format: "date-time" },
    },
  },
  ProgramacionPreventiva: {
    type: "object",
    properties: {
      id_programacion: { type: "string", format: "uuid" },
      id_maquina: { type: "string", format: "uuid" },
      descripcion: { type: "string" },
      frecuencia_horas: { type: "integer", nullable: true },
      frecuencia_dias: { type: "integer", nullable: true },
      dias_aviso: { type: "integer" },
      horas_aviso: { type: "number" },
      horas_ultimo_mant: { type: "number", nullable: true },
      fecha_ultimo_mant: { type: "string", format: "date", nullable: true },
      proximo_mant: { type: "string", format: "date", nullable: true },
      activo: { type: "boolean" },
      creado_en: { type: "string", format: "date-time" },
    },
  },
};

const securitySchemes: OpenAPIV3.ComponentsObject["securitySchemes"] = {
  cookieAuth: {
    type: "apiKey",
    in: "cookie",
    name: "access_token",
    description: "Access token JWT en cookie HttpOnly",
  },
  refreshAuth: {
    type: "apiKey",
    in: "cookie",
    name: "refresh_token",
    description: "Refresh token en cookie HttpOnly (path: /api/auth)",
  },
};

const commonResponses = {
  Unauthorized: { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  Forbidden: { description: "No tienes permiso para esta acción", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  NotFound: { description: "Recurso no encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  Conflict: { description: "Conflicto de estado o duplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  BadRequest: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  TooManyRequests: { description: "Demasiadas solicitudes", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
};

function makePath(summary: string, tags: string[], responses: Record<string, any> = {}): OpenAPIV3.PathItemObject {
  return {
    get: {
      tags,
      summary,
      responses: {
        "200": { description: "OK" },
        "401": commonResponses.Unauthorized,
        ...responses,
      },
    },
  };
}

function makePostPath(summary: string, tags: string[], responses: Record<string, any> = {}): OpenAPIV3.PathItemObject {
  return {
    post: {
      tags,
      summary,
      responses: {
        "201": { description: "Creado" },
        "400": commonResponses.BadRequest,
        "401": commonResponses.Unauthorized,
        ...responses,
      },
    },
  };
}

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "DYD Sistema API",
    version: "1.0.0",
    description: "API para gestión de mantenimiento industrial - Soldaduras Especiales y Rectificaciones DYD E.I.R.L.",
    contact: { name: "DYD Sistema", email: "soporte@dyd.com" },
  },
  servers: [{ url: `http://localhost:${env.PORT}`, description: "Desarrollo local" }],
  components: { schemas: baseSchemas, securitySchemes },
  security: [{ cookieAuth: [], refreshAuth: [] }],
  tags: [
    { name: "Auth", description: "Autenticación y sesión" },
    { name: "Usuarios", description: "Gestión de usuarios (solo ADMIN)" },
    { name: "Clientes", description: "Gestión de clientes" },
    { name: "Maquinas", description: "Gestión de máquinas" },
    { name: "Materiales", description: "Gestión de materiales e inventario" },
    { name: "Solicitudes", description: "Solicitudes de servicio" },
    { name: "Diagnosticos", description: "Diagnósticos técnicos" },
    { name: "Cotizaciones", description: "Cotizaciones de servicios/materiales" },
    { name: "Ordenes", description: "Órdenes de trabajo" },
    { name: "Uso", description: "Registro de horas de uso de máquinas" },
    { name: "Preventivos", description: "Programaciones de mantenimiento preventivo" },
    { name: "Reportes", description: "Reportes y dashboards (solo ADMIN)" },
    { name: "Alertas", description: "Envío de alertas por correo" },
  ],
  paths: {
    "/api/health": makePath("Health check", ["Auth"]),
    "/api/health/db": makePath("Database health check", ["Auth"]),
    "/api/auth/login": makePostPath("Iniciar sesión", ["Auth"]),
    "/api/auth/refresh": makePostPath("Refrescar access token", ["Auth"]),
    "/api/auth/me": makePath("Obtener usuario actual", ["Auth"]),
    "/api/auth/logout": makePostPath("Cerrar sesión", ["Auth"]),
    "/api/usuarios": {
      get: { tags: ["Usuarios"], summary: "Listar usuarios (ADMIN)", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } },
      post: { tags: ["Usuarios"], summary: "Crear usuario (ADMIN)", responses: { "201": { description: "Usuario creado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "409": commonResponses.Conflict } },
    },
    "/api/usuarios/{id}": {
      get: { tags: ["Usuarios"], summary: "Obtener usuario por ID (ADMIN)", responses: { "200": { description: "Usuario" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } },
      patch: { tags: ["Usuarios"], summary: "Actualizar usuario (ADMIN)", responses: { "200": { description: "Usuario actualizado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } },
    },
    "/api/clientes": {
      get: { tags: ["Clientes"], summary: "Listar clientes", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Clientes"], summary: "Crear cliente (ADMIN)", responses: { "201": { description: "Cliente creado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "409": commonResponses.Conflict } },
    },
    "/api/clientes/{id}": {
      get: { tags: ["Clientes"], summary: "Obtener cliente por ID", responses: { "200": { description: "Cliente" }, "401": commonResponses.Unauthorized, "404": commonResponses.NotFound } },
      patch: { tags: ["Clientes"], summary: "Actualizar cliente (ADMIN)", responses: { "200": { description: "Cliente actualizado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } },
    },
    "/api/maquinas": {
      get: { tags: ["Maquinas"], summary: "Listar máquinas", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Maquinas"], summary: "Crear máquina (ADMIN)", responses: { "201": { description: "Máquina creada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "409": commonResponses.Conflict } },
    },
    "/api/maquinas/{id}": {
      get: { tags: ["Maquinas"], summary: "Obtener máquina por ID", responses: { "200": { description: "Máquina" }, "401": commonResponses.Unauthorized, "404": commonResponses.NotFound } },
      patch: { tags: ["Maquinas"], summary: "Actualizar máquina (ADMIN)", responses: { "200": { description: "Máquina actualizada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } },
    },
    "/api/materiales": {
      get: { tags: ["Materiales"], summary: "Listar materiales", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Materiales"], summary: "Crear material (ADMIN)", responses: { "201": { description: "Material creado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "409": commonResponses.Conflict } },
    },
    "/api/materiales/stock-bajo": { get: { tags: ["Materiales"], summary: "Materiales con stock bajo", responses: { "200": { description: "Lista de materiales" }, "401": commonResponses.Unauthorized } } },
    "/api/materiales/{id}": {
      get: { tags: ["Materiales"], summary: "Obtener material por ID", responses: { "200": { description: "Material" }, "401": commonResponses.Unauthorized, "404": commonResponses.NotFound } },
      patch: { tags: ["Materiales"], summary: "Actualizar material (ADMIN)", responses: { "200": { description: "Material actualizado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } },
    },
    "/api/materiales/{id}/movimientos": {
      post: { tags: ["Materiales"], summary: "Registrar movimiento de inventario (ADMIN)", responses: { "201": { description: "Movimiento registrado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } },
      get: { tags: ["Materiales"], summary: "Listar movimientos de un material", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized, "404": commonResponses.NotFound } },
    },
    "/api/solicitudes": {
      get: { tags: ["Solicitudes"], summary: "Listar solicitudes", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Solicitudes"], summary: "Crear solicitud", responses: { "201": { description: "Solicitud creada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "409": commonResponses.Conflict } },
    },
    "/api/solicitudes/{id}": {
      get: { tags: ["Solicitudes"], summary: "Obtener solicitud por ID", responses: { "200": { description: "Solicitud completa" }, "401": commonResponses.Unauthorized, "404": commonResponses.NotFound } },
      patch: { tags: ["Solicitudes"], summary: "Actualizar solicitud (ADMIN, solo estado RECIBIDA)", responses: { "200": { description: "Solicitud actualizada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } },
    },
    "/api/solicitudes/{id}/cancelar": { post: { tags: ["Solicitudes"], summary: "Cancelar solicitud (ADMIN)", responses: { "200": { description: "Solicitud cancelada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } } },
    "/api/diagnosticos": {
      get: { tags: ["Diagnosticos"], summary: "Listar diagnósticos", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Diagnosticos"], summary: "Crear diagnóstico (mueve solicitud a EN_DIAGNOSTICO)", responses: { "201": { description: "Diagnóstico creado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "409": commonResponses.Conflict } },
    },
    "/api/diagnosticos/{id}": {
      get: { tags: ["Diagnosticos"], summary: "Obtener diagnóstico por ID (con adjuntos)", responses: { "200": { description: "Diagnóstico completo" }, "401": commonResponses.Unauthorized, "404": commonResponses.NotFound } },
      patch: { tags: ["Diagnosticos"], summary: "Actualizar diagnóstico (solo autor o ADMIN, solo si solicitud en EN_DIAGNOSTICO)", responses: { "200": { description: "Diagnóstico actualizado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } },
    },
    "/api/cotizaciones": {
      get: { tags: ["Cotizaciones"], summary: "Listar cotizaciones", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Cotizaciones"], summary: "Crear cotización (mueve solicitud a COTIZADA)", responses: { "201": { description: "Cotización creada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "409": commonResponses.Conflict } },
    },
    "/api/cotizaciones/{id}": {
      get: { tags: ["Cotizaciones"], summary: "Obtener cotización por ID (con detalles y subtotales)", responses: { "200": { description: "Cotización completa" }, "401": commonResponses.Unauthorized, "404": commonResponses.NotFound } },
      patch: { tags: ["Cotizaciones"], summary: "Actualizar cotización (ADMIN, solo si solicitud en COTIZADA)", responses: { "200": { description: "Cotización actualizada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } },
      delete: { tags: ["Cotizaciones"], summary: "Eliminar cotización (ADMIN, solo si solicitud en COTIZADA → vuelve a EN_DIAGNOSTICO)", responses: { "204": { description: "Cotización eliminada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } },
    },
    "/api/cotizaciones/{id}/aprobar": { post: { tags: ["Cotizaciones"], summary: "Aprobar cotización (ADMIN)", responses: { "200": { description: "Cotización aprobada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } } },
    "/api/cotizaciones/{id}/rechazar": { post: { tags: ["Cotizaciones"], summary: "Rechazar cotización (ADMIN → solicitud vuelve a EN_DIAGNOSTICO)", responses: { "200": { description: "Cotización rechazada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } } },
    "/api/ordenes": {
      get: { tags: ["Ordenes"], summary: "Listar órdenes (técnico ve solo las suyas)", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Ordenes"], summary: "Crear orden de trabajo (ADMIN, requiere diagnóstico y cotización)", responses: { "201": { description: "Orden creada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "409": commonResponses.Conflict } },
    },
    "/api/ordenes/{id}": {
      get: { tags: ["Ordenes"], summary: "Obtener orden por ID (técnico asignado o ADMIN)", responses: { "200": { description: "Orden completa con materiales" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } },
    },
    "/api/ordenes/{id}/iniciar": { post: { tags: ["Ordenes"], summary: "Iniciar orden (técnico asignado o ADMIN, mueve a EN_PROCESO)", responses: { "200": { description: "Orden iniciada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } } },
    "/api/ordenes/{id}/materiales": { post: { tags: ["Ordenes"], summary: "Registrar material usado en orden (descuenta stock, crea movimiento)", responses: { "201": { description: "Material registrado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } } },
    "/api/ordenes/{id}/finalizar": { post: { tags: ["Ordenes"], summary: "Finalizar orden (técnico asignado o ADMIN, actualiza preventivo si aplica)", responses: { "200": { description: "Orden finalizada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } } },
    "/api/ordenes/{id}/cancelar": { post: { tags: ["Ordenes"], summary: "Cancelar orden (ADMIN, solo estado PENDIENTE)", responses: { "200": { description: "Orden cancelada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound, "409": commonResponses.Conflict } } },
    "/api/uso": {
      get: { tags: ["Uso"], summary: "Listar registros de uso", responses: { "200": { description: "Lista paginada" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Uso"], summary: "Registrar horas de uso (incrementa horas_uso de la máquina)", responses: { "201": { description: "Registro creado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized } },
    },
    "/api/uso/{id}": {
      patch: { tags: ["Uso"], summary: "Editar registro de uso (autor o ADMIN, actualiza horas_uso máquina)", responses: { "200": { description: "Registro actualizado" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } },
      delete: { tags: ["Uso"], summary: "Eliminar registro de uso (autor o ADMIN, decrementa horas_uso máquina)", responses: { "204": { description: "Registro eliminado" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } },
    },
    "/api/preventivos": {
      get: { tags: ["Preventivos"], summary: "Listar programaciones preventivas (con estado calculado)", responses: { "200": { description: "Lista con estado_mantenimiento" }, "401": commonResponses.Unauthorized } },
      post: { tags: ["Preventivos"], summary: "Crear programación preventiva (ADMIN)", responses: { "201": { description: "Programación creada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } },
    },
    "/api/preventivos/alertas": { get: { tags: ["Preventivos"], summary: "Obtener alertas de mantenimientos próximos/vencidos", responses: { "200": { description: "Lista de alertas ordenadas por prioridad" }, "401": commonResponses.Unauthorized } } },
    "/api/preventivos/{id}": {
      get: { tags: ["Preventivos"], summary: "Obtener programación por ID", responses: { "200": { description: "Programación con estado" }, "401": commonResponses.Unauthorized, "404": commonResponses.NotFound } },
      patch: { tags: ["Preventivos"], summary: "Actualizar programación (ADMIN)", responses: { "200": { description: "Programación actualizada" }, "400": commonResponses.BadRequest, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } },
      delete: { tags: ["Preventivos"], summary: "Desactivar programación (ADMIN, soft delete)", responses: { "204": { description: "Programación desactivada" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } },
    },
    "/api/reportes/maquinas/{id}/historial": { get: { tags: ["Reportes"], summary: "Historial de máquina (órdenes y diagnósticos)", responses: { "200": { description: "Historial completo" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } } },
    "/api/reportes/clientes/{id}/historial": { get: { tags: ["Reportes"], summary: "Historial de cliente (órdenes)", responses: { "200": { description: "Historial completo" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } } },
    "/api/reportes/solicitudes-por-estado": { get: { tags: ["Reportes"], summary: "Conteo de solicitudes por estado", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/solicitudes-por-tecnico": { get: { tags: ["Reportes"], summary: "Solicitudes por técnico (top 20)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/solicitudes-por-cliente": { get: { tags: ["Reportes"], summary: "Solicitudes por cliente (top 20)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/solicitudes-por-tipo": { get: { tags: ["Reportes"], summary: "Solicitudes por tipo (PREVENTIVO/CORRECTIVO)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/solicitudes-por-prioridad": { get: { tags: ["Reportes"], summary: "Solicitudes por prioridad (ALTA/MEDIA/BAJA)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/tiempo-promedio-diagnostico": { get: { tags: ["Reportes"], summary: "Tiempo promedio recepción → diagnóstico (días)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/tiempo-promedio-orden": { get: { tags: ["Reportes"], summary: "Tiempo promedio inicio → fin orden (días)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/materiales-mas-usados": { get: { tags: ["Reportes"], summary: "Materiales más usados en órdenes finalizadas (top 20)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/ingresos-por-mes": { get: { tags: ["Reportes"], summary: "Ingresos mensuales (órdenes finalizadas con monto)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/tecnicos-rendimiento": { get: { tags: ["Reportes"], summary: "Rendimiento de técnicos (órdenes, tiempo, monto)", responses: { "200": { description: "Datos del reporte" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/resumen": { get: { tags: ["Reportes"], summary: "Resumen general para dashboard", responses: { "200": { description: "Datos del dashboard" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden } } },
    "/api/reportes/exportar/{tipo}": { get: { tags: ["Reportes"], summary: "Exportar reporte a CSV o JSON", responses: { "200": { description: "Archivo CSV o JSON" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "404": commonResponses.NotFound } } },
    "/api/alertas-correo/enviar": { post: { tags: ["Alertas"], summary: "Enviar alertas preventivas manualmente (ADMIN)", responses: { "200": { description: "Resultado del envío" }, "401": commonResponses.Unauthorized, "403": commonResponses.Forbidden, "503": { description: "Correo no configurado" } } } },
  },
};