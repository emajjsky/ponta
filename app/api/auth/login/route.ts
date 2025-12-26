import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'
import { generateToken } from '@/lib/jwt'

/**
 * POST /api/auth/login
 * 用户登录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 参数验证
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // 用户不存在
    if (!user) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    // 检查用户状态
    if (user.status === 'BANNED') {
      return NextResponse.json(
        { error: '该账号已被封禁' },
        { status: 403 }
      )
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    // 生成 Token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    })

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    }

    // 设置 HttpOnly Cookie
    const response = NextResponse.json(
      {
        success: true,
        message: '登录成功',
        user: userResponse,
      },
      { status: 200 }
    )

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
    })

    return response
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
