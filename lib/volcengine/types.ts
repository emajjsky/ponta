/**
 * 火山引擎语音服务类型定义
 *
 * 包含ASR（语音识别）和TTS（语音合成）的所有接口
 */

// ============================================================================
// ASR (语音识别) 类型
// ============================================================================

/**
 * ASR请求配置
 */
export interface ASRRequest {
  /** 音频格式 */
  audioFormat: 'pcm' | 'wav' | 'opus'
  /** 采样率 (Hz) */
  sampleRate: 16000 | 8000
  /** 语言类型 */
  language: 'zh-CN' | 'en-US'
  /** 音频数据 (Buffer或ArrayBuffer) */
  audioData: Buffer | ArrayBuffer
  /** 音频编码 */
  codec?: 'pcm' | 'opus'
}

/**
 * ASR API请求体
 */
export interface ASRApiRequest {
  /** 应用ID */
  appid: string
  /** 令牌 (签名后的Authorization) */
  token: string
  /** 音频格式 */
  format: string
  /** 采样率 */
  rate: number
  /** 音频编码 */
  codec?: string
  /** 语言 */
  language?: string
  /** 音频数据 (Base64编码) */
  audio: string
  /** 识别结果包含标点符号 */
  enable_punctuation?: boolean
  /** 识别结果包含偏移 (字级时间戳) */
  enable_itn?: boolean
}

/**
 * ASR API响应
 */
export interface ASRApiResponse {
  /** 请求ID */
  reqid: string
  /** 识别结果 (JSON字符串) */
  result: string
  /** 错误码 */
  code?: number
  /** 错误信息 */
  message?: string
}

/**
 * ASR识别结果（解析后的result字段）
 */
export interface ASRResult {
  /** 识别到的文字 */
  text: string
  /** 置信度 (0-1) */
  confidence?: number
  /** 是否为最终结果 */
  isFinal?: boolean
  /** 识别的详细片段 (流式) */
  utterances?: ASRUtterance[]
}

/**
 * ASR识别片段 (流式识别)
 */
export interface ASRUtterance {
  /** 文字内容 */
  text: string
  /** 开始时间 (ms) */
  startTime?: number
  /** 结束时间 (ms) */
  endTime?: number
  /** 置信度 */
  confidence?: number
  /** 是否为最终结果 */
  isFinal: boolean
}

// ============================================================================
// TTS (语音合成) 类型
// ============================================================================

/**
 * TTS请求配置
 */
export interface TTSRequest {
  /** 要合成的文字 */
  text: string
  /** 音色类型 (火山引擎音色ID) */
  voiceType?: string
  /** 语速 (0.5-2.0) */
  speed?: number
  /** 音量 (0-100) */
  volume?: number
  /** 输出格式 */
  format?: 'mp3' | 'wav' | 'opus'
  /** 采样率 (Hz) */
  sampleRate?: 16000 | 24000 | 48000
  /** 是否启用SSML */
  enableSSML?: boolean
}

/**
 * TTS API请求体
 */
export interface TTSApiRequest {
  /** 应用ID */
  app: {
    appid: string
    token: string
    cluster: string
  }
  /** 用户信息 */
  user: {
    uid: string
  }
  /** 音频配置 */
  audio: {
    /** 音频格式 */
    codec: string
    /** 采样率 */
    sample_rate: number
    /** 音频编码 */
    format?: string
    /** 音频通道数 */
    channel: number
  }
  /** 请求配置 */
  request: {
    /** 生成ID */
    reqid: string
    /** 文本内容 */
    text: string
    /** 文本类型 (plain/ssml) */
    text_type: string
    /** 音色ID */
    voice_type: string
    /** 编码格式 */
    encoding: string
    /** 语速 (0.5-2.0) */
    speed_ratio?: number
    /** 音量 (0-100) */
    volume_ratio?: number
  }
}

/**
 * TTS API响应
 */
export interface TTSApiResponse {
  /** 响应元数据 */
  resp: {
    /** 请求ID */
    reqid: string
    /** 状态码 */
    code: number
    /** 错误信息 */
    message?: string
  }
  /** 音频数据 (Base64编码) */
  audio?: string
}

/**
 * TTS结果（处理后）
 */
export interface TTSResult {
  /** 音频数据Buffer */
  audioData: Buffer
  /** 音频格式 */
  format: string
  /** 音频时长 (秒) */
  duration: number
  /** 采样率 */
  sampleRate: number
}

// ============================================================================
// 通用类型
// ============================================================================

/**
 * 火山引擎API错误
 */
export interface VolcEngineError {
  /** 错误码 */
  code: number
  /** 错误信息 */
  message: string
  /** 请求ID */
  requestId?: string
}

/**
 * API响应状态
 */
export enum APIStatus {
  SUCCESS = 0,
  ERROR = -1,
  AUTH_FAILED = 1001,
  INVALID_PARAM = 1002,
  QUOTA_EXCEEDED = 1003,
  SERVICE_UNAVAILABLE = 1004
}

/**
 * 火山引擎预置音色列表 (常用)
 */
export enum VoiceType {
  /** 女声-快思（默认） */
  FEMALE_KUAI = 'zh_female_shuangkuaisisi_moon_bigtts',
  /** 女声-温暖 */
  FEMALE_WARM = 'zh_female_wennuannuan_moon_bigtts',
  /** 男声-磁性 */
  MALE_MAGNETIC = 'zh_male_qingxing_moon_bigtts',
  /** 童声-活泼 */
  CHILD_LIVELY = 'zh_child_qingxin_moon_bigtts',
  /** 综艺音色-开心 */
  VARIETY_HAPPY = 'zh_male_xiaowen_moon_bigtts'
}

/**
 * 火山引擎支持的语言
 */
export enum Language {
  CHINESE = 'zh-CN',
  ENGLISH = 'en-US',
  JAPANESE = 'ja-JP',
  KOREAN = 'ko-KR',
  CANTONESE = 'zh-HK'
}

/**
 * 音频格式
 */
export enum AudioFormat {
  PCM = 'pcm',
  WAV = 'wav',
  MP3 = 'mp3',
  OPUS = 'opus'
}

/**
 * 采样率
 */
export enum SampleRate {
  RATE_8K = 8000,
  RATE_16K = 16000,
  RATE_24K = 24000,
  RATE_48K = 48000
}
