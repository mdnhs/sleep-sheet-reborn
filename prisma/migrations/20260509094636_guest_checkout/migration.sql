-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "shippingCity" DROP NOT NULL,
ALTER COLUMN "shippingState" DROP NOT NULL,
ALTER COLUMN "shippingPostalCode" DROP NOT NULL,
ALTER COLUMN "shippingCountry" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "orders_guestPhone_idx" ON "orders"("guestPhone");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
