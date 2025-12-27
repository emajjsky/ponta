import { CozeAPI, RoleType } from '@coze/api'
import type {
  AIProvider,
  ChatChunk,
  ChatOptions,
  CozeConfig,
} from '../ai-provider'

/**
 * Coze AI Provider
 * 基于Coze API的流式对话实现
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
    options?: ChatOptions
  ): AsyncIterable<ChatChunk> {
    try {
      const stream = await this.client.chat.stream({
        bot_id: this.botId,
        additional_messages: [
          {
            role: RoleType.User,
            content: message,
            content_type: 'text',
          },
        ],
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
