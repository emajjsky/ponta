import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { addExperience, getLevelConfig } from '@/lib/user-level'

/**
 * POST /api/user/experience
 * 增加用户经验值
 */
export async function POST(request: NextRequest) {
  try {
    // 从Cookie获取token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证token
    const payload = await verifyToken(token)

    // 解析请求体
    const body = await request.json()
    const { type, metadata } = body // type: 'CHAT' | 'ACTIVATE_AGENT' | 'INVITE_USER' 等

    if (!type) {
      return NextResponse.json({ error: '缺少经验值类型' }, { status: 400 })
    }

    // 获取经验值规则
    const { EXP_REWARDS } = await import('@/lib/user-level')
    const expReward = EXP_REWARDS[type] || 0

    if (expReward === 0) {
      return NextResponse.json({ error: '无效的经验值类型' }, { status: 400 })
    }

    // 查询当前用户
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        experience: true,
        level: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 计算新经验值和等级
    const result = addExperience(user.experience, expReward)

    // 更新用户数据
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        experience: result.newExp,
        level: result.newLevel,
      },
      select: {
        id: true,
        uid: true,
        nickname: true,
        avatar: true,
        level: true,
        experience: true,
        totalAgents: true,
        totalChats: true,
      },
    })

    // 返回结果
    const response: any = {
      success: true,
      expGained: expReward,
      newExp: result.newExp,
      newLevel: result.newLevel,
      user: updatedUser,
    }

    // 如果升级了，返回额外信息
    if (result.leveledUp) {
      response.leveledUp = true
      response.titleChange = result.titleChange
      response.oldTitle = result.oldTitle
      response.newTitle = result.newTitle
      response.rewards = getLevelConfig(result.newLevel)
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('增加经验值错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
