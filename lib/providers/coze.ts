import { CozeAPI, RoleType } from '@coze/api'
import type {
  AIProvider,
  ChatChunk,
  ChatOptions,
  CozeConfig,
  ImageAttachment,
} from '../ai-provider'

/**
 * Coze AI Provider
 * 基于Coze API的流式对话实现
 * 支持多模态（图片输入）
 */
export class CozeProvider implements AIProvider {
  private client: CozeAPI
  private botId: string
  private systemPrompt?: string

  constructor(config: CozeConfig, systemPrompt?: string) {
    this.client = new CozeAPI({
      token: config.apiToken,
      baseURL: process.env.COZE_API_BASE_URL || 'https://api.coze.cn',
    })
    this.botId = config.botId
    this.systemPrompt = systemPrompt
  }

  getName(): string {
    return 'Coze'
  }

  async *chat(
    message: string,
    conversationId?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    images?: ImageAttachment[],
    options?: ChatOptions
  ): AsyncIterable<ChatChunk> {
    try {
      // 构建消息（支持图片）
      const additionalMessages: any[] = []

      // 如果有图片，先添加图片（移除base64前缀）
      if (images && images.length > 0) {
        for (const image of images) {
          // 移除 data:image/xxx;base64, 前缀，只保留纯base64数据
          const base64Data = image.base64.includes(',')
            ? image.base64.split(',')[1]
            : image.base64

          additionalMessages.push({
            role: RoleType.User,
            content: base64Data,
            content_type: 'image',
          })
        }
      }

      // 添加文字消息
      if (message) {
        additionalMessages.push({
          role: RoleType.User,
          content: message,
          content_type: 'text',
        })
      }

      // 如果没有图片也没有文字，返回空
      if (additionalMessages.length === 0) {
        throw new Error('消息和图片不能都为空')
      }

      const stream = await this.client.chat.stream({
        bot_id: this.botId,
        additional_messages: additionalMessages,
        conversation_id: conversationId || undefined,
        user_id: undefined, // 可以后续扩展
      })

      // 处理流式响应
      for await (const chunk of stream) {
        const content = (chunk.data as any)?.content || ''
        const isComplete = chunk.event === 'conversation.message.completed'

        yield {
          content,
          isComplete,
          conversationId: (chunk.data as any)?.conversation_id || (chunk as any).conversation_id,
        }
      }
    } catch (error) {
      console.error('Coze API 调用错误:', error)
      throw new Error('Coze API 调用失败')
    }
  }
}
