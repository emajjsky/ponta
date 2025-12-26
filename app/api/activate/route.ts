import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { activateAgent } from '@/lib/activation'

/**
 * POST /api/activate
 * 激活智能体
 *
 * 需要认证：是
 * Request Body:
 *   code: string - 激活码
 */
export async function POST(request: NextRequest) {
  try {
    // 从 Cookie 中获取 Token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录，请先登录' },
        { status: 401 }
      )
    }

    // 验证 Token
    let payload
    try {
      payload = await verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      )
    }

    // 获取请求体
    const body = await request.json()
    const { code } = body

    // 参数验证
    if (!code) {
      return NextResponse.json(
        { error: '激活码不能为空' },
        { status: 400 }
      )
    }

    // 调用激活函数
    const result = await activateAgent(code, payload.userId)

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          agent: result.agent,
          userAgent: result.userAgent,
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('激活 API 错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
