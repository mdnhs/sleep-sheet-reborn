/*
  Warnings:

  - You are about to drop the column `ownerId` on the `products` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_ownerId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "ownerId";
