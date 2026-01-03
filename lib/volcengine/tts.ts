/**
 * 火山引擎语音合成服务 (TTS - Text To Speech)
 *
 * 文档: https://www.volcengine.com/docs/6561/1257584
 *
 * 功能:
 *    - 将文字转换为语音音频
 *    - 支持多种音色（男声、女声、童声等）
 *    - 支持语速和音量调节
 *    - 返回MP3格式音频
 */

import axios, { AxiosInstance } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { loadVolcEngineConfig } from './auth'
import type {
  TTSRequest,
  TTSApiRequest,
  TTSApiResponse,
  TTSResult
} from './types'
import { VoiceType, AudioFormat } from './types'

/**
 * Coze音色ID到火山引擎音色的映射表
 * 从 components/admin/VoiceTypeSelector.tsx 中的 COZE_VOICES 复制
 */
const COZE_TO_VOLCENGINE_MAP: Record<string, string> = {
  '7426720361732915209': 'zh_female_wanqudashu_moon_bigtts',        // 湾区大叔
  '7426720361732931593': 'zh_female_daimengchuanmei_moon_bigtts',    // 呆萌川妹
  '7426720361732947977': 'zh_male_guozhoudege_moon_bigtts',         // 广州德哥
  '7426720361732964361': 'zh_male_beijingxiaoye_moon_bigtts',       // 北京小爷
  '7426720361732997129': 'zh_male_shaonianzixin_moon_bigtts',       // 少年梓辛
  '7426720361733013513': 'zh_female_meilinvyou_moon_bigtts',        // 魅力女友
  '7426720361733029897': 'zh_male_shenyeboke_moon_bigtts',          // 深夜播客
  '7426720361733046281': 'zh_female_sajiaonvyou_moon_bigtts',       // 柔美女友
  '7426720361733062665': 'zh_female_yuanqinvyou_moon_bigtts',       // 撒娇学妹
  '7426720361733079049': 'zh_male_haoyuxiaoge_moon_bigtts',         // 浩宇小哥
  '7426720361733095433': 'zh_male_guangxiyuanzhou_moon_bigtts',     // 广西远舟
  '7426720361733111817': 'zh_female_meituojieer_moon_bigtts',       // 妹坨洁儿
  '7426720361733128201': 'zh_male_yuzhouzixuan_moon_bigtts',        // 豫州子轩
  '7426720361733144585': 'zh_female_linjianvhai_moon_bigtts',       // 邻家女孩
  '7426720361733160969': 'zh_female_gaolengyujie_moon_bigtts',      // 高冷御姐
  '7426720361733177353': 'zh_male_yuanboxiaoshu_moon_bigtts',       // 渊博小叔
  '7426720361733193737': 'zh_male_yangguangqingnian_moon_bigtts',   // 阳光青年
  '7426720361733210121': 'zh_male_aojiaobazong_moon_bigtts',        // 傲娇霸总
  '7426720361753870373': 'zh_male_jingqiangkanye_moon_bigtts',      // 京腔侃爷
  '7426720361753903141': 'zh_female_shuangkuaisisi_moon_bigtts',    // 爽快思思
  '7426720361753935909': 'zh_male_wennuanahu_moon_bigtts',          // 温暖阿虎
  '7426720361753968677': 'zh_female_wanwanxiaohe_moon_bigtts',      // 湾湾小何
  '7426725529589579803': 'zh_female_wenrouxiaoya_moon_bigtts',      // 温柔小雅
  '7426725529589596187': 'zh_female_tianmeixiaoyuan_moon_bigtts',   // 甜美小源
  '7426725529589612571': 'zh_female_qingchezizi_moon_bigtts',       // 清澈梓梓
  '7426725529589628955': 'zh_male_dongfanghaoran_moon_bigtts',      // 东方浩然
  '7426725529589645339': 'zh_male_jieshuoxiaoming_moon_bigtts',     // 解说小明
  '7426725529589661723': 'zh_female_kailangjiejie_moon_bigtts',     // 开朗姐姐
  '7426725529589678107': 'zh_male_linjiananhai_moon_bigtts',        // 邻家男孩
  '7426725529589694491': 'zh_female_tianmeiyueyue_moon_bigtts',     // 甜美悦悦
  '7426725529681657907': 'zh_female_xinlingjitang_moon_bigtts',     // 心灵鸡汤
  '7468512265134768179': 'zh_female_cancan_mars_bigtts',            // 灿灿
}

/**
 * 将Coze音色ID转换为火山引擎音色ID
 * @param voiceId - Coze音色ID（数字）或火山引擎音色ID（字符串）
 * @returns 火山引擎音色ID
 */
function convertToVolcEngineVoiceType(voiceId: string): string {
  // 如果是纯数字ID，尝试从映射表中查找
  if (/^\d+$/.test(voiceId)) {
    const volcEngineVoiceType = COZE_TO_VOLCENGINE_MAP[voiceId]
    if (volcEngineVoiceType) {
      console.log(`🔄 音色ID转换: Coze ID ${voiceId} -> 火山引擎 ${volcEngineVoiceType}`)
      return volcEngineVoiceType
    } else {
      console.warn(`⚠️ 未找到Coze音色ID ${voiceId} 的映射，使用默认音色`)
      return VoiceType.FEMALE_KUAI
    }
  }

  // 如果已经是火山引擎格式，直接返回
  return voiceId
}

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
    } catch (error: any) {
      console.error('火山引擎TTS合成失败:', error)

      // 打印详细的API错误响应
      if (error.response?.data) {
        console.error('火山引擎API错误响应数据:', error.response.data)
      }

      throw new Error(`语音合成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 构建API请求体
   */
  private buildApiRequest(text: string, options?: Partial<TTSRequest>): TTSApiRequest {
    const reqid = uuidv4()

    // 调试：打印传入的 voiceType
    const rawVoiceType = options?.voiceType || this.defaultVoiceType
    console.log('🔍 传入的 voiceType:', rawVoiceType, '类型:', typeof rawVoiceType, '是否为数字ID:', /^\d+$/.test(rawVoiceType))

    // 转换为火山引擎音色ID（如果是Coze数字ID）
    const voiceType = convertToVolcEngineVoiceType(rawVoiceType)

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
        operation: "submit",
        reqid: reqid,
        text: text,
        text_type: 'plain',
        voice_type: voiceType,
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

    // 火山引擎TTS API认证方式：使用Bearer Token格式
    // 实际测试发现：Bearer和token之间用**空格**分隔（不是分号！）
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.accessKeyId}`
    }

    try {
      const response = await this.axiosInstance.post<ArrayBuffer>(url, apiRequest, { headers })
      return response.data
    } catch (error: any) {
      // 打印详细的错误信息和响应数据
      if (error.response) {
        // 将Buffer转换为字符串以便查看具体错误信息
        let errorData = error.response.data
        if (Buffer.isBuffer(errorData)) {
          errorData = errorData.toString('utf-8')
          try {
            errorData = JSON.parse(errorData)
          } catch (e) {
            // 如果不是JSON，保持字符串格式
          }
        }

        console.error('火山引擎API响应错误:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: errorData,
          headers: error.response.headers
        })
      }
      throw error
    }
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
