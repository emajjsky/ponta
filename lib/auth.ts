import bcrypt from 'bcrypt'

/**
 * 密码哈希（加密）
 * @param password 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // 盐值轮数，越高越安全但越慢
  const hashedPassword = await bcrypt.hash(password, saltRounds)
  return hashedPassword
}

/**
 * 密码比对
 * @param password 明文密码
 * @param hashedPassword 哈希后的密码
 * @returns 是否匹配
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hashedPassword)
  return isMatch
}

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度
 * 密码要求：至少8个字符，包含字母和数字
 * @param password 密码
 * @returns 是否有效
 */
export function isValidPassword(password: string): boolean {
  // 至少8个字符
  if (password.length < 8) return false

  // 包含至少一个字母
  const hasLetter = /[a-zA-Z]/.test(password)
  if (!hasLetter) return false

  // 包含至少一个数字
  const hasNumber = /[0-9]/.test(password)
  if (!hasNumber) return false

  return true
}

/**
 * 验证昵称格式
 * @param nickname 昵称
 * @returns 是否有效
 */
export function isValidNickname(nickname: string): boolean {
  // 长度检查：2-20个字符
  if (nickname.length < 2 || nickname.length > 20) {
    return false
  }

  // 支持中英文、数字、下划线、连字符
  const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/
  return nicknameRegex.test(nickname)
}
