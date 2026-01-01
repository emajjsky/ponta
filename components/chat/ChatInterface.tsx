'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage, type ChatMessageProps } from './ChatMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

/**
 * 图片接口
 */
interface ImageAttachment {
  id: string
  base64: string
  name: string
}

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
 * 完整的对话功能 + 图片上传 + 语音控制
 */
export function ChatInterface({ agentSlug, agentName, agentAvatar }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // 图片相关状态
  const [images, setImages] = useState<ImageAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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
            images: msg.images, // 添加图片字段
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
   * 处理图片上传
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 限制最多上传3张图片
    if (images.length + files.length > 3) {
      toast.error('最多只能上传3张图片')
      return
    }

    try {
      for (const file of Array.from(files)) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          toast.error(`文件 "${file.name}" 不是图片格式`)
          continue
        }

        // 验证文件大小（最大10MB）
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`图片 "${file.name}" 太大，请选择小于10MB的图片`)
          continue
        }

        // 转换为Base64
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          const newImage: ImageAttachment = {
            id: `${Date.now()}-${Math.random()}`,
            base64,
            name: file.name,
          }
          setImages((prev) => [...prev, newImage])
        }
        reader.readAsDataURL(file)
      }

      toast.success(`成功添加 ${Math.min(files.length, 3 - images.length)} 张图片`)
    } catch (error) {
      console.error('图片上传错误:', error)
      toast.error('图片上传失败')
    }

    // 清空input，允许重复上传同一文件
    e.target.value = ''
  }

  /**
   * 删除图片
   */
  const handleRemoveImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  /**
   * 发送消息（支持图片）
   */
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && images.length === 0) || isLoading || !user) return

    const userMessage = inputValue.trim()
    const currentImages = [...images]

    setInputValue('')
    setImages([])
    setIsLoading(true)
    setIsStreaming(false)

    // 添加用户消息到列表
    const userMessageObj: ChatMessageProps = {
      role: 'user',
      content: userMessage,
      images: currentImages, // 包含图片
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

      // 发送消息到 API（包含图片）
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
          images: currentImages, // 发送图片数据
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
                  // 实时过滤JSON元数据（Coze API的finish消息）
                  const cleanContent = data.content.replace(/\{"msg_type":"[^"]*","data":"[^"]*","from_module":[^}]*\}/g, '').replace(/\{"msg_type":"[^"]*","data":"\{[^}]*\}","from_module":[^}]*\}/g, '')
                  
                  // 去重：如果内容已经在aiResponse中完整存在，跳过（修复Coze API重复返回问题）
                  if (cleanContent && aiResponse.includes(cleanContent)) {
                    console.log('检测到重复内容，跳过:', cleanContent.slice(0, 50))
                  } else {
                    aiResponse += cleanContent
                  }

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

        // 恢复图片
        setImages(currentImages)
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
              <p className="text-xs text-muted-foreground">
                支持文字对话和图片分析
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
        {/* 图片预览区 */}
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.base64}
                  alt={image.name}
                  className="h-20 w-20 object-cover rounded-lg border"
                />
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 输入框 + 按钮 */}
        <div className="flex gap-2">
          {/* 图片上传按钮 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="icon"
            disabled={isLoading}
            title="上传图片（最多3张）"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`和 ${agentName} 聊天...${images.length > 0 ? ` (已选${images.length}张图片)` : ''}`}
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
              disabled={(!inputValue.trim() && images.length === 0) || isLoading}
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
          按 Enter 发送，Shift + Enter 换行 • 支持上传图片进行分析
        </p>
      </div>
    </div>
  )
}
