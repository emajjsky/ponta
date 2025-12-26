import prisma from '@/lib/prisma'

/**
 * 激活码格式：PONTA + 10位字符（数字或大写字母）
 * 示例：PONTA1234567890、PONTA5Z5C4A2GH0
 */
const ACTIVATION_CODE_REGEX = /^PONTA[A-Z0-9]{10}$/i

/**
 * 激活结果接口
 */
export interface ActivationResult {
  success: boolean
  agent?: {
    id: string
    name: string
    slug: string
    rarity: string
    avatar: string
    description: string
    abilities: string[]
  }
  userAgent?: {
    id: string
    activatedAt: Date
  }
  error?: string
  message?: string
}

/**
 * 验证激活码格式
 * @param code 激活码
 * @returns 是否有效
 */
export function validateActivationCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false
  }

  // 去除首尾空格
  const trimmedCode = code.trim()

  // 检查格式
  return ACTIVATION_CODE_REGEX.test(trimmedCode)
}

/**
 * 规范化激活码（转大写并去除空格）
 * @param code 激活码
 * @returns 规范化后的激活码
 */
export function normalizeActivationCode(code: string): string {
  return code.trim().toUpperCase()
}

/**
 * 激活智能体
 * @param code 激活码
 * @param userId 用户 ID
 * @returns 激活结果
 */
export async function activateAgent(
  code: string,
  userId: string
): Promise<ActivationResult> {
  try {
    // 规范化激活码
    const normalizedCode = normalizeActivationCode(code)

    // 验证格式
    if (!validateActivationCodeFormat(normalizedCode)) {
      return {
        success: false,
        error: 'ACTIVATION_CODE_INVALID',
        message: '激活码格式不正确，请检查后重试',
      }
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 查询激活码
      const activationCode = await tx.activationCode.findUnique({
        where: { code: normalizedCode },
        include: {
          agent: true,
        },
      })

      // 激活码不存在
      if (!activationCode) {
        throw new Error('ACTIVATION_CODE_NOT_FOUND')
      }

      // 激活码已使用
      if (activationCode.status === 'ACTIVATED') {
        throw new Error('ACTIVATION_CODE_ALREADY_USED')
      }

      // 激活码已失效
      if (activationCode.status === 'VOID') {
        throw new Error('ACTIVATION_CODE_VOID')
      }

      // 检查智能体是否存在
      if (!activationCode.agent || activationCode.agent.deletedAt) {
        throw new Error('AGENT_NOT_FOUND')
      }

      // 创建用户-智能体关联记录
      const userAgent = await tx.userAgent.create({
        data: {
          userId: userId,
          agentId: activationCode.agentId,
          activationCodeId: activationCode.id,
          activatedAt: new Date(),
        },
      })

      // 更新激活码状态
      await tx.activationCode.update({
        where: { id: activationCode.id },
        data: {
          status: 'ACTIVATED',
          userId: userId,
          activatedAt: new Date(),
        },
      })

      return {
        activationCode,
        agent: activationCode.agent,
        userAgent,
      }
    })

    // 解析智能体的 abilities
    const agentWithParsedAbilities = {
      ...result.agent,
      abilities: JSON.parse(result.agent.abilities),
    }

    return {
      success: true,
      agent: agentWithParsedAbilities,
      userAgent: {
        id: result.userAgent.id,
        activatedAt: result.userAgent.activatedAt,
      },
      message: '激活成功！',
    }
  } catch (error) {
    console.error('激活智能体错误:', error)

    // 处理特定错误
    if (error instanceof Error) {
      switch (error.message) {
        case 'ACTIVATION_CODE_NOT_FOUND':
          return {
            success: false,
            error: 'ACTIVATION_CODE_NOT_FOUND',
            message: '激活码不存在，请检查后重试',
          }
        case 'ACTIVATION_CODE_ALREADY_USED':
          return {
            success: false,
            error: 'ACTIVATION_CODE_ALREADY_USED',
            message: '该激活码已被使用',
          }
        case 'ACTIVATION_CODE_VOID':
          return {
            success: false,
            error: 'ACTIVATION_CODE_VOID',
            message: '该激活码已失效',
          }
        case 'AGENT_NOT_FOUND':
          return {
            success: false,
            error: 'AGENT_NOT_FOUND',
            message: '关联的智能体不存在',
          }
      }
    }

    // 未知错误
    return {
      success: false,
      error: 'ACTIVATION_FAILED',
      message: '激活失败，请稍后重试',
    }
  }
}

/**
 * 检查用户是否已拥有某个智能体
 * @param userId 用户 ID
 * @param agentId 智能 ID
 * @returns 是否已拥有
 */
export async function checkUserOwnsAgent(
  userId: string,
  agentId: string
): Promise<boolean> {
  const userAgent = await prisma.userAgent.findFirst({
    where: {
      userId,
      agentId,
    },
  })

  return !!userAgent
}

/**
 * 获取用户拥有的智能体数量
 * @param userId 用户 ID
 * @returns 智能体数量
 */
export async function getUserAgentCount(userId: string): Promise<number> {
  const count = await prisma.userAgent.count({
    where: {
      userId,
    },
  })

  return count
}

/**
 * 获取用户拥有的智能体列表
 * @param userId 用户 ID
 * @returns 用户-智能体列表
 */
export async function getUserAgents(userId: string) {
  const userAgents = await prisma.userAgent.findMany({
    where: {
      userId,
      agent: {
        deletedAt: null,
      },
    },
    include: {
      agent: true,
    },
    orderBy: {
      activatedAt: 'desc',
    },
  })

  // 过滤掉已删除的智能体
  const validUserAgents = userAgents.filter((ua) => ua.agent !== null)

  // 解析 abilities
  return validUserAgents.map((ua) => ({
    id: ua.id,
    activatedAt: ua.activatedAt,
    agent: {
      ...ua.agent,
      abilities: JSON.parse(ua.agent!.abilities),
    },
  }))
}
