import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

/**
 * GET /api/admin/default-config
 * 获取环境变量中的默认AI配置
 *
 * 需要认证：是（管理员）
 */
export async function GET(request: Request) {
  try {
    // 验证管理员权限
    await requireAdmin(request)

    // 返回默认配置
    return NextResponse.json(
      {
        success: true,
        config: {
          // Coze 默认配置
          coze: {
            botId: process.env.COZE_BOT_ID || '',
            apiToken: process.env.COZE_API_TOKEN || '',
          },
          // OpenAI 默认配置
          openai: {
            endpoint: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1/chat/completions',
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.OPENAI_MODEL || 'gpt-4-vision-preview',
          },
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('获取默认配置错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
