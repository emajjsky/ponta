import { SignJWT, jwtVerify } from 'jose'

/**
 * JWT 配置
 */
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ponta-ponta-secret-key-change-in-production'
)

const JWT_ISSUER = 'ponta-ponta'
const JWT_AUDIENCE = 'ponta-ponta-users'

/**
 * Token 载荷接口
 */
export interface TokenPayload {
  userId: string
  email: string
  nickname: string
  role?: string // 用户角色（USER | ADMIN）
}

/**
 * 生成 JWT Token
 * @param payload Token 载荷数据
 * @returns JWT Token 字符串
 */
export async function generateToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('7d') // Token 有效期：7天
    .sign(JWT_SECRET)

  return token
}

/**
 * 验证 JWT Token
 * @param token JWT Token 字符串
 * @returns Token 载荷数据
 * @throws Error 如果 Token 无效或已过期
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      nickname: payload.nickname as string,
      role: payload.role as string | undefined,
    }
  } catch (error) {
    throw new Error('无效的 Token 或已过期')
  }
}

/**
 * 从请求头中提取 Token
 * @param authHeader Authorization 请求头
 * @returns Token 字符串或 null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null

  // Bearer Token 格式: "Bearer {token}"
  const parts = authHeader.split(' ')
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1]
  }

  return null
}
