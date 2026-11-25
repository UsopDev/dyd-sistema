/*
  Warnings:

  - You are about to drop the `cliente_refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `password_hash` on the `clientes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "cliente_refresh_tokens" DROP CONSTRAINT "cliente_refresh_tokens_id_cliente_fkey";

-- DropTable
DROP TABLE "cliente_refresh_tokens";

-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "password_hash";
