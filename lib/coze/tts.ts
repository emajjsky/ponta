/**
 * Coze语音合成服务 (TTS - Text To Speech)
 *
 * 文档: https://www.coze.cn/open/docs/developer_guides/text_to_speech
 *
 * 功能:
 *    - 将文字转换为语音音频
 *    - 支持多种Coze音色（voice_id格式）
 *    - 支持语速、音量、情感等调节
 *    - 返回MP3/WAV/PCM/OGG格式音频
 */

import axios, { AxiosInstance } from 'axios'

/**
 * Coze TTS请求参数
 */
export interface CozeTTSRequest {
  /** 要合成的文字 */
  input: string
  /** 音色ID（数字字符串，如"742894********"） */
  voiceId: string
  /** 音频格式 */
  format?: 'mp3' | 'wav' | 'pcm' | 'ogg_opus'
  /** 语速（大模型0.5-2，小模型0.2-3） */
  speed?: number
  /** 采样率（默认24000） */
  sampleRate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000
  /** 音量增益（-50~100，默认0） */
  loudnessRate?: number
  /** 情感类型（happy/sad/angry等） */
  emotion?: 'happy' | 'sad' | 'angry' | 'surprised' | 'fear' | 'hate' | 'excited' | 'coldness' | 'neutral'
  /** 情感强度（1.0-5.0） */
  emotionScale?: number
  /** 语音指令（控制语气、方言等） */
  contextTexts?: string
}

/**
 * TTS服务配置
 */
export interface CozeTTSConfig {
  /** API访问令牌 */
  apiToken: string
  /** API端点 (可选) */
  endpoint?: string
}

/**
 * Coze TTS服务类
 */
export class CozeTTS {
  private apiToken: string
  private endpoint: string
  private axiosInstance: AxiosInstance

  constructor(config: CozeTTSConfig) {
    this.apiToken = config.apiToken
    this.endpoint = config.endpoint || 'https://api.coze.cn'

    // 创建axios实例
    this.axiosInstance = axios.create({
      timeout: 60000, // 60秒超时
      responseType: 'arraybuffer'
    })
  }

  /**
   * 语音合成（主入口）
   *
   * @param text 要合成的文字
   * @param options 可选配置
   * @returns 音频数据Buffer
   */
  async synthesize(text: string, options: Partial<CozeTTSRequest> = {}): Promise<Buffer> {
    try {
      // 1. 参数验证
      if (!text || text.trim().length === 0) {
        throw new Error('合成文字不能为空')
      }

      if (text.length > 1024) {
        throw new Error('文字长度不能超过1024字节（UTF-8编码）')
      }

      // 2. 构建API请求
      const requestBody = this.buildRequestBody(text, options)

      // 3. 发送HTTP请求
      const response = await this.sendToCoze(requestBody)

      return response

    } catch (error: any) {
      console.error('Coze TTS合成失败:', error)

      // 打印详细的API错误响应
      if (error.response?.data) {
        console.error('Coze API错误响应数据:', error.response.data)
      }

      throw new Error(`语音合成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 构建API请求体
   */
  private buildRequestBody(text: string, options: Partial<CozeTTSRequest>): Record<string, any> {
    const requestBody: Record<string, any> = {
      input: text,
      voice_id: options.voiceId,
      response_format: options.format || 'mp3'
    }

    // 可选参数
    if (options.speed !== undefined) {
      requestBody.speed = options.speed
    }

    if (options.sampleRate !== undefined) {
      requestBody.sample_rate = options.sampleRate
    }

    if (options.loudnessRate !== undefined) {
      requestBody.loudness_rate = options.loudnessRate
    }

    if (options.emotion !== undefined) {
      requestBody.emotion = options.emotion
    }

    if (options.emotionScale !== undefined) {
      requestBody.emotion_scale = options.emotionScale
    }

    if (options.contextTexts !== undefined) {
      requestBody.context_texts = options.contextTexts
    }

    return requestBody
  }

  /**
   * 发送请求到Coze
   */
  private async sendToCoze(requestBody: Record<string, any>): Promise<Buffer> {
    const url = `${this.endpoint}/v1/audio/speech`

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`
    }

    try {
      const response = await this.axiosInstance.post<ArrayBuffer>(url, requestBody, { headers })
      return Buffer.from(response.data)
    } catch (error: any) {
      // 打印详细的错误信息和响应数据
      if (error.response) {
        let errorData = error.response.data
        if (Buffer.isBuffer(errorData)) {
          errorData = errorData.toString('utf-8')
          try {
            errorData = JSON.parse(errorData)
          } catch (e) {
            // 如果不是JSON，保持字符串格式
          }
        }

        console.error('Coze API响应错误:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: errorData,
          headers: error.response.headers
        })
      }
      throw error
    }
  }
}

/**
 * 便捷函数：使用默认配置合成语音
 *
 * @param text 要合成的文字
 * @param options 可选配置
 * @returns 音频数据Buffer
 */
export async function synthesizeSpeech(
  text: string,
  options: Partial<CozeTTSRequest>
): Promise<Buffer> {
  const apiToken = process.env.COZE_API_TOKEN

  if (!apiToken) {
    throw new Error('COZE_API_TOKEN环境变量未设置')
  }

  const tts = new CozeTTS({ apiToken })
  return tts.synthesize(text, options)
}
