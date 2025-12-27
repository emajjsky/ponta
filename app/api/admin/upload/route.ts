import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { requireAdmin } from '@/lib/admin'

/**
 * POST /api/admin/upload
 * 上传图片文件
 *
 * 需要认证：是
 * 需要权限：ADMIN
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
    // 验证管理员权限
    await requireAdmin(request)

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

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 写入文件
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // 返回图片URL（始终返回相对路径）
    const url = `/uploads/${filename}`

    return NextResponse.json(
      {
        success: true,
        url,
      },
      { status: 200 }
    )
  } catch (error: any) {
    // 处理权限错误
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    console.error('图片上传错误:', error)
    return NextResponse.json(
      { error: '图片上传失败，请稍后重试' },
      { status: 500 }
    )
  }
}
