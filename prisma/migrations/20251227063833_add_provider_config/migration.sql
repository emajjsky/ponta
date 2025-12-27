-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seriesId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'COZE',
    "providerConfig" TEXT NOT NULL DEFAULT '{}',
    "botId" TEXT,
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
INSERT INTO "new_agents" ("abilities", "avatar", "botId", "createdAt", "deletedAt", "description", "id", "isActive", "name", "price", "rarity", "seriesId", "slug", "stock", "systemPrompt", "updatedAt") SELECT "abilities", "avatar", "botId", "createdAt", "deletedAt", "description", "id", "isActive", "name", "price", "rarity", "seriesId", "slug", "stock", "systemPrompt", "updatedAt" FROM "agents";
DROP TABLE "agents";
ALTER TABLE "new_agents" RENAME TO "agents";
CREATE UNIQUE INDEX "agents_slug_key" ON "agents"("slug");
CREATE INDEX "agents_slug_idx" ON "agents"("slug");
CREATE INDEX "agents_seriesId_idx" ON "agents"("seriesId");
CREATE INDEX "agents_deletedAt_idx" ON "agents"("deletedAt");
CREATE INDEX "agents_isActive_idx" ON "agents"("isActive");
CREATE INDEX "agents_provider_idx" ON "agents"("provider");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
