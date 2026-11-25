-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('ADMINISTRADOR', 'TECNICO');

-- CreateEnum
CREATE TYPE "estado_maquina" AS ENUM ('OPERATIVA', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO');

-- CreateEnum
CREATE TYPE "tipo_servicio" AS ENUM ('PREVENTIVO', 'CORRECTIVO');

-- CreateEnum
CREATE TYPE "prioridad" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "estado_solicitud" AS ENUM ('RECIBIDA', 'EN_DIAGNOSTICO', 'COTIZADA', 'ASIGNADA', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "estado_general" AS ENUM ('BUENO', 'REGULAR', 'MALO', 'CRITICO');

-- CreateEnum
CREATE TYPE "estado_orden" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "tipo_movimiento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "tipo_item" AS ENUM ('SERVICIO', 'MATERIAL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombres" VARCHAR(80) NOT NULL,
    "apellidos" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "rol_usuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" UUID NOT NULL DEFAULT gen_random_uuid(),
    "razon_social" VARCHAR(150) NOT NULL,
    "ruc_dni" VARCHAR(15),
    "contacto" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(120),
    "direccion" VARCHAR(200),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "maquinas" (
    "id_maquina" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cliente" UUID,
    "codigo" VARCHAR(30),
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50),
    "marca" VARCHAR(50),
    "modelo" VARCHAR(50),
    "nro_serie" VARCHAR(50),
    "es_propia" BOOLEAN NOT NULL DEFAULT false,
    "horas_uso" DECIMAL(10,1) NOT NULL DEFAULT 0,
    "estado" "estado_maquina" NOT NULL DEFAULT 'OPERATIVA',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id_maquina")
);

-- CreateTable
CREATE TABLE "programaciones_preventivas" (
    "id_programacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_maquina" UUID NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,
    "frecuencia_horas" INTEGER,
    "frecuencia_dias" INTEGER,
    "dias_aviso" INTEGER NOT NULL DEFAULT 7,
    "horas_aviso" DECIMAL(6,1) NOT NULL DEFAULT 10,
    "horas_ultimo_mant" DECIMAL(10,1),
    "fecha_ultimo_mant" DATE,
    "proximo_mant" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programaciones_preventivas_pkey" PRIMARY KEY ("id_programacion")
);

-- CreateTable
CREATE TABLE "alertas_preventivas" (
    "id_alerta" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_programacion" UUID NOT NULL,
    "proximo_mant" DATE NOT NULL,
    "enviada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_preventivas_pkey" PRIMARY KEY ("id_alerta")
);

-- CreateTable
CREATE TABLE "registros_uso" (
    "id_registro_uso" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_maquina" UUID NOT NULL,
    "id_usuario_registrado" UUID NOT NULL,
    "horas" DECIMAL(6,1) NOT NULL,
    "fecha" DATE NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_uso_pkey" PRIMARY KEY ("id_registro_uso")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id_solicitud" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(20),
    "id_cliente" UUID,
    "id_maquina" UUID NOT NULL,
    "id_usuario_registrado" UUID NOT NULL,
    "id_programacion" UUID,
    "tipo_servicio" "tipo_servicio" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "prioridad" "prioridad" NOT NULL DEFAULT 'MEDIA',
    "estado" "estado_solicitud" NOT NULL DEFAULT 'RECIBIDA',
    "fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id_diagnostico" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_solicitud" UUID NOT NULL,
    "id_maquina" UUID NOT NULL,
    "id_tecnico" UUID NOT NULL,
    "estado_general" "estado_general" NOT NULL,
    "fallas_detectadas" TEXT NOT NULL,
    "observaciones" TEXT,
    "recomendaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id_diagnostico")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id_cotizacion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(20),
    "id_solicitud" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id_cotizacion")
);

-- CreateTable
CREATE TABLE "cotizacion_detalle" (
    "id_detalle" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cotizacion" UUID NOT NULL,
    "tipo" "tipo_item" NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,
    "id_material" UUID,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "cotizacion_detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id_orden_trabajo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(20),
    "id_solicitud" UUID NOT NULL,
    "id_diagnostico" UUID NOT NULL,
    "id_tecnico" UUID NOT NULL,
    "estado" "estado_orden" NOT NULL DEFAULT 'PENDIENTE',
    "trabajo_realizado" TEXT,
    "monto" DECIMAL(10,2),
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id_orden_trabajo")
);

-- CreateTable
CREATE TABLE "adjuntos" (
    "id_adjunto" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_diagnostico" UUID,
    "id_orden_trabajo" UUID,
    "nombre_original" VARCHAR(150) NOT NULL,
    "clave_almacenamiento" VARCHAR(255) NOT NULL,
    "tipo_mime" VARCHAR(100),
    "tamano_bytes" INTEGER,
    "id_usuario_subio" UUID NOT NULL,
    "subido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjuntos_pkey" PRIMARY KEY ("id_adjunto")
);

-- CreateTable
CREATE TABLE "materiales" (
    "id_material" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(30),
    "nombre" VARCHAR(100) NOT NULL,
    "unidad" VARCHAR(20) NOT NULL,
    "stock_actual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock_minimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_unitario" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "orden_materiales" (
    "id_orden_material" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_orden_trabajo" UUID NOT NULL,
    "id_material" UUID NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2),

    CONSTRAINT "orden_materiales_pkey" PRIMARY KEY ("id_orden_material")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id_movimiento" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_material" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "id_orden_trabajo" UUID,
    "tipo" "tipo_movimiento" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "motivo" VARCHAR(150),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_ruc_dni_key" ON "clientes"("ruc_dni");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "maquinas_codigo_key" ON "maquinas"("codigo");

-- CreateIndex
CREATE INDEX "maquinas_id_cliente_idx" ON "maquinas"("id_cliente");

-- CreateIndex
CREATE INDEX "programaciones_preventivas_proximo_mant_idx" ON "programaciones_preventivas"("proximo_mant");

-- CreateIndex
CREATE UNIQUE INDEX "alertas_preventivas_id_programacion_proximo_mant_key" ON "alertas_preventivas"("id_programacion", "proximo_mant");

-- CreateIndex
CREATE INDEX "registros_uso_id_maquina_fecha_idx" ON "registros_uso"("id_maquina", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_codigo_key" ON "solicitudes"("codigo");

-- CreateIndex
CREATE INDEX "solicitudes_estado_prioridad_idx" ON "solicitudes"("estado", "prioridad");

-- CreateIndex
CREATE INDEX "solicitudes_id_maquina_idx" ON "solicitudes"("id_maquina");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosticos_id_solicitud_key" ON "diagnosticos"("id_solicitud");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_codigo_key" ON "cotizaciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_codigo_key" ON "ordenes_trabajo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_id_solicitud_key" ON "ordenes_trabajo"("id_solicitud");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_id_diagnostico_key" ON "ordenes_trabajo"("id_diagnostico");

-- CreateIndex
CREATE UNIQUE INDEX "materiales_codigo_key" ON "materiales"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "orden_materiales_id_orden_trabajo_id_material_key" ON "orden_materiales"("id_orden_trabajo", "id_material");

-- CreateIndex
CREATE INDEX "movimientos_inventario_id_material_fecha_idx" ON "movimientos_inventario"("id_material", "fecha");

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programaciones_preventivas" ADD CONSTRAINT "programaciones_preventivas_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "maquinas"("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_preventivas" ADD CONSTRAINT "alertas_preventivas_id_programacion_fkey" FOREIGN KEY ("id_programacion") REFERENCES "programaciones_preventivas"("id_programacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_uso" ADD CONSTRAINT "registros_uso_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "maquinas"("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_uso" ADD CONSTRAINT "registros_uso_id_usuario_registrado_fkey" FOREIGN KEY ("id_usuario_registrado") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "maquinas"("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_id_usuario_registrado_fkey" FOREIGN KEY ("id_usuario_registrado") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_id_programacion_fkey" FOREIGN KEY ("id_programacion") REFERENCES "programaciones_preventivas"("id_programacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitudes"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "maquinas"("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_id_tecnico_fkey" FOREIGN KEY ("id_tecnico") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitudes"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_detalle" ADD CONSTRAINT "cotizacion_detalle_id_cotizacion_fkey" FOREIGN KEY ("id_cotizacion") REFERENCES "cotizaciones"("id_cotizacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_detalle" ADD CONSTRAINT "cotizacion_detalle_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id_material") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitudes"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_id_diagnostico_fkey" FOREIGN KEY ("id_diagnostico") REFERENCES "diagnosticos"("id_diagnostico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_id_tecnico_fkey" FOREIGN KEY ("id_tecnico") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_id_diagnostico_fkey" FOREIGN KEY ("id_diagnostico") REFERENCES "diagnosticos"("id_diagnostico") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_id_orden_trabajo_fkey" FOREIGN KEY ("id_orden_trabajo") REFERENCES "ordenes_trabajo"("id_orden_trabajo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_id_usuario_subio_fkey" FOREIGN KEY ("id_usuario_subio") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_materiales" ADD CONSTRAINT "orden_materiales_id_orden_trabajo_fkey" FOREIGN KEY ("id_orden_trabajo") REFERENCES "ordenes_trabajo"("id_orden_trabajo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_materiales" ADD CONSTRAINT "orden_materiales_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_orden_trabajo_fkey" FOREIGN KEY ("id_orden_trabajo") REFERENCES "ordenes_trabajo"("id_orden_trabajo") ON DELETE SET NULL ON UPDATE CASCADE;
