import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt'

/**
 * 不需要认证的路径
 */
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/activate',
  '/shop',
  '/agents',
  '/api/auth/login',
  '/api/auth/register',
  '/api/agents',
]

/**
 * 检查路径是否为公开路径
 * @param path 请求路径
 * @returns 是否为公开路径
 */
function isPublicPath(path: string): boolean {
  return publicPaths.some((publicPath) => path.startsWith(publicPath))
}

/**
 * 中间件：认证保护
 * 对所有非公开路径进行 Token 验证
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路径直接放行
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // 从 Cookie 中获取 Token
  const token = request.cookies.get('auth-token')?.value

  // 如果没有 Token，重定向到登录页
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // 验证 Token
    await verifyToken(token)

    // Token 有效，放行
    return NextResponse.next()
  } catch (error) {
    // Token 无效或已过期，重定向到登录页
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    loginUrl.searchParams.set('error', 'token_expired')
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * 中间件配置
 * 匹配所有路径，除了静态文件、_next、api等
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public folder (public 目录下的文件)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
