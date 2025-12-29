import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { addExperience, EXP_REWARDS, calculateLevel } from '@/lib/user-level'

/**
 * GET /api/user/profile
 * 获取当前用户的完整资料
 */
export async function GET(request: NextRequest) {
  try {
    // 从Cookie获取token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证token
    const payload = await verifyToken(token)

    // 查询用户完整信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        uid: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        level: true,
        experience: true,
        totalAgents: true,
        totalChats: true,
        totalAchievements: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 计算等级进度
    const currentLevel = calculateLevel(user.experience)
    const expToNext = currentLevel < 100
      ? (Object.values(require('@/lib/user-level').LEVEL_CONFIG)
          .find((config: any) => config.requiredExp > user.experience) || { requiredExp: user.experience })
          .requiredExp - user.experience
      : 0

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        level: currentLevel, // 使用计算的等级
        expToNext,
      },
    })
  } catch (error: any) {
    console.error('获取用户资料错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

/**
 * PUT /api/user/profile
 * 更新用户资料（昵称、头像、简介）
 */
export async function PUT(request: NextRequest) {
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
    const { nickname, avatar, bio } = body

    // 验证数据
    if (nickname && (nickname.length < 2 || nickname.length > 20)) {
      return NextResponse.json({ error: '昵称长度必须在2-20个字符之间' }, { status: 400 })
    }

    if (bio && bio.length > 200) {
      return NextResponse.json({ error: '个人简介不能超过200个字符' }, { status: 400 })
    }

    // 构建更新数据
    const updateData: any = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (avatar !== undefined) updateData.avatar = avatar
    if (bio !== undefined) updateData.bio = bio

    // 更新用户资料
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true,
        uid: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        level: true,
        experience: true,
        totalAgents: true,
        totalChats: true,
        totalAchievements: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: '资料更新成功',
    })
  } catch (error: any) {
    console.error('更新用户资料错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
