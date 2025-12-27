-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "purchaseUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_series" ("coverImage", "createdAt", "description", "id", "isActive", "name", "order", "price", "slug", "updatedAt") SELECT "coverImage", "createdAt", "description", "id", "isActive", "name", "order", "price", "slug", "updatedAt" FROM "series";
DROP TABLE "series";
ALTER TABLE "new_series" RENAME TO "series";
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");
CREATE INDEX "series_slug_idx" ON "series"("slug");
CREATE INDEX "series_isActive_idx" ON "series"("isActive");
CREATE INDEX "series_order_idx" ON "series"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
