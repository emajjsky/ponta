import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, isValidEmail, isValidPassword, isValidNickname } from '@/lib/auth'
import { generateToken } from '@/lib/jwt'

/**
 * POST /api/auth/register
 * 用户注册
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nickname } = body

    // 参数验证
    if (!email || !password || !nickname) {
      return NextResponse.json(
        { error: '邮箱、密码和昵称不能为空' },
        { status: 400 }
      )
    }

    // 格式验证
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: '密码至少8个字符，必须包含字母和数字' },
        { status: 400 }
      )
    }

    if (!isValidNickname(nickname)) {
      return NextResponse.json(
        { error: '昵称必须是2-20个字符，支持中英文、数字、下划线' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 409 }
      )
    }

    // 密码加密
    const hashedPassword = await hashPassword(password)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        status: 'ACTIVE',
        role: 'USER', // 默认为普通用户
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    // 生成 Token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    })

    // 设置 HttpOnly Cookie
    const response = NextResponse.json(
      {
        success: true,
        message: '注册成功',
        user,
      },
      { status: 201 }
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
    console.error('注册错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
