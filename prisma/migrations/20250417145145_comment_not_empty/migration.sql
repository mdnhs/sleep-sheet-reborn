/*
  Warnings:

  - You are about to drop the column `title` on the `product_reviews` table. All the data in the column will be lost.
  - Made the column `comment` on table `product_reviews` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "product_reviews" DROP COLUMN "title",
ALTER COLUMN "comment" SET NOT NULL;
