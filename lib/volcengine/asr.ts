/**
 * 火山引擎语音识别服务 (ASR - Automatic Speech Recognition)
 *
 * 文档: https://www.volcengine.com/docs/6561/1354869
 *
 * 功能:
 * - 将语音转换为文字（实时识别）
 * - 支持多种音频格式（PCM、WAV、OPUS）
 * - 支持中英文识别
 */

import axios, { AxiosInstance } from 'axios'
import { loadVolcEngineConfig, signRequest } from './auth'
import type {
  ASRRequest,
  ASRApiRequest,
  ASRApiResponse,
  ASRResult,
  VoiceType,
  Language,
  AudioFormat
} from './types'

/**
 * 火山引擎ASR配置
 */
export interface ASRConfig {
  /** 应用ID (可选，默认从环境变量读取) */
  appId?: string
  /** 访问密钥ID (可选，默认从环境变量读取) */
  accessKeyId?: string
  /** 密钥 (可选，默认从环境变量读取) */
  secretAccessKey?: string
  /** API端点 (可选) */
  endpoint?: string
  /** 默认语言 */
  defaultLanguage?: Language
  /** 默认音频格式 */
  defaultFormat?: AudioFormat
  /** 默认采样率 */
  defaultSampleRate?: 16000 | 8000
}

/**
 * ASR服务类
 */
export class VolcEngineASR {
  private config: Required<Pick<ASRConfig, 'appId' | 'accessKeyId' | 'secretAccessKey'>>
  private endpoint: string
  private defaultLanguage: Language
  private defaultFormat: AudioFormat
  private defaultSampleRate: number
  private axiosInstance: AxiosInstance

  constructor(config: ASRConfig = {}) {
    // 加载配置（优先使用传入参数，否则从环境变量读取）
    const envConfig = loadVolcEngineConfig()

    this.config = {
      appId: config.appId || envConfig.appId,
      accessKeyId: config.accessKeyId || envConfig.accessKeyId,
      secretAccessKey: config.secretAccessKey || envConfig.secretAccessKey
    }

    // 验证配置
    if (!this.config.appId || !this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error('火山引擎配置不完整，请检查环境变量 VOLCENGINE_APP_ID, VOLCENGINE_ACCESS_KEY_ID, VOLCENGINE_SECRET_ACCESS_KEY')
    }

    // 初始化其他配置
    this.endpoint = config.endpoint || 'https://openspeech.bytedance.com'
    this.defaultLanguage = config.defaultLanguage || Language.CHINESE
    this.defaultFormat = config.defaultFormat || AudioFormat.PCM
    this.defaultSampleRate = config.defaultSampleRate || 16000

    // 创建axios实例
    this.axiosInstance = axios.create({
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * 语音识别（主入口）
   *
   * @param request ASR请求配置
   * @returns 识别结果文字
   */
  async recognize(request: ASRRequest): Promise<string> {
    try {
      // 1. 准备请求数据
      const audioBase64 = this.audioToBase64(request.audioData)
      const apiRequest = this.buildApiRequest(request, audioBase64)

      // 2. 发送HTTP请求
      const response = await this.sendToVolcEngine(apiRequest)

      // 3. 解析响应
      const result = this.parseResponse(response)

      return result.text
    } catch (error) {
      console.error('火山引擎ASR识别失败:', error)
      throw new Error(`语音识别失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 构建API请求体
   */
  private buildApiRequest(request: ASRRequest, audioBase64: string): ASRApiRequest {
    return {
      appid: this.config.appId,
      token: this.config.accessKeyId, // 简化版，实际应该签名
      format: request.audioFormat,
      rate: request.sampleRate,
      codec: request.codec || 'pcm',
      language: request.language,
      audio: audioBase64,
      enable_punctuation: true, // 启用标点符号
      enable_itn: false // 禁用ITN（逆文本标准化）
    }
  }

  /**
   * 发送请求到火山引擎
   */
  private async sendToVolcEngine(apiRequest: ASRApiRequest): ASRApiResponse {
    const url = `${this.endpoint}/api/v2/asr`

    // 生成签名
    const signature = signRequest(
      this.config,
      'POST',
      '/api/v2/asr'
    )

    const headers = {
      'Authorization': `HMAC-SHA1 ${signature}`,
      'Content-Type': 'application/json',
      'X-Date': new Date().toISOString()
    }

    const response = await this.axiosInstance.post<ASRApiResponse>(url, apiRequest, { headers })

    // 检查响应
    if (response.data.code !== undefined && response.data.code !== 0) {
      throw new Error(`API返回错误: ${response.data.message} (code: ${response.data.code})`)
    }

    return response.data
  }

  /**
   * 解析API响应
   */
  private parseResponse(apiResponse: ASRApiResponse): ASRResult {
    // 火山引擎返回的result字段是JSON字符串
    let resultObj: any

    try {
      resultObj = JSON.parse(apiResponse.result)
    } catch (error) {
      // 如果result不是JSON，直接使用
      resultObj = { text: apiResponse.result }
    }

    // 提取文字（火山引擎可能返回不同格式）
    let text = ''

    if (typeof resultObj === 'string') {
      text = resultObj
    } else if (resultObj.text) {
      text = resultObj.text
    } else if (resultObj.result) {
      text = resultObj.result
    } else if (Array.isArray(resultObj)) {
      // 流式识别可能返回数组
      text = resultObj.map((item: any) => item.text || item).join('')
    }

    return {
      text: text.trim(),
      confidence: resultObj.confidence || 1.0,
      isFinal: true
    }
  }

  /**
   * 将音频数据转换为Base64
   */
  private audioToBase64(audioData: Buffer | ArrayBuffer): string {
    let buffer: Buffer

    if (audioData instanceof ArrayBuffer) {
      buffer = Buffer.from(audioData)
    } else {
      buffer = audioData
    }

    return buffer.toString('base64')
  }

  /**
   * 转换音频格式（如果需要）
   *
   * @param inputAudio 输入音频数据
   * @param targetFormat 目标格式
   * @returns 转换后的音频数据
   */
  private async convertAudioFormat(
    inputAudio: Buffer,
    targetFormat: 'pcm' | 'wav' | 'opus'
  ): Promise<Buffer> {
    // TODO: 实现音频格式转换
    // 目前假设音频已经是正确格式
    // 如果需要转换，可以使用ffmpeg.wasm等库
    return inputAudio
  }

  /**
   * 流式识别（高级功能，暂不实现）
   *
   * @param audioStream 音频流
   * @returns 异步生成器，产生识别结果
   */
  async *streamRecognize(
    audioStream: AsyncIterable<Buffer>
  ): AsyncGenerator<ASRResult, void, unknown> {
    // TODO: 实现流式识别
    // 需要使用WebSocket或HTTP流式传输
    throw new Error('流式识别功能尚未实现')
  }
}

/**
 * 便捷函数：使用默认配置识别语音
 *
 * @param audioData 音频数据
 * @param options 可选配置
 * @returns 识别结果文字
 */
export async function recognizeSpeech(
  audioData: Buffer | ArrayBuffer,
  options?: Partial<ASRRequest>
): Promise<string> {
  const asr = new VolcEngineASR()

  return asr.recognize({
    audioData,
    audioFormat: options?.audioFormat || AudioFormat.PCM,
    sampleRate: options?.sampleRate || 16000,
    language: options?.language || Language.CHINESE,
    codec: options?.codec || 'pcm'
  })
}
