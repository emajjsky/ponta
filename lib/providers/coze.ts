import { CozeAPI, RoleType } from '@coze/api'
import axios from 'axios'
import type {
  AIProvider,
  ChatChunk,
  ChatOptions,
  CozeConfig,
  ImageAttachment,
} from '../ai-provider'

/**
 * Coze文件上传响应
 */
interface CozeFileResponse {
  code: number
  data: {
    id: string
    file_name: string
    bytes: number
    created_at: number
  }
}

/**
 * Coze AI Provider
 * 基于Coze API的流式对话实现
 * 支持多模态（图片输入）
 */
export class CozeProvider implements AIProvider {
  private client: CozeAPI
  private botId: string
  private systemPrompt?: string
  private apiToken: string
  private baseURL: string

  constructor(config: CozeConfig, systemPrompt?: string) {
    this.client = new CozeAPI({
      token: config.apiToken,
      baseURL: process.env.COZE_API_BASE_URL || 'https://api.coze.cn',
    })
    this.botId = config.botId
    this.systemPrompt = systemPrompt
    this.apiToken = config.apiToken
    this.baseURL = process.env.COZE_API_BASE_URL || 'https://api.coze.cn'
  }

  /**
   * 上传图片到Coze，返回file_id
   * 使用axios直接调用API，绕过SDK的文件上传问题
   */
  private async uploadImage(image: ImageAttachment): Promise<string> {
    try {
      // 解析base64数据
      const base64Data = image.base64.includes(',')
        ? image.base64.split(',')[1]
        : image.base64

      // 获取图片类型
      const mimeMatch = image.base64.match(/^data:([^;]+);base64,/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

      // 转换为Buffer
      const buffer = Buffer.from(base64Data, 'base64')

      console.log('正在上传图片到Coze...', {
        name: image.name,
        size: buffer.length,
        type: mimeType,
      })

      // 使用FormData手动构建multipart/form-data请求
      const FormData = require('form-data')
      const form = new FormData()
      form.append('file', buffer, {
        filename: image.name,
        contentType: mimeType,
      })

      // 直接调用Coze文件上传API
      const response = await axios.post<CozeFileResponse>(
        `${this.baseURL}/v1/files/upload`,
        form,
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            ...form.getHeaders(),
          },
        }
      )

      if (response.data.code === 0 && response.data.data?.id) {
        console.log('图片上传成功，file_id:', response.data.data.id)
        return response.data.data.id
      } else {
        throw new Error(`上传失败: ${JSON.stringify(response.data)}`)
      }
    } catch (error) {
      console.error('上传图片错误:', error)
      throw new Error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
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
      // 调试日志
      console.log('=== Coze Provider 开始 ===')
      console.log('message:', message)
      console.log('images:', images ? `收到 ${images.length} 张图片` : '无图片')

      // 构建消息（支持图片）
      const additionalMessages: any[] = []

      // 如果有图片，先上传然后构建多模态消息
      if (images && images.length > 0) {
        console.log('正在上传图片并构建多模态消息...')

        // 上传所有图片
        const fileIds: string[] = []
        for (let i = 0; i < images.length; i++) {
          console.log(`上传第 ${i + 1}/${images.length} 张图片...`)
          const fileId = await this.uploadImage(images[i])
          fileIds.push(fileId)
        }

        // 构建Coze格式的ObjectStringItem数组
        const contentParts: any[] = []

        // 添加图片（使用file_id）
        for (const fileId of fileIds) {
          contentParts.push({
            type: 'image',
            file_id: fileId,
          })
        }

        // 添加文字
        if (message) {
          contentParts.push({
            type: 'text',
            text: message,
          })
        }

        // 创建消息（使用ObjectStringItem数组，不是JSON字符串！）
        additionalMessages.push({
          role: RoleType.User,
          content: contentParts,
          content_type: 'object_string',
        })

        console.log('多模态消息已构建，包含', contentParts.length, '个内容块')
      } else if (message) {
        // 纯文字消息
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
