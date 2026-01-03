'use client'

/**
 * 音频播放按钮组件 - 极简版本
 */

import { useState, useEffect, useRef } from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface AudioButtonProps {
  text: string
  autoPlay?: boolean  // 保留props兼容性，但不再使用
  voiceType?: string
  isLatest?: boolean
  /** 消息时间戳，用于判断是否为新消息 */
  timestamp?: number
}

export function AudioButton({
  text,
  voiceType,
  isLatest = false,
  timestamp
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /**
   * 处理播放
   */
  const handlePlay = async () => {
    console.log('🎵 AudioButton: handlePlay被调用', {
      isPlaying,
      text: text.substring(0, 20)
    })

    // 如果正在播放，重复播放
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
      return
    }

    try {
      setIsLoading(true)
      console.log('🎵 AudioButton: 开始调用TTS API')
      toast.loading('正在生成语音...', { id: 'tts-loading' })

      // 调用TTS API
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceType })
      })

      if (!response.ok) {
        toast.dismiss('tts-loading')
        const error = await response.json()
        throw new Error(error.error || '语音生成失败')
      }

      const audioBuffer = await response.arrayBuffer()
      toast.success('语音生成成功', { id: 'tts-loading' })
      setIsLoading(false)

      // 播放
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
      } else {
        const audio = new Audio(audioUrl)
        audioRef.current = audio
      }

      const audio = audioRef.current!
      audio.currentTime = 0
      await audio.play()

      setIsPlaying(true)
      setShouldAnimate(true)

    } catch (err) {
      const error = err as Error
      toast.dismiss('tts-loading')
      toast.error(`语音播放失败: ${error.message}`)
      setIsLoading(false)
      console.error('TTS错误:', error)
    }
  }

  // 播放完成处理
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const audio = audioRef.current
      const handleEnded = () => {
        setIsPlaying(false)
        setShouldAnimate(false)
      }
      audio.addEventListener('ended', handleEnded)
      return () => audio.removeEventListener('ended', handleEnded)
    }
  }, [isPlaying])

  // 如果不是最新消息，不显示按钮
  if (!isLatest) {
    return null
  }

  return (
    <>
      <audio ref={audioRef} />

      <button
        onClick={handlePlay}
        disabled={isLoading}
        className={`
          relative p-2 rounded-lg transition-all duration-300
          ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-secondary'}
          ${shouldAnimate ? 'animate-pulse' : ''}
        `}
        title={isPlaying ? '重复播放' : '播放语音'}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Volume2 className={`h-5 w-5 ${shouldAnimate ? 'text-primary' : 'text-muted-foreground'}`} />
        )}
      </button>
    </>
  )
}
