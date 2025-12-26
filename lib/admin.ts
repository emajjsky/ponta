import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * 检查用户是否为管理员
 * @param userId 用户 ID
 * @returns 是否为管理员
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    return user?.role === 'ADMIN'
  } catch (error) {
    console.error('检查管理员权限错误:', error)
    return false
  }
}

/**
 * 管理员认证中间件
 * 用于保护后台管理路由
 */
export async function adminMiddleware(request: NextRequest) {
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

  // 检查是否为管理员
  const hasAdminRole = await isAdmin(payload.userId)

  if (!hasAdminRole) {
    return NextResponse.json(
      { error: '权限不足，需要管理员权限' },
      { status: 403 }
    )
  }

  // 通过验证，返回 payload（供后续使用）
  return { payload }
}

/**
 * 检查当前用户是否为管理员（供服务端组件使用）
 * @param request NextRequest 对象
 * @returns 用户信息或 null
 */
export async function getCurrentAdminUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyToken(token)
    const hasAdminRole = await isAdmin(payload.userId)

    if (!hasAdminRole) {
      return null
    }

    // 获取完整用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
      },
    })

    return user
  } catch (error) {
    console.error('获取管理员用户错误:', error)
    return null
  }
}

/**
 * API 路由辅助函数：验证管理员权限
 * 用于 API 路由中快速检查
 */
export async function requireAdmin(request: NextRequest) {
  const result = await adminMiddleware(request)

  // 如果返回 NextResponse（错误），直接抛出或返回
  if (result instanceof NextResponse) {
    throw new Error('ADMIN_REQUIRED')
  }

  // 返回用户 payload
  return result
}
