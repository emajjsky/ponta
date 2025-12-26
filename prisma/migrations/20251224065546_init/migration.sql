-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "abilities" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "activationCodeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
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
    "conversationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chat_histories_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chat_histories_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "user_agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agents_slug_key" ON "agents"("slug");

-- CreateIndex
CREATE INDEX "agents_slug_idx" ON "agents"("slug");

-- CreateIndex
CREATE INDEX "agents_deletedAt_idx" ON "agents"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_activationCodeId_key" ON "orders"("activationCodeId");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

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
