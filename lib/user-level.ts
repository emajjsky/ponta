/**
 * 用户等级系统工具函数
 */

/**
 * 等级配置表
 * 每个等级需要的经验值和奖励
 */
export const LEVEL_CONFIG = {
  1: { requiredExp: 0, title: '新手冒险家', maxAgents: 3 },
  10: { requiredExp: 100, title: '探索者', maxAgents: 5 },
  20: { requiredExp: 500, title: '收藏家', maxAgents: 10 },
  30: { requiredExp: 1500, title: '资深收藏家', maxAgents: 15 },
  40: { requiredExp: 3500, title: '大师', maxAgents: 20 },
  50: { requiredExp: 7000, title: '传奇大师', maxAgents: 30 },
  60: { requiredExp: 12000, title: '至尊传奇', maxAgents: 50 },
  100: { requiredExp: 50000, title: '不朽传说', maxAgents: 999 },
}

/**
 * 计算用户当前等级
 * @param experience 用户当前经验值
 * @returns 用户等级
 */
export function calculateLevel(experience: number): number {
  let level = 1
  for (const [lvl, config] of Object.entries(LEVEL_CONFIG)) {
    const levelNum = parseInt(lvl)
    if (experience >= config.requiredExp) {
      level = levelNum
    } else {
      break
    }
  }
  return level
}

/**
 * 计算升级所需经验值
 * @param currentLevel 当前等级
 * @returns 升到下一级所需经验值
 */
export function getExpToNextLevel(currentLevel: number): number {
  const levels = Object.keys(LEVEL_CONFIG)
    .map(Number)
    .sort((a, b) => a - b)

  // 找到下一个等级
  const nextLevel = levels.find(lvl => lvl > currentLevel)

  if (!nextLevel) {
    return 0 // 已经是最高等级
  }

  const nextLevelConfig = LEVEL_CONFIG[nextLevel as keyof typeof LEVEL_CONFIG]
  const currentLevelConfig = LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1]

  return nextLevelConfig.requiredExp - currentLevelConfig.requiredExp
}

/**
 * 获取当前等级配置
 * @param level 等级
 * @returns 等级配置
 */
export function getLevelConfig(level: number) {
  // 找到最接近的等级配置
  const levels = Object.keys(LEVEL_CONFIG)
    .map(Number)
    .sort((a, b) => a - b)

  let configLevel = 1
  for (const lvl of levels) {
    if (level >= lvl) {
      configLevel = lvl
    } else {
      break
    }
  }

  return LEVEL_CONFIG[configLevel as keyof typeof LEVEL_CONFIG]
}

/**
 * 增加用户经验值
 * @param currentExp 当前经验值
 * @param expToAdd 增加的经验值
 * @returns { newExp, newLevel, leveledUp, titleChange }
 */
export function addExperience(
  currentExp: number,
  expToAdd: number
): {
  newExp: number
  newLevel: number
  oldLevel: number
  leveledUp: boolean
  titleChange: boolean
  oldTitle: string
  newTitle: string
} {
  const oldLevel = calculateLevel(currentExp)
  const oldTitle = getLevelConfig(oldLevel).title
  const newExp = currentExp + expToAdd
  const newLevel = calculateLevel(newExp)
  const newTitle = getLevelConfig(newLevel).title

  return {
    newExp,
    newLevel,
    oldLevel,
    leveledUp: newLevel > oldLevel,
    titleChange: newTitle !== oldTitle,
    oldTitle,
    newTitle,
  }
}

/**
 * 经验值获取规则
 */
export const EXP_REWARDS = {
  // 注册
  REGISTER: 0,

  // 激活智能体
  ACTIVATE_AGENT: 100,
  ACTIVATE_RARE_AGENT: 200,
  ACTIVATE_HIDDEN_AGENT: 500,

  // 对话
  CHAT: 10,
  CHAT_FIRST_DAILY: 50, // 每天第一次对话
  CHAT_STREAK_7: 100, // 连续7天对话

  // 社交
  INVITE_USER: 500,
  EXCHANGE_AGENT: 50,

  // 闯关
  PASS_LEVEL: 200,
  PASS_HARD_LEVEL: 500,

  // 成就
  UNLOCK_ACHIEVEMENT: 50,

  // 特殊活动
  DAILY_LOGIN: 20, // 每日登录
  WEEKLY_LOGIN_7: 200, // 连续7天登录
}

/**
 * 检查用户是否可以解锁新智能体
 * @param userLevel 用户等级
 * @param currentAgents 当前拥有的智能体数量
 * @returns 是否可以解锁
 */
export function canUnlockMoreAgents(userLevel: number, currentAgents: number): boolean {
  const config = getLevelConfig(userLevel)
  return currentAgents < config.maxAgents
}

/**
 * 获取用户等级进度百分比
 * @param experience 当前经验值
 * @returns 进度百分比 (0-100)
 */
export function getLevelProgress(experience: number): number {
  const currentLevel = calculateLevel(experience)
  const levels = Object.keys(LEVEL_CONFIG)
    .map(Number)
    .sort((a, b) => a - b)

  // 找到当前等级和下一等级
  let currentLevelConfig = LEVEL_CONFIG[1]
  let nextLevelConfig: typeof LEVEL_CONFIG[keyof typeof LEVEL_CONFIG] | null = null

  for (let i = 0; i < levels.length; i++) {
    if (currentLevel === levels[i]) {
      currentLevelConfig = LEVEL_CONFIG[levels[i] as keyof typeof LEVEL_CONFIG]
      if (i + 1 < levels.length) {
        nextLevelConfig = LEVEL_CONFIG[levels[i + 1] as keyof typeof LEVEL_CONFIG]
      }
      break
    }
  }

  if (!nextLevelConfig) {
    return 100 // 已经是最高等级
  }

  const currentLevelExp = experience - currentLevelConfig.requiredExp
  const levelExpNeeded = nextLevelConfig.requiredExp - currentLevelConfig.requiredExp

  return Math.min(100, Math.max(0, (currentLevelExp / levelExpNeeded) * 100))
}
