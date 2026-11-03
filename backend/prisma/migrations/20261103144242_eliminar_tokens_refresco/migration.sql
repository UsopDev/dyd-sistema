/*
  Warnings:

  - You are about to drop the `tokens_refresco` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tokens_refresco" DROP CONSTRAINT "tokens_refresco_id_usuario_fkey";

-- DropTable
DROP TABLE "tokens_refresco";
