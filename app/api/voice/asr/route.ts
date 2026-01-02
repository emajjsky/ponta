import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { VolcEngineASR } from '@/lib/volcengine/asr'
import { AudioFormat, Language } from '@/lib/volcengine/types'

/**
 * POST /api/voice/asr
 * 语音识别API - 将音频转换为文字
 *
 * 需要认证：是
 * Request:
 *   Content-Type: multipart/form-data
 *   audio: File - 音频文件
 *   format?: string - 音频格式 (pcm/wav/opus，默认pcm)
 *   sampleRate?: number - 采样率 (16000/8000，默认16000)
 *   language?: string - 语言 (zh-CN/en-US，默认zh-CN)
 *
 * Response:
 *   {
 *     success: true,
 *     text: "识别到的文字",
 *     confidence: 0.95
 *   }
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

    // 2. 解析FormData
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: '音频文件不能为空' },
        { status: 400 }
      )
    }

    // 3. 获取参数
    const format = (formData.get('format') as string) || 'pcm'
    const sampleRate = parseInt(formData.get('sampleRate') as string) || 16000
    const language = (formData.get('language') as string) || 'zh-CN'

    // 4. 验证参数
    if (!['pcm', 'wav', 'opus'].includes(format)) {
      return NextResponse.json(
        { error: '不支持的音频格式，仅支持pcm/wav/opus' },
        { status: 400 }
      )
    }

    if (sampleRate !== 16000 && sampleRate !== 8000) {
      return NextResponse.json(
        { error: '采样率必须是16000或8000' },
        { status: 400 }
      )
    }

    if (audioFile.size > 10 * 1024 * 1024) { // 10MB限制
      return NextResponse.json(
        { error: '音频文件大小不能超过10MB' },
        { status: 400 }
      )
    }

    // 5. 读取音频数据
    const audioBuffer = await audioFile.arrayBuffer()

    // 6. 调用火山引擎ASR
    const asr = new VolcEngineASR()

    const text = await asr.recognize({
      audioData: audioBuffer,
      audioFormat: format as any,
      sampleRate: sampleRate as any,
      language: language as any,
      codec: format as any
    })

    // 7. 返回识别结果
    return NextResponse.json({
      success: true,
      text: text,
      confidence: 0.95 // 火山引擎暂不返回置信度，给个默认值
    })

  } catch (error) {
    console.error('语音识别API错误:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '语音识别失败，请稍后重试'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/voice/asr
 * 健康检查
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'VolcEngine ASR',
    message: '语音识别服务运行中'
  })
}
