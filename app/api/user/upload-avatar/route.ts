import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { verifyToken } from '@/lib/jwt'

/**
 * POST /api/user/upload-avatar
 * 上传用户头像
 *
 * 需要认证：是（普通用户）
 *
 * Request: multipart/form-data
 *   file: 图片文件
 *
 * Response:
 *   success: boolean
 *   url: string - 图片URL
 */
export async function POST(request: NextRequest) {
  try {
    // 从Cookie获取token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 验证token
    const payload = await verifyToken(token)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型，仅支持 JPG、PNG、GIF、WebP' },
        { status: 400 }
      )
    }

    // 验证文件大小（最大5MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过5MB' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成唯一文件名
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${random}.${extension}`

    // 确保上传目录存在（使用avatars子目录）
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 写入文件
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // 返回图片完整URL（从环境变量获取域名）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const url = `${baseUrl}/api/uploads/avatars/${filename}`
    return NextResponse.json(
      {
        success: true,
        url,
      },
      { status: 200 }
    )
  } catch (error: any) {
    // Token验证失败
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      return NextResponse.json(
        { error: 'Token无效或已过期' },
        { status: 401 }
      )
    }

    console.error('头像上传错误:', error)
    return NextResponse.json(
      { error: '头像上传失败，请稍后重试' },
      { status: 500 }
    )
  }
}
