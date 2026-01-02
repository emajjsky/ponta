/**
 * 火山引擎语音合成服务 (TTS - Text To Speech)
 *
 * 文档: https://www.volcengine.com/docs/6561/1257584
 *
 * 功能:
 * - 将文字转换为语音音频
 * - 支持多种音色（男声、女声、童声等）
 * - 支持语速和音量调节
 * - 返回MP3格式音频
 */

import axios, { AxiosInstance } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { loadVolcEngineConfig } from './auth'
import type {
  TTSRequest,
  TTSApiRequest,
  TTSApiResponse,
  TTSResult,
  VoiceType,
  AudioFormat
} from './types'

/**
 * TTS服务配置
 */
export interface TTSConfig {
  /** 应用ID (可选，默认从环境变量读取) */
  appId?: string
  /** 访问密钥ID (可选，默认从环境变量读取) */
  accessKeyId?: string
  /** 密钥 (可选，默认从环境变量读取) */
  secretAccessKey?: string
  /** API端点 (可选) */
  endpoint?: string
  /** 默认音色 */
  defaultVoiceType?: VoiceType
  /** 默认输出格式 */
  defaultFormat?: AudioFormat
  /** 默认语速 (0.5-2.0) */
  defaultSpeed?: number
  /** 默认音量 (0-100) */
  defaultVolume?: number
}

/**
 * TTS服务类
 */
export class VolcEngineTTS {
  private config: Required<Pick<TTSConfig, 'appId' | 'accessKeyId' | 'secretAccessKey'>>
  private endpoint: string
  private defaultVoiceType: string
  private defaultFormat: AudioFormat
  private defaultSpeed: number
  private defaultVolume: number
  private axiosInstance: AxiosInstance

  constructor(config: TTSConfig = {}) {
    // 加载配置
    const envConfig = loadVolcEngineConfig()

    this.config = {
      appId: config.appId || envConfig.appId,
      accessKeyId: config.accessKeyId || envConfig.accessKeyId,
      secretAccessKey: config.secretAccessKey || envConfig.secretAccessKey
    }

    // 验证配置
    if (!this.config.appId || !this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error('火山引擎配置不完整，请检查环境变量')
    }

    // 初始化其他配置
    this.endpoint = config.endpoint || 'https://openspeech.bytedance.com'
    this.defaultVoiceType = config.defaultVoiceType || VoiceType.FEMALE_KUAI
    this.defaultFormat = config.defaultFormat || AudioFormat.MP3
    this.defaultSpeed = config.defaultSpeed || 1.0
    this.defaultVolume = config.defaultVolume || 80

    // 创建axios实例
    this.axiosInstance = axios.create({
      timeout: 60000, // 60秒超时（TTS生成可能较慢）
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
  async synthesize(text: string, options?: Partial<TTSRequest>): Promise<Buffer> {
    try {
      // 1. 参数验证
      if (!text || text.trim().length === 0) {
        throw new Error('合成文字不能为空')
      }

      if (text.length > 5000) {
        throw new Error('文字长度不能超过5000字符')
      }

      // 2. 构建API请求
      const apiRequest = this.buildApiRequest(text, options)

      // 3. 发送HTTP请求
      const response = await this.sendToVolcEngine(apiRequest)

      // 4. 解析响应
      const result = this.parseResponse(response)

      return result.audioData
    } catch (error) {
      console.error('火山引擎TTS合成失败:', error)
      throw new Error(`语音合成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 构建API请求体
   */
  private buildApiRequest(text: string, options?: Partial<TTSRequest>): TTSApiRequest {
    const reqid = uuidv4()

    return {
      app: {
        appid: this.config.appId,
        token: this.config.accessKeyId,
        cluster: 'volcano_tts'
      },
      user: {
        uid: 'user_' + Date.now()
      },
      audio: {
        codec: this.defaultFormat,
        sample_rate: 24000, // 火山引擎推荐24kHz
        format: this.defaultFormat,
        channel: 1
      },
      request: {
        reqid: reqid,
        text: text,
        text_type: 'plain',
        voice_type: options?.voiceType || this.defaultVoiceType,
        encoding: 'utf-8',
        speed_ratio: options?.speed || this.defaultSpeed,
        volume_ratio: options?.volume || this.defaultVolume
      }
    }
  }

  /**
   * 发送请求到火山引擎
   */
  private async sendToVolcEngine(apiRequest: TTSApiRequest): ArrayBuffer {
    const url = `${this.endpoint}/api/v1/tts`

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.accessKeyId}`
    }

    const response = await this.axiosInstance.post<ArrayBuffer>(url, apiRequest, { headers })

    return response.data
  }

  /**
   * 解析API响应
   */
  private parseResponse(arrayBuffer: ArrayBuffer): TTSResult {
    // 火山引擎TTS直接返回音频二进制数据
    const audioData = Buffer.from(arrayBuffer)

    // 估算音频时长（MP3 @ 24kHz @ 32kbps ≈ 4KB/s）
    const estimatedDuration = audioData.length / 4000

    return {
      audioData,
      format: this.defaultFormat,
      duration: estimatedDuration,
      sampleRate: 24000
    }
  }

  /**
   * 流式TTS（高级功能，暂不实现）
   *
   * @param text 要合成的文字
   * @returns 异步生成器，产生音频数据块
   */
  async *streamSynthesize(
    text: string
  ): AsyncGenerator<Buffer, void, unknown> {
    // TODO: 实现流式TTS
    // 需要使用WebSocket或HTTP流式传输
    throw new Error('流式TTS功能尚未实现')
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
  options?: Partial<TTSRequest>
): Promise<Buffer> {
  const tts = new VolcEngineTTS()

  return tts.synthesize(text, options)
}
