import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { VolcEngineTTS, synthesizeSpeech } from '@/lib/volcengine/tts'

/**
 * POST /api/voice/tts
 * 语音合成API - 将文字转换为音频
 *
 * 需要认证：是
 * Request Body (JSON):
 *   {
 *     text: string - 要合成的文字
 *     voiceType?: string - 音色ID (可选)
 *     speed?: number - 语速0.5-2.0 (可选)
 *     volume?: number - 音量0-100 (可选)
 *     format?: string - 输出格式mp3/wav/opus (可选)
 *   }
 *
 * Response:
 *   Content-Type: audio/mpeg
 *   Body: <音频二进制数据>
 */
export async function POST(request: NextRequest) {
  try {
    // 1. JWT认证
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '未登录，请先登录' },
        { status: 401 }
      )
    }

    try {
      await verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      )
    }

    // 2. 解析请求体
    const body = await request.json()
    const { text, voiceType, speed, volume, format } = body

    // 3. 参数验证
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: '文字内容不能为空' },
        { status: 400 }
      )
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: '文字长度不能超过5000字符' },
        { status: 400 }
      )
    }

    // 4. 验证可选参数
    if (speed !== undefined && (speed < 0.5 || speed > 2.0)) {
      return NextResponse.json(
        { error: '语速必须在0.5-2.0之间' },
        { status: 400 }
      )
    }

    if (volume !== undefined && (volume < 0 || volume > 100)) {
      return NextResponse.json(
        { error: '音量必须在0-100之间' },
        { status: 400 }
      )
    }

    // 5. 调用火山引擎TTS
    const audioBuffer = await synthesizeSpeech(text, {
      voiceType,
      speed,
      volume,
      format
    })

    // 6. 返回音频流
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
        'Content-Disposition': `inline; filename="tts_${Date.now()}.mp3"`
      }
    })

  } catch (error) {
    console.error('语音合成API错误:', error)

    // 返回JSON错误
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '语音合成失败，请稍后重试'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/voice/tts
 * 健康检查
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'VolcEngine TTS',
    message: '语音合成服务运行中'
  })
}
