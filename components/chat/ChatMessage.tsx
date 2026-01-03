import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Bot, User, RotateCcw, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { AudioButton } from './AudioButton'

export interface ImageAttachment {
  id: string
  base64: string
  name: string
}

export interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  images?: ImageAttachment[]
  timestamp?: number
  isStreaming?: boolean
  agentAvatar?: string
  agentName?: string
  voiceType?: string
  isLatest?: boolean
  autoPlayAudio?: boolean
  onRegenerate?: () => void
  onCopy?: () => void
}

export function ChatMessage({
  role,
  content,
  images = [],
  timestamp,
  isStreaming = false,
  agentAvatar,
  agentName = 'AI',
  voiceType,
  isLatest = false,
  autoPlayAudio = false,
  onRegenerate,
  onCopy,
}: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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

      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
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
          {!isUser && !isStreaming && agentName && (
            <div className="text-xs font-semibold mb-1 opacity-70">
              {agentName}
            </div>
          )}

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

          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>

          {isStreaming && !isUser && (
            <span className="inline-block w-2 h-2 bg-current ml-1 animate-bounce" />
          )}
        </div>

        {timestamp && (
          <span className="text-xs text-muted-foreground mt-1 px-1">
            {format(new Date(timestamp), 'HH:mm', { locale: zhCN })}
          </span>
        )}

        {!isUser && !isStreaming && (
          <div className="flex gap-1 mt-2 items-center">
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                className="h-7 w-7"
                title="重新生成"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                const textToCopy = content?.trim() || ''
                if (!textToCopy) {
                  toast.error('没有可复制的内容')
                  return
                }

                try {
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(textToCopy)
                    toast.success('已复制到剪贴板')
                  } else {
                    const textArea = document.createElement('textarea')
                    textArea.value = textToCopy
                    textArea.style.position = 'fixed'
                    textArea.style.left = '-999999px'
                    textArea.style.top = '-999999px'
                    document.body.appendChild(textArea)
                    textArea.focus()
                    textArea.select()

                    try {
                      const successful = document.execCommand('copy')
                      document.body.removeChild(textArea)
                      if (successful) {
                        toast.success('已复制到剪贴板')
                      } else {
                        throw new Error('execCommand失败')
                      }
                    } catch (err) {
                      document.body.removeChild(textArea)
                      throw err
                    }
                  }
                } catch (error) {
                  console.error('复制失败详细错误:', error)
                  const errorMessage = error instanceof Error ? error.message : '未知错误'
                  toast.error(`复制失败: ${errorMessage}`)
                }
              }}
              className="h-7 w-7"
              title="复制"
            >
              <Copy className="w-3 h-3" />
            </Button>

            {isLatest && content && !isStreaming && (
              <AudioButton
                text={content}
                autoPlay={autoPlayAudio}
                voiceType={voiceType}
                isLatest={isLatest}
                timestamp={timestamp}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
