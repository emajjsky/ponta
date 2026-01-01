import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * GET /api/uploads/[...path]
 * 提供uploads目录的静态文件服务
 *
 * 用于解决Nginx配置问题，确保上传的图片能正常访问
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 获取文件路径
    const path = params.path.join('/')
    const filepath = join(process.cwd(), 'public', 'uploads', path)

    // 检查文件是否存在
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      )
    }

    // 读取文件
    const file = await readFile(filepath)

    // 根据文件扩展名设置Content-Type
    const ext = path.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    }

    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

    // 返回文件
    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('读取文件错误:', error)
    return NextResponse.json(
      { error: '读取文件失败' },
      { status: 500 }
    )
  }
}
