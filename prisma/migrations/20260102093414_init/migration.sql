-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,
    "phone" TEXT,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "province" TEXT,
    "city" TEXT,
    "district" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalAgents" INTEGER NOT NULL DEFAULT 0,
    "totalChats" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "series" (
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

-- CreateTable
CREATE TABLE "agents" (
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

-- CreateTable
CREATE TABLE "orders" (
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

-- CreateTable
CREATE TABLE "activation_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNUSED',
    "userId" TEXT,
    "activatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "activation_codes_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "activation_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "activationCodeId" TEXT NOT NULL,
    "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChatAt" DATETIME,
    CONSTRAINT "user_agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_agents_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_agents_activationCodeId_fkey" FOREIGN KEY ("activationCodeId") REFERENCES "activation_codes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_histories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userAgentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT,
    "conversationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chat_histories_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chat_histories_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "user_agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exchanges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activationCodeId" TEXT NOT NULL,
    "wantedAgentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exchanges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exchanges_activationCodeId_fkey" FOREIGN KEY ("activationCodeId") REFERENCES "activation_codes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exchanges_wantedAgentId_fkey" FOREIGN KEY ("wantedAgentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exchange_proposals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exchangeId" TEXT NOT NULL,
    "proposerUserId" TEXT NOT NULL,
    "proposerCodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exchange_proposals_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "exchanges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exchange_proposals_proposerUserId_fkey" FOREIGN KEY ("proposerUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exchange_proposals_proposerCodeId_fkey" FOREIGN KEY ("proposerCodeId") REFERENCES "activation_codes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uid_key" ON "users"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_uid_idx" ON "users"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE INDEX "series_slug_idx" ON "series"("slug");

-- CreateIndex
CREATE INDEX "series_isActive_idx" ON "series"("isActive");

-- CreateIndex
CREATE INDEX "series_order_idx" ON "series"("order");

-- CreateIndex
CREATE UNIQUE INDEX "agents_slug_key" ON "agents"("slug");

-- CreateIndex
CREATE INDEX "agents_slug_idx" ON "agents"("slug");

-- CreateIndex
CREATE INDEX "agents_seriesId_idx" ON "agents"("seriesId");

-- CreateIndex
CREATE INDEX "agents_deletedAt_idx" ON "agents"("deletedAt");

-- CreateIndex
CREATE INDEX "agents_isActive_idx" ON "agents"("isActive");

-- CreateIndex
CREATE INDEX "agents_provider_idx" ON "agents"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "orders_activationCodeId_key" ON "orders"("activationCodeId");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_seriesId_idx" ON "orders"("seriesId");

-- CreateIndex
CREATE INDEX "orders_agentId_idx" ON "orders"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "activation_codes_code_key" ON "activation_codes"("code");

-- CreateIndex
CREATE INDEX "activation_codes_code_idx" ON "activation_codes"("code");

-- CreateIndex
CREATE INDEX "activation_codes_status_idx" ON "activation_codes"("status");

-- CreateIndex
CREATE INDEX "activation_codes_userId_idx" ON "activation_codes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_agents_activationCodeId_key" ON "user_agents"("activationCodeId");

-- CreateIndex
CREATE INDEX "user_agents_userId_idx" ON "user_agents"("userId");

-- CreateIndex
CREATE INDEX "user_agents_agentId_idx" ON "user_agents"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "user_agents_userId_agentId_key" ON "user_agents"("userId", "agentId");

-- CreateIndex
CREATE INDEX "chat_histories_userId_idx" ON "chat_histories"("userId");

-- CreateIndex
CREATE INDEX "chat_histories_agentId_idx" ON "chat_histories"("agentId");

-- CreateIndex
CREATE INDEX "chat_histories_conversationId_idx" ON "chat_histories"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_activationCodeId_key" ON "exchanges"("activationCodeId");

-- CreateIndex
CREATE INDEX "exchanges_status_idx" ON "exchanges"("status");

-- CreateIndex
CREATE INDEX "exchanges_userId_idx" ON "exchanges"("userId");

-- CreateIndex
CREATE INDEX "exchanges_wantedAgentId_idx" ON "exchanges"("wantedAgentId");

-- CreateIndex
CREATE INDEX "exchange_proposals_exchangeId_idx" ON "exchange_proposals"("exchangeId");

-- CreateIndex
CREATE INDEX "exchange_proposals_status_idx" ON "exchange_proposals"("status");

-- CreateIndex
CREATE INDEX "exchange_proposals_proposerUserId_idx" ON "exchange_proposals"("proposerUserId");

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");
