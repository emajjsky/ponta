/**
 * 火山引擎WebSocket单向流式TTS实现
 *
 * 文档: https://www.volcengine.com/docs/6561/1598757
 *
 * 特点：
 * - 使用WebSocket协议
 * - 单向流式（服务端主动推送音频）
 * - 二进制协议传输
 * - 低延迟，适合实时场景
 */

import WebSocket from 'ws'
import { v4 as uuidv4 } from 'uuid'
import { loadVolcEngineConfig } from './auth'
import type { TTSRequest } from './types'
import {
  MsgType,
  EventType,
  ReceiveMessage,
  FullClientRequest,
} from './protocols'

/**
 * 音色ID到ResourceID的映射
 */
function VoiceToResourceId(voice: string): string {
  if (voice.startsWith('S_')) {
    return 'volc.megatts.default'  // ICL音色
  }
  return 'volc.service_type.10029'  // 大模型音色
}

/**
 * WebSocket单向流式TTS类
 */
export class VolcEngineWebSocketTTS {
  private config: ReturnType<typeof loadVolcEngineConfig>
  private endpoint: string
  private timeout: number

  constructor(timeout: number = 60000) {
    this.config = loadVolcEngineConfig()
    this.endpoint = 'wss://openspeech.bytedance.com/api/v3/tts/unidirectional/stream'
    this.timeout = timeout

    // 验证配置
    if (!this.config.appId || !this.config.accessKeyId) {
      throw new Error('火山引擎配置不完整，请检查环境变量')
    }
  }

  /**
   * 语音合成（主入口）
   *
   * @param text 要合成的文字
   * @param options 可选配置
   * @returns 音频数据Buffer
   */
  async synthesize(text: string, options?: Partial<TTSRequest>): Promise<Buffer> {
    // 1. 参数验证
    if (!text || text.trim().length === 0) {
      throw new Error('合成文字不能为空')
    }

    if (text.length > 5000) {
      throw new Error('文字长度不能超过5000字符')
    }

    const voiceType = options?.voiceType || 'zh_female_shuangkuaisisi_moon_bigtts'
    const format = options?.format || 'mp3'
    const speed = options?.speed || 1.0
    const volume = options?.volume || 80

    // 2. 建立WebSocket连接
    const ws = await this.connect(voiceType)

    try {
      // 3. 发送合成请求
      await this.sendRequest(ws, text, voiceType, format, speed, volume)

      // 4. 接收流式音频
      const audioBuffer = await this.receiveAudio(ws)

      return audioBuffer
    } finally {
      // 5. 关闭连接
      ws.close()
    }
  }

  /**
   * 建立WebSocket连接
   */
  private async connect(voiceType: string): Promise<WebSocket> {
    const headers = {
      'X-Api-App-Key': this.config.appId,
      'X-Api-Access-Key': this.config.accessKeyId,
      'X-Api-Resource-Id': VoiceToResourceId(voiceType),
      'X-Api-Connect-Id': uuidv4(),
    }

    console.log('🔌 建立WebSocket连接...')
    console.log('Headers:', JSON.stringify(headers, null, 2))

    const ws = new WebSocket(this.endpoint, {
      headers,
      skipUTF8Validation: true,
    })

    // 等待连接打开
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('WebSocket连接超时'))
      }, 10000)

      ws.on('open', () => {
        clearTimeout(timeoutId)
        console.log('✅ WebSocket连接已建立')
        resolve()
      })

      ws.on('error', (error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
    })

    return ws
  }

  /**
   * 发送合成请求
   */
  private async sendRequest(
    ws: WebSocket,
    text: string,
    voiceType: string,
    format: string,
    speed: number,
    volume: number
  ): Promise<void> {
    const request = {
      user: {
        uid: uuidv4(),
      },
      req_params: {
        speaker: voiceType,
        text: text,
        audio_params: {
          format: format,
          sample_rate: 24000,
          enable_timestamp: true,
          speed: speed,
          volume: volume,
        },
        additions: JSON.stringify({
          disable_markdown_filter: false,
        }),
      },
    }

    console.log('📤 发送TTS请求:', JSON.stringify(request, null, 2))

    await FullClientRequest(
      ws,
      new TextEncoder().encode(JSON.stringify(request))
    )
  }

  /**
   * 接收流式音频
   */
  private async receiveAudio(ws: WebSocket): Promise<Buffer> {
    const totalAudio: Uint8Array[] = []
    const startTime = Date.now()

    console.log('📥 开始接收音频数据...')

    while (true) {
      // 超时检查
      if (Date.now() - startTime > this.timeout) {
        throw new Error('TTS合成超时')
      }

      const msg = await ReceiveMessage(ws)
      console.log(`${msg.toString()}`)

      switch (msg.type) {
        case MsgType.FullServerResponse:
          // 服务器响应消息（可能包含状态信息）
          if (msg.event === EventType.SessionFinished) {
            console.log('✅ 会话结束，音频接收完成')
            break  // 跳出while循环
          }
          break

        case MsgType.AudioOnlyServer:
          // 音频数据块
          totalAudio.push(msg.payload)
          console.log(`🎵 收到音频块: ${msg.payload.length} bytes`)
          break

        default:
          throw new Error(`未知消息类型: ${msg.toString()}`)
      }

      // 检查是否结束
      if (
        msg.type === MsgType.FullServerResponse &&
        msg.event === EventType.SessionFinished
      ) {
        break
      }
    }
    if (totalAudio.length === 0) {
      throw new Error('未收到任何音频数据')
    }

    // 拼接所有音频块
    const totalLength = totalAudio.reduce((sum, chunk) => sum + chunk.length, 0)
    const result = Buffer.alloc(totalLength)
    let offset = 0

    for (const chunk of totalAudio) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    console.log(`✅ 音频接收完成，总大小: ${result.length} bytes`)
    return result
  }
}

/**
 * 便捷函数：使用WebSocket合成语音
 */
export async function synthesizeSpeech(
  text: string,
  options?: Partial<TTSRequest>
): Promise<Buffer> {
  const tts = new VolcEngineWebSocketTTS()
  return tts.synthesize(text, options)
}
