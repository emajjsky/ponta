'use client'

/**
 * VoiceRecorder Component
 *
 * 语音录音组件
 *
 * 功能:
 * - 麦克风按钮（开始/停止录音）
 * - 录音时长显示
 * - 音量波形动画
 * - 取消按钮
 */

import { useState } from 'react'
import { Mic, MicOff, X } from 'lucide-react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export interface VoiceRecorderProps {
  /** 识别完成回调 */
  onTextRecognized: (text: string) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 最大录音时长（秒），默认60秒 */
  maxDuration?: number
}

export function VoiceRecorder({
  onTextRecognized,
  onError,
  maxDuration = 60
}: VoiceRecorderProps) {
  const [isSending, setIsSending] = useState(false)

  const {
    isRecording,
    duration,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    error
  } = useVoiceRecorder({
    maxDuration,
    onDurationUpdate: (d) => {
      if (d >= maxDuration) {
        handleStopRecording()
      }
    }
  })

  /**
   * 处理错误
   */
  if (error && !onError) {
    toast.error(error.message)
  }

  /**
   * 开始录音
   */
  const handleStartRecording = async () => {
    try {
      await startRecording()
      toast.success('开始录音...')
    } catch (err) {
      const error = err as Error
      toast.error(`录音启动失败: ${error.message}`)
      onError?.(error)
    }
  }

  /**
   * 停止录音并发送
   */
  const handleStopRecording = async () => {
    try {
      setIsSending(true)

      // 1. 停止录音
      const audioBuffer = await stopRecording()

      // 2. 转换为FormData
      const formData = new FormData()
      const blob = new Blob([audioBuffer], { type: 'audio/webm' })
      formData.append('audio', blob, 'recording.webm')
      formData.append('format', 'webm')
      formData.append('sampleRate', '16000')

      // 3. 调用ASR API
      toast.loading('正在识别语音...', { id: 'asr-loading' })

      const response = await fetch('/api/voice/asr', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success && data.text) {
        toast.success('识别成功', { id: 'asr-loading' })
        onTextRecognized(data.text)
      } else {
        throw new Error(data.error || '识别失败')
      }

    } catch (err) {
      const error = err as Error
      toast.error(`语音识别失败: ${error.message}`)
      onError?.(error)
    } finally {
      setIsSending(false)
    }
  }

  /**
   * 取消录音
   */
  const handleCancelRecording = () => {
    cancelRecording()
    toast.info('已取消录音')
  }

  /**
   * 格式化时长显示
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        /* 麦克风按钮 */
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStartRecording}
          disabled={isSending}
          className="relative"
          title="点击开始录音"
        >
          <Mic className="h-5 w-5" />
        </Button>
      ) : (
        /* 录音中状态 */
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
          {/* 音量波形动画 */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, (audioLevel / 100) * 24)}px`,
                  opacity: 0.5 + (audioLevel / 100) * 0.5
                }}
              />
            ))}
          </div>

          {/* 时长显示 */}
          <span className="text-sm font-mono min-w-[60px]">
            {formatDuration(duration)} / {formatDuration(maxDuration)}
          </span>

          {/* 停止按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStopRecording}
            disabled={isSending}
            className="h-8 w-8"
            title="点击停止录音"
          >
            <MicOff className="h-4 w-4 text-red-500" />
          </Button>

          {/* 取消按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelRecording}
            className="h-8 w-8"
            title="取消录音"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
