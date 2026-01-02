'use client'

/**
 * VoicePlayer Component
 *
 * 语音播放组件
 *
 * 功能:
 * - 播放/暂停按钮
 * - 进度条（可拖动）
 * - 时长显示
 * - 音速控制
 */

import { useState } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { useVoicePlayer } from '@/hooks/useVoicePlayer'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'

export interface VoicePlayerProps {
  /** 要播放的文字 */
  text: string
  /** 是否自动播放 */
  autoPlay?: boolean
  /** 播放结束回调 */
  onPlayEnd?: () => void
  /** 音色类型（可选） */
  voiceType?: string
}

export function VoicePlayer({
  text,
  autoPlay = false,
  onPlayEnd,
  voiceType
}: VoicePlayerProps) {
  const [playbackRate, setPlaybackRateState] = useState(1.0)

  const {
    isPlaying,
    isLoading,
    duration,
    currentTime,
    progress,
    play,
    pause,
    seek,
    setPlaybackRate,
    error
  } = useVoicePlayer()

  /**
   * 处理播放/暂停
   */
  const handleTogglePlay = async () => {
    if (isPlaying) {
      pause()
    } else {
      try {
        // 调用TTS API获取音频
        toast.loading('正在生成语音...', { id: 'tts-loading' })

        const response = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text,
            voiceType,
            speed: playbackRate
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '语音生成失败')
        }

        // 获取音频数据
        const audioBuffer = await response.arrayBuffer()

        toast.success('语音生成成功', { id: 'tts-loading' })

        // 播放音频
        await play(audioBuffer)

      } catch (err) {
        const error = err as Error
        toast.error(`语音播放失败: ${error.message}`)
        console.error('TTS错误:', error)
      }
    }
  }

  /**
   * 处理播放结束
   */
  const handlePlayEnd = () => {
    pause()
    onPlayEnd?.()
  }

  /**
   * 格式化时长显示
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * 处理进度条拖动
   */
  const handleSeek = (value: number[]) => {
    const time = (value[0] / 100) * duration
    seek(time)
  }

  /**
   * 处理音速切换
   */
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRateState(rate)
    setPlaybackRate(rate)
    toast.success(`音速: ${rate}x`)
  }

  // 监听播放结束
  if (!isPlaying && currentTime > 0 && progress >= 0.99) {
    handlePlayEnd()
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
      {/* 播放/暂停按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleTogglePlay}
        disabled={isLoading}
        className="h-10 w-10 flex-shrink-0"
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>

      {/* 进度条和时长 */}
      <div className="flex-1 flex flex-col gap-1">
        {/* 进度条 */}
        <Slider
          value={[progress * 100]}
          onValueChange={handleSeek}
          disabled={!isPlaying && currentTime === 0}
          max={100}
          step={1}
          className="cursor-pointer"
        />

        {/* 时长显示 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 音速控制 */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePlaybackRateChange(playbackRate === 1.0 ? 1.5 : playbackRate === 1.5 ? 2.0 : 1.0)}
          className="h-8 px-2 text-xs"
        >
          {playbackRate}x
        </Button>
      </div>

      {/* 音量图标 */}
      <Volume2 className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
