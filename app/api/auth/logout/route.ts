import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * 用户登出
 */
export async function POST(request: NextRequest) {
  try {
    // 清除 Cookie
    const response = NextResponse.json(
      {
        success: true,
        message: '登出成功',
      },
      { status: 200 }
    )

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 立即过期
      path: '/',
    })

    return response
  } catch (error) {
    console.error('登出错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
