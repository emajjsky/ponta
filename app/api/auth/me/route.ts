import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
export async function GET(request: NextRequest) {
  try {
    // 从 Cookie 中获取 Token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 验证 Token
    let payload
    try {
      payload = await verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token 无效或已过期' },
        { status: 401 }
      )
    }

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 用户不存在
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查用户状态
    if (user.status === 'BANNED') {
      return NextResponse.json(
        { error: '该账号已被封禁' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
