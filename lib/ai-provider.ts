/**
 * AI Provider 统一接口
 * 支持多种AI服务提供商（Coze、OpenAI兼容接口等）
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatOptions {
  stream?: boolean
  temperature?: number
  maxTokens?: number
}

export interface ChatChunk {
  content: string
  isComplete: boolean
  conversationId?: string  // 可选的conversationId（某些API会返回）
}

/**
 * AI Provider 基础接口
 * 所有AI服务提供商必须实现这个接口
 */
export interface AIProvider {
  /**
   * 发送消息并获取流式响应
   * @param message 当前用户消息
   * @param conversationId 对话ID（用于Coze等维护会话状态的API）
   * @param history 对话历史（用于OpenAI等不维护会话状态的API）
   * @param options 额外选项
   */
  chat(
    message: string,
    conversationId?: string,
    history?: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<ChatChunk>

  /**
   * 获取provider名称
   */
  getName(): string
}

/**
 * Coze Provider 配置
 */
export interface CozeConfig {
  botId: string
  apiToken: string
}

/**
 * OpenAI Provider 配置
 */
export interface OpenAIConfig {
  endpoint: string // 例如: https://api.siliconflow.cn/v1/chat/completions
  apiKey: string
  model: string // 例如: deepseek-chat
  headers?: Record<string, string> // 自定义headers
}

/**
 * Provider类型定义
 */
export type ProviderType = 'COZE' | 'OPENAI'

/**
 * 从Agent创建Provider的工厂函数
 */
export async function createProvider(
  agent: {
    provider: string
    providerConfig: string
    systemPrompt?: string
  }
): Promise<AIProvider> {
  const config = JSON.parse(agent.providerConfig)

  switch (agent.provider) {
    case 'COZE':
      const { CozeProvider } = await import('./providers/coze')
      const cozeConfig = config as CozeConfig

      // 如果apiToken为空，使用环境变量中的默认值
      if (!cozeConfig.apiToken || cozeConfig.apiToken.trim() === '') {
        cozeConfig.apiToken = process.env.COZE_API_TOKEN || ''
      }

      return new CozeProvider(cozeConfig, agent.systemPrompt)

    case 'OPENAI':
      const { OpenAIProvider } = await import('./providers/openai')
      return new OpenAIProvider(config as OpenAIConfig, agent.systemPrompt)

    default:
      throw new Error(`Unknown provider: ${agent.provider}`)
  }
}
