/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "password_hash" VARCHAR(255);

-- CreateTable
CREATE TABLE "cliente_refresh_tokens" (
    "id_refresh_token" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cliente" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expira_en" TIMESTAMP(6) NOT NULL,
    "revocado_en" TIMESTAMP(6),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_refresh_tokens_pkey" PRIMARY KEY ("id_refresh_token")
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_refresh_tokens_token_hash_key" ON "cliente_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "cliente_refresh_tokens_id_cliente_idx" ON "cliente_refresh_tokens"("id_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- AddForeignKey
ALTER TABLE "cliente_refresh_tokens" ADD CONSTRAINT "cliente_refresh_tokens_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;
