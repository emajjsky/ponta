import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Bot, User } from 'lucide-react'

/**
 * 图片附件接口
 */
export interface ImageAttachment {
  id: string
  base64: string
  name: string
}

/**
 * 聊天消息组件属性
 */
export interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  images?: ImageAttachment[] // 图片附件
  timestamp?: number
  isStreaming?: boolean // 是否正在流式输出
  agentAvatar?: string // AI 头像
  agentName?: string // AI 名称
}

/**
 * 聊天消息组件
 * 展示单条聊天消息（支持图片）
 */
export function ChatMessage({
  role,
  content,
  images = [],
  timestamp,
  isStreaming = false,
  agentAvatar,
  agentName = 'AI',
}: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 头像 */}
      <Avatar className={`w-8 h-8 ${isUser ? 'bg-primary' : 'bg-secondary'}`}>
        {isUser ? (
          <>
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            {agentAvatar && <AvatarImage src={agentAvatar} alt={agentName} />}
            <AvatarFallback>
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* 消息气泡 */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 消息内容 */}
        <div
          className={`
            px-4 py-2 rounded-lg
            ${isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
            }
            ${isStreaming && !isUser ? 'animate-pulse' : ''}
          `}
        >
          {/* AI 名称标签（仅在 AI 消息且非流式时显示） */}
          {!isUser && !isStreaming && agentName && (
            <div className="text-xs font-semibold mb-1 opacity-70">
              {agentName}
            </div>
          )}

          {/* 图片附件（显示在文本上方） */}
          {images && images.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {images.map((image) => (
                <img
                  key={image.id}
                  src={image.base64}
                  alt={image.name}
                  className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          {/* 消息文本 */}
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>

          {/* 流式输出指示器 */}
          {isStreaming && !isUser && (
            <span className="inline-block w-2 h-2 bg-current ml-1 animate-bounce" />
          )}
        </div>

        {/* 时间戳 */}
        {timestamp && (
          <span className="text-xs text-muted-foreground mt-1 px-1">
            {format(new Date(timestamp), 'HH:mm', { locale: zhCN })}
          </span>
        )}
      </div>
    </div>
  )
}
