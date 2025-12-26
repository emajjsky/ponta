'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage, type ChatMessageProps } from './ChatMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

/**
 * 聊天界面组件属性
 */
export interface ChatInterfaceProps {
  agentSlug: string
  agentName: string
  agentAvatar: string
}

/**
 * 聊天界面组件
 * 完整的对话功能
 */
export function ChatInterface({ agentSlug, agentName, agentAvatar }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 加载历史消息
   */
  useEffect(() => {
    if (!user) return

    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/chat/history?agentSlug=${agentSlug}&limit=50`)
        const result = await response.json()

        if (result.success && result.history.length > 0) {
          const historyMessages = result.history.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            agentAvatar,
            agentName,
          }))
          setMessages(historyMessages)

          // 获取最新的对话 ID
          const lastAssistantMessage = result.history
            .filter((msg: any) => msg.role === 'assistant')
            .pop()
          if (lastAssistantMessage) {
            // 从数据库获取 conversationId（需要扩展 API）
          }
        }
      } catch (error) {
        console.error('加载历史消息失败:', error)
      }
    }

    loadHistory()
  }, [user, agentSlug, agentAvatar, agentName])

  /**
   * 自动滚动到底部
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /**
   * 发送消息
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsLoading(true)
    setIsStreaming(false)

    // 添加用户消息到列表
    const userMessageObj: ChatMessageProps = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessageObj])

    // 创建临时 AI 消息（用于流式更新）
    const aiMessageObj: ChatMessageProps = {
      role: 'assistant',
      content: '',
      agentAvatar,
      agentName,
    }
    setMessages((prev) => [...prev, aiMessageObj])

    try {
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController()

      // 发送消息到 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          agentSlug,
          message: userMessage,
          conversationId: conversationId || undefined,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '发送消息失败')
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ''

      if (reader) {
        setIsStreaming(true)

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.event === 'delta') {
                  // 更新 AI 消息内容
                  aiResponse += data.content
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.content = aiResponse
                    }
                    return newMessages
                  })
                } else if (data.event === 'completed') {
                  // 对话完成
                  setIsStreaming(false)
                  setConversationId(data.conversationId)

                  // 添加时间戳
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.timestamp = Date.now()
                    }
                    return newMessages
                  })
                } else if (data.event === 'error') {
                  // 错误
                  toast.error(data.error || '对话发生错误')
                  setIsStreaming(false)
                }
              } catch (parseError) {
                console.error('解析 SSE 数据错误:', parseError)
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('已取消发送')
      } else {
        console.error('发送消息错误:', error)
        toast.error(error.message || '发送消息失败，请稍后重试')

        // 移除失败的 AI 消息
        setMessages((prev) => prev.slice(0, -1))
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  /**
   * 处理键盘事件（Enter 发送）
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  /**
   * 停止生成
   */
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-3">
              <div className="text-4xl">💬</div>
              <p className="text-muted-foreground">
                开始与 {agentName} 对话吧！
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.role}-${index}-${message.timestamp || 'streaming'}`}
            {...message}
            isStreaming={message.role === 'assistant' && index === messages.length - 1 && isStreaming}
          />
        ))}

        {isLoading && !isStreaming && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">正在思考...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`和 ${agentName} 聊天...`}
            disabled={isLoading}
            className="flex-1"
          />
          {isStreaming ? (
            <Button onClick={handleStopGeneration} variant="outline">
              停止
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  )
}
