-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "price" REAL NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seriesId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "abilities" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "systemPrompt" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agents_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_agents" ("abilities", "avatar", "botId", "createdAt", "deletedAt", "description", "id", "isActive", "name", "price", "rarity", "slug", "stock", "systemPrompt", "updatedAt") SELECT "abilities", "avatar", "botId", "createdAt", "deletedAt", "description", "id", "isActive", "name", "price", "rarity", "slug", "stock", "systemPrompt", "updatedAt" FROM "agents";
DROP TABLE "agents";
ALTER TABLE "new_agents" RENAME TO "agents";
CREATE UNIQUE INDEX "agents_slug_key" ON "agents"("slug");
CREATE INDEX "agents_slug_idx" ON "agents"("slug");
CREATE INDEX "agents_seriesId_idx" ON "agents"("seriesId");
CREATE INDEX "agents_deletedAt_idx" ON "agents"("deletedAt");
CREATE INDEX "agents_isActive_idx" ON "agents"("isActive");
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT,
    "agentId" TEXT,
    "activationCodeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_activationCodeId_fkey" FOREIGN KEY ("activationCodeId") REFERENCES "activation_codes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("activationCodeId", "agentId", "amount", "createdAt", "id", "paymentMethod", "status", "transactionId", "updatedAt", "userId") SELECT "activationCodeId", "agentId", "amount", "createdAt", "id", "paymentMethod", "status", "transactionId", "updatedAt", "userId" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_activationCodeId_key" ON "orders"("activationCodeId");
CREATE INDEX "orders_userId_idx" ON "orders"("userId");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_seriesId_idx" ON "orders"("seriesId");
CREATE INDEX "orders_agentId_idx" ON "orders"("agentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE INDEX "series_slug_idx" ON "series"("slug");

-- CreateIndex
CREATE INDEX "series_isActive_idx" ON "series"("isActive");

-- CreateIndex
CREATE INDEX "series_order_idx" ON "series"("order");
