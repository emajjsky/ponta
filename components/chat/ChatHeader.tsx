'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Volume2 } from 'lucide-react'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ClearChatButton } from './ClearChatButton'

export interface ChatHeaderProps {
  agentName: string
  agentAvatar: string
  userAgentId: string
}

const AUTO_PLAY_STORAGE_KEY = 'chat-auto-play-enabled'

export function ChatHeader({
  agentName,
  agentAvatar,
  userAgentId,
}: ChatHeaderProps) {
  const [autoPlay, setAutoPlay] = useState(true)

  // 从localStorage读取初始状态
  useEffect(() => {
    const stored = localStorage.getItem(AUTO_PLAY_STORAGE_KEY)
    if (stored !== null) {
      setAutoPlay(stored === 'true')
    }
  }, [])

  // 状态变化时保存到localStorage并派发事件
  const handleAutoPlayChange = (enabled: boolean) => {
    setAutoPlay(enabled)
    localStorage.setItem(AUTO_PLAY_STORAGE_KEY, String(enabled))

    // 派发自定义事件通知ChatInterface
    window.dispatchEvent(new CustomEvent('auto-play-change', { detail: enabled }))
  }

  return (
    <div className="border-b bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3">
      {/* 返回按钮 */}
      <Button variant="ghost" size="icon" asChild>
        <Link href="/my-agents">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </Button>

      {/* 智能体信息 */}
      <Avatar className="w-10 h-10">
        <AvatarImage src={agentAvatar} alt={agentName} />
        <AvatarFallback>{agentName[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <h1 className="font-semibold">{agentName}</h1>
        <p className="text-xs text-muted-foreground">在线</p>
      </div>

      {/* 自动播放开关 + 清空按钮 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 mr-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="auto-play-switch" className="text-sm cursor-pointer">
            自动播放
          </Label>
          <Switch
            id="auto-play-switch"
            checked={autoPlay}
            onCheckedChange={handleAutoPlayChange}
          />
        </div>

        <ClearChatButton userAgentId={userAgentId} agentName={agentName} />
      </div>
    </div>
  )
}
