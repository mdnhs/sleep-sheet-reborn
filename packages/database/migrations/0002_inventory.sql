-- Inventory module: batch/lot tracking + immutable movement ledger.
-- productStock on "products" stays the synced source of truth; this adds the
-- audit trail, expiry batches, and a per-product reorder threshold.

-- CreateTable: inventory_batches (one row per receipt / lot)
CREATE TABLE "inventory_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "initialQuantity" INTEGER NOT NULL DEFAULT 0,
    "costPrice" REAL,
    "supplierName" TEXT,
    "manufactureDate" DATETIME,
    "expiryDate" DATETIME,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inventory_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "inventory_batches_productId_idx" ON "inventory_batches"("productId");
CREATE INDEX "inventory_batches_expiryDate_idx" ON "inventory_batches"("expiryDate");

-- CreateTable: inventory_movements (immutable ledger; quantity is signed)
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "unitCost" REAL,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "inventory_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "inventory_movements_productId_idx" ON "inventory_movements"("productId");
CREATE INDEX "inventory_movements_type_idx" ON "inventory_movements"("type");
CREATE INDEX "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt");

-- AlterTable: per-product reorder threshold for low-stock alerts
ALTER TABLE "products" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;
