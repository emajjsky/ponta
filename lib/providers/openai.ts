import type {
  AIProvider,
  ChatChunk,
  ChatOptions,
  OpenAIConfig,
  ImageAttachment,
} from '../ai-provider'

/**
 * OpenAI Compatible Provider
 * 支持OpenAI、GLM-4V、SiliconFlow、DeepSeek、Gemini等所有兼容OpenAI API的服务
 * 支持多模态（图片输入）
 */
export class OpenAIProvider implements AIProvider {
  private endpoint: string
  private apiKey: string
  private model: string
  private headers: Record<string, string>
  private systemPrompt?: string

  constructor(config: OpenAIConfig, systemPrompt?: string) {
    this.endpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions'
    this.apiKey = config.apiKey
    this.model = config.model
    this.headers = config.headers || {}
    this.systemPrompt = systemPrompt
  }

  getName(): string {
    return 'OpenAI Compatible'
  }

  async *chat(
    message: string,
    conversationId?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    images?: ImageAttachment[],
    options?: ChatOptions
  ): AsyncIterable<ChatChunk> {
    try {
      // 构建消息数组（支持多模态）
      const messages: Array<{
        role: 'system' | 'user' | 'assistant'
        content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
      }> = []

      // 添加系统提示词
      if (this.systemPrompt) {
        messages.push({
          role: 'system',
          content: this.systemPrompt,
        })
      }

      // 添加历史对话（如果有）
      if (history && history.length > 0) {
        // 限制历史消息数量，避免token超限（最多20条）
        const recentHistory = history.slice(-20)
        messages.push(...recentHistory)
      }

      // 添加当前用户消息（支持图片）
      if (images && images.length > 0) {
        // 多模态消息：图片 + 文字
        const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = []

        // 添加图片
        for (const image of images) {
          // 移除Base64前缀（data:image/jpeg;base64,）
          const base64Data = image.base64.includes(',')
            ? image.base64.split(',')[1]
            : image.base64

          content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`,
            },
          })
        }

        // 添加文字（如果有）
        if (message) {
          content.push({
            type: 'text',
            text: message,
          })
        }

        messages.push({
          role: 'user',
          content,
        })
      } else {
        // 纯文字消息
        messages.push({
          role: 'user',
          content: message,
        })
      }

      // 构建请求体
      const body = {
        model: this.model,
        messages,
        stream: true,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
      }

      // 发送请求
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.headers,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API 错误: ${response.status} ${errorText}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6) // 移除 "data: " 前缀
          if (data === '[DONE]') {
            yield { content: '', isComplete: true }
            return
          }

          try {
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content || ''
            const isComplete = json.choices?.[0]?.finish_reason === 'stop'

            yield {
              content,
              isComplete,
            }
          } catch (e) {
            // 忽略解析错误（可能是心跳包等）
            console.warn('解析SSE数据失败:', e)
          }
        }
      }
    } catch (error) {
      console.error('OpenAI API 调用错误:', error)
      throw error
    }
  }
}
