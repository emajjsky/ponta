/**
 * 火山引擎语音合成服务 (TTS - Text To Speech)
 * 统一入口：使用WebSocket单向流式实现
 *
 * 文档: https://www.volcengine.com/docs/6561/1598757
 *
 * 功能:
 *    - 将文字转换为语音音频
 *    - 支持多种音色（男声、女声、童声等）
 *    - 支持语速和音量调节
 *    - 返回MP3格式音频
 *    - 使用WebSocket单向流式协议（低延迟）
 */

import type { TTSRequest } from './types'
import { synthesizeSpeech as synthesizeSpeechWebSocket } from './tts-websocket'

// 导出WebSocket类供高级用户使用
export { VolcEngineWebSocketTTS } from './tts-websocket'

/**
 * 便捷函数：合成语音（使用WebSocket单向流式实现）
 *
 * @param text 要合成的文字
 * @param options 可选配置
 * @returns 音频数据Buffer
 */
export async function synthesizeSpeech(
  text: string,
  options?: Partial<TTSRequest>
): Promise<Buffer> {
  console.log('🎤 使用火山引擎WebSocket TTS API')

  // 直接使用WebSocket实现
  return synthesizeSpeechWebSocket(text, options)
}
