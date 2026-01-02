/**
 * useVoiceRecorder Hook
 *
 * 封装语音录音逻辑（基于MediaRecorder API）
 *
 * 功能:
 * - 请求麦克风权限
 * - 实时录音
 * - 音量检测
 * - 录音时长计时
 * - 导出音频数据
 */

import { useState, useCallback, useRef } from 'react'

export interface UseVoiceRecorderOptions {
  /** 最大录音时长（秒），默认60秒 */
  maxDuration?: number
  /** 时长更新回调 */
  onDurationUpdate?: (duration: number) => void
  /** 音量更新回调 */
  onAudioLevelUpdate?: (level: number) => void
}

export interface UseVoiceRecorderReturn {
  /** 是否正在录音 */
  isRecording: boolean
  /** 录音时长（秒） */
  duration: number
  /** 当前音量（0-100） */
  audioLevel: number
  /** 开始录音 */
  startRecording: () => Promise<void>
  /** 停止录音 */
  stopRecording: () => Promise<ArrayBuffer>
  /** 取消录音 */
  cancelRecording: () => void
  /** 错误信息 */
  error: Error | null
}

/**
 * 语音录音Hook
 */
export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const { maxDuration = 60, onDurationUpdate, onAudioLevelUpdate } = options

  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  /**
   * 检测音量（实时）
   */
  const detectAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const getLevel = () => {
      analyser.getByteFrequencyData(dataArray)

      // 计算平均音量
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const level = Math.min(100, Math.round((average / 128) * 100))

      setAudioLevel(level)
      onAudioLevelUpdate?.(level)

      animationFrameRef.current = requestAnimationFrame(getLevel)
    }

    getLevel()
  }, [onAudioLevelUpdate])

  /**
   * 开始录音
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null)

      // 1. 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // 16kHz采样率
          channelCount: 1, // 单声道
          echoCancellation: true, // 回声消除
          noiseSuppression: true, // 噪声抑制
          autoGainControl: true // 自动增益
        }
      })

      // 2. 创建MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Chrome默认格式
      })

      // 3. 设置音频分析器（用于音量检测）
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // 4. 监听录音数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // 5. 开始录音
      mediaRecorder.start(100) // 每100ms一个数据块
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      audioChunksRef.current = []

      // 6. 开始音量检测
      detectAudioLevel()

      // 7. 开始计时
      let seconds = 0
      timerRef.current = setInterval(() => {
        seconds++
        setDuration(seconds)
        onDurationUpdate?.(seconds)

        // 超时自动停止
        if (seconds >= maxDuration) {
          stopRecording()
        }
      }, 1000)

    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('录音启动失败:', error)
    }
  }, [maxDuration, onDurationUpdate, onAudioLevelUpdate, detectAudioLevel])

  /**
   * 停止录音
   */
  const stopRecording = useCallback(async (): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('没有正在进行的录音'))
        return
      }

      // 1. 停止MediaRecorder
      mediaRecorderRef.current.onstop = async () => {
        try {
          // 2. 合并音频块
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm'
          })

          // 3. 转换为ArrayBuffer
          const arrayBuffer = await audioBlob.arrayBuffer()

          // 4. 停止所有轨道
          const stream = mediaRecorderRef.current?.stream
          if (stream) {
            stream.getTracks().forEach(track => track.stop())
          }

          // 5. 清理资源
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }

          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }

          setIsRecording(false)
          setDuration(0)
          setAudioLevel(0)
          mediaRecorderRef.current = null
          analyserRef.current = null

          resolve(arrayBuffer)
        } catch (error) {
          reject(error)
        }
      }

      mediaRecorderRef.current.stop()
    })
  }, [])

  /**
   * 取消录音
   */
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()

      // 停止所有轨道
      const stream = mediaRecorderRef.current.stream
      stream.getTracks().forEach(track => track.stop())
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setIsRecording(false)
    setDuration(0)
    setAudioLevel(0)
    audioChunksRef.current = []
    mediaRecorderRef.current = null
    analyserRef.current = null
  }, [])

  return {
    isRecording,
    duration,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    error
  }
}
