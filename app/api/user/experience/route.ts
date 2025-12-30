import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { EXP_REWARDS } from '@/lib/user-level'

// 经验值类型
type ExperienceType = keyof typeof EXP_REWARDS

/**
 * POST /api/user/experience
 * 增加用户经验值
 *
 * 注意：此API目前未完全实现，User模型缺少experience和level字段
 * TODO: 添加experience和level字段到User模型，然后取消注释相关代码
 */
export async function POST(request: NextRequest) {
  try {
    // 从Cookie获取token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证token
    await verifyToken(token)

    // 解析请求体
    const body = await request.json()
    const { type } = body // type: 'CHAT' | 'ACTIVATE_AGENT' | 'INVITE_USER' 等

    if (!type) {
      return NextResponse.json({ error: '缺少经验值类型' }, { status: 400 })
    }

    // 验证type是否有效
    const expReward = EXP_REWARDS[type as ExperienceType]

    if (expReward === undefined) {
      return NextResponse.json({ error: '无效的经验值类型' }, { status: 400 })
    }

    // TODO: 实现经验值系统
    // 当前User模型缺少experience和level字段，此功能暂时不可用
    return NextResponse.json({
      success: true,
      message: '经验值功能尚未实现',
      expGained: expReward,
      note: '请先在数据库添加experience和level字段',
    })
  } catch (error: any) {
    console.error('增加经验值错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
