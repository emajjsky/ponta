-- 添加用户系统字段迁移
-- 执行时间: 2025-12-29

-- 1. 为用户表添加UID和等级系统字段
ALTER TABLE users ADD COLUMN uid INTEGER UNIQUE;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE users ADD COLUMN experience INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN "totalAgents" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN "totalChats" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN "totalAchievements" INTEGER DEFAULT 0 NOT NULL;

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS "users_uid_idx" ON "users"("uid");
CREATE INDEX IF NOT EXISTS "users_level_idx" ON "users"("level");

-- 3. 为现有用户生成UID（从100001开始）
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") + 100000 as row_num
  FROM users
)
UPDATE users
SET uid = numbered_users.row_num
FROM numbered_users
WHERE users.id = numbered_users.id;

-- 4. 创建成就表
CREATE TABLE IF NOT EXISTS "achievements" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'COMMON',
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- 5. 创建成就表索引
CREATE UNIQUE INDEX IF NOT EXISTS "achievements_slug_key" ON "achievements"("slug");
CREATE INDEX IF NOT EXISTS "achievements_category_idx" ON "achievements"("category");

-- 6. 创建用户成就关联表
CREATE TABLE IF NOT EXISTS "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- 7. 创建用户成就关联表外键
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. 创建用户成就关联表索引和唯一约束
CREATE UNIQUE INDEX IF NOT EXISTS "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");
CREATE INDEX IF NOT EXISTS "user_achievements_userId_idx" ON "user_achievements"("userId");
CREATE INDEX IF NOT EXISTS "user_achievements_achievementId_idx" ON "user_achievements"("achievementId");

-- 9. 插入初始成就数据
INSERT INTO "achievements" ("id", "slug", "name", "description", "icon", "category", "rarity", "rewardXp") VALUES
('cmk000000000000000000001', 'first-agent', '初次见面', '激活你的第一个AI智能体', '🎁', 'COLLECTION', 'COMMON', 100),
('cmk000000000000000000002', 'collector-10', '收藏家', '收集10个不同的AI智能体', '📚', 'COLLECTION', 'RARE', 500),
('cmk000000000000000000003', 'collector-50', '百宝箱', '收集50个不同的AI智能体', '💎', 'COLLECTION', 'EPIC', 2000),
('cmk000000000000000000004', 'chatty-100', '健谈者', '累计对话100次', '💬', 'INTERACTION', 'COMMON', 100),
('cmk000000000000000000005', 'chatty-1000', '话痨', '累计对话1000次', '🗣️', 'INTERACTION', 'RARE', 500),
('cmk000000000000000000006', 'night-owl', '夜猫子', '在凌晨2-5点对话10次', '🦉', 'INTERACTION', 'RARE', 300),
('cmk000000000000000000007', 'loyal-friend', '知心朋友', '连续7天登录', '❤️', 'INTERACTION', 'RARE', 400),
('cmk000000000000000000008', 'social-butterfly', '社交达人', '成功交换5次智能体', '🦋', 'SOCIAL', 'RARE', 600),
('cmk000000000000000000009', 'inviter-10', '人脉王', '邀请10个好友注册', '👥', 'SOCIAL', 'EPIC', 1000),
('cmk000000000000000000010', 'level-10', '探索者', '达到10级', '⭐', 'CHALLENGE', 'COMMON', 200),
('cmk000000000000000000011', 'level-50', '大师', '达到50级', '🌟', 'CHALLENGE', 'EPIC', 5000),
('cmk000000000000000000012', 'hidden-hunter', '传奇猎人', '获得一个隐藏款智能体', '🏆', 'COLLECTION', 'LEGENDARY', 1000);
