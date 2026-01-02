/**
 * useVoicePlayer Hook
 *
 * 封装音频播放逻辑（基于浏览器Audio API）
 *
 * 功能:
 * - 加载和播放音频
 * - 播放控制（播放/暂停/停止/跳转）
 * - 播放进度跟踪
 * - 支持多种音频格式（MP3/WAV/OPUS）
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseVoicePlayerReturn {
  /** 是否正在播放 */
  isPlaying: boolean
  /** 是否正在加载 */
  isLoading: boolean
  /** 音频总时长（秒） */
  duration: number
  /** 当前播放时间（秒） */
  currentTime: number
  /** 播放进度（0-1） */
  progress: number
  /** 播放音频 */
  play: (audioData: ArrayBuffer) => Promise<void>
  /** 暂停播放 */
  pause: () => void
  /** 停止播放 */
  stop: () => void
  /** 跳转到指定时间 */
  seek: (time: number) => void
  /** 设置音速（0.5-2.0） */
  setPlaybackRate: (rate: number) => void
  /** 错误信息 */
  error: Error | null
}

/**
 * 语音播放Hook
 */
export function useVoicePlayer(): UseVoicePlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 清理定时器
   */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /**
   * 更新播放进度
   */
  const startProgressUpdate = useCallback(() => {
    clearTimer()

    timerRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }, 100) // 每100ms更新一次
  }, [clearTimer])

  /**
   * 播放音频
   */
  const play = useCallback(async (audioData: ArrayBuffer): Promise<void> => {
    try {
      setError(null)
      setIsLoading(true)

      // 1. 创建Blob URL
      const blob = new Blob([audioData], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(blob)

      // 2. 创建或复用Audio元素
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
      } else {
        audioRef.current.src = audioUrl
      }

      const audio = audioRef.current

      // 3. 设置事件监听
      audio.onloadedmetadata = () => {
        setDuration(audio.duration)
        setIsLoading(false)
      }

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime)
      }

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        clearTimer()
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setIsLoading(false)
        setError(new Error('音频播放失败'))
        clearTimer()
      }

      // 4. 开始播放
      await audio.play()
      setIsPlaying(true)
      setIsLoading(false)
      startProgressUpdate()

    } catch (err) {
      const error = err as Error
      setError(error)
      setIsLoading(false)
      setIsPlaying(false)
      console.error('音频播放失败:', error)
    }
  }, [startProgressUpdate, clearTimer])

  /**
   * 暂停播放
   */
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
      setIsPlaying(false)
      clearTimer()
    }
  }, [clearTimer])

  /**
   * 停止播放
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      clearTimer()
    }
  }, [clearTimer])

  /**
   * 跳转到指定时间
   */
  const seek = useCallback((time: number) => {
    if (audioRef.current && time >= 0 && time <= duration) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [duration])

  /**
   * 设置音速
   */
  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current && rate >= 0.5 && rate <= 2.0) {
      audioRef.current.playbackRate = rate
    }
  }, [])

  /**
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      clearTimer()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [clearTimer])

  /**
   * 计算播放进度
   */
  const progress = duration > 0 ? currentTime / duration : 0

  return {
    isPlaying,
    isLoading,
    duration,
    currentTime,
    progress,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    error
  }
}
