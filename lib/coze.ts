import { CozeAPI, RoleType } from '@coze/api'
import prisma from '@/lib/prisma'

/**
 * Coze 配置
 */
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || 'sat_KDMcFwCm9FafVo74JcYwaDSq0t1xCe940V4vl2ehRyBVd0CbUdFIWOR5qakrye3D'
const COZE_BASE_URL = process.env.COZE_API_BASE_URL || 'https://api.coze.cn'

/**
 * 图片附件接口
 */
export interface ImageAttachment {
  id: string
  base64: string
  name: string
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  images?: ImageAttachment[] // 图片附件（可选）
}

/**
 * 流式响应结果
 */
export interface StreamResult {
  event: string
  data: {
    content?: string
    conversation_id?: string
    status?: string
  }
}

/**
 * 创建 Coze 客户端
 */
function createCozeClient() {
  return new CozeAPI({
    token: COZE_API_TOKEN,
    baseURL: COZE_BASE_URL,
  })
}

/**
 * 发送消息并获取流式响应
 * @param botId Coze Bot ID
 * @param message 用户消息
 * @param conversationId 对话 ID（可选，用于多轮对话）
 * @param userId 用户 ID（可选）
 * @returns 流式响应 AsyncIterable
 */
export async function chatWithAgent(
  botId: string,
  message: string,
  conversationId?: string,
  userId?: string
): Promise<AsyncIterable<any>> {
  const client = createCozeClient()

  try {
    // 使用 Coze SDK 发送消息并获取流式响应
    const stream = await client.chat.stream({
      bot_id: botId,
      additional_messages: [
        {
          role: RoleType.User,
          content: message,
          content_type: 'text',
        },
      ],
      conversation_id: conversationId || undefined,
      user_id: userId || undefined,
    })

    return stream
  } catch (error) {
    console.error('Coze API 调用错误:', error)
    throw new Error('Coze API 调用失败')
  }
}

/**
 * 保存聊天历史到数据库
 * @param userAgentId 用户-智能体关联 ID
 * @param userId 用户 ID
 * @param agentId 智能 ID
 * @param userMessage 用户消息
 * @param aiMessage AI 回复
 * @param conversationId 对话 ID
 * @param userImages 用户消息中的图片（可选）
 * @param aiImages AI回复中的图片（可选，虽然目前AI不会返回图片，但保持接口一致性）
 */
export async function saveChatHistory(
  userAgentId: string,
  userId: string,
  agentId: string,
  userMessage: string,
  aiMessage: string,
  conversationId: string,
  userImages?: ImageAttachment[],
  aiImages?: ImageAttachment[]
): Promise<void> {
  try {
    // 保存用户消息（如果有图片，序列化为JSON存储）
    await prisma.chatHistory.create({
      data: {
        userId,
        agentId,
        userAgentId,
        role: 'user',
        content: userMessage,
        conversationId,
        images: userImages && userImages.length > 0 ? JSON.stringify(userImages) : null,
      },
    })

    // 保存 AI 回复（通常没有图片，但保持接口一致性）
    await prisma.chatHistory.create({
      data: {
        userId,
        agentId,
        userAgentId,
        role: 'assistant',
        content: aiMessage,
        conversationId,
        images: aiImages && aiImages.length > 0 ? JSON.stringify(aiImages) : null,
      },
    })
  } catch (error) {
    console.error('保存聊天历史错误:', error)
    // 不抛出错误，避免影响对话体验
  }
}

/**
 * 获取对话历史
 * @param userId 用户 ID
 * @param agentId 智能 ID
 * @param limit 返回数量限制
 * @returns 聊天历史记录（包含图片）
 */
export async function getChatHistory(
  userId: string,
  agentId: string,
  limit = 50
): Promise<ChatMessage[]> {
  try {
    const chatHistory = await prisma.chatHistory.findMany({
      where: {
        userId,
        agentId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    })

    return chatHistory.map((msg) => {
      // 解析图片数据（如果有）
      let images: ImageAttachment[] | undefined
      if (msg.images) {
        try {
          images = JSON.parse(msg.images) as ImageAttachment[]
        } catch (error) {
          console.error('解析图片数据失败:', error)
          images = undefined
        }
      }

      // 清理消息中的JSON元数据（Coze API的各类元数据）
      let cleanContent = msg.content
      // 移除 generate_answer_finish 消息
      cleanContent = cleanContent.replace(/\s*\{"msg_type":"generate_answer_finish","data":".*?","from_module":.*?\}/g, '')
      cleanContent = cleanContent.replace(/\s*\{"msg_type":"generate_answer_finish","data":"\{.*?\}","from_module":.*?\}/g, '')
      // 移除 time_capsule_recall 消息
      cleanContent = cleanContent.replace(/\s*\{"msg_type":"time_capsule_recall","data":".*?","from_module":.*?\}/g, '')
      cleanContent = cleanContent.replace(/\s*\{"msg_type":"time_capsule_recall","data":"\{.*?\}","from_module":.*?\}/g, '')
      // 移除其他可能的JSON元数据（通用模式）
      cleanContent = cleanContent.replace(/\s*\{"msg_type":"[^"]*","data":".*?","from_module":"[^"]*"\}/g, '')
      cleanContent = cleanContent.replace(/\s*\{"msg_type":"[^"]*","data":"\{[^}]*\}","from_module":"[^"]*"\}/g, '')
      cleanContent = cleanContent.trim()

      return {
        role: msg.role as 'user' | 'assistant',
        content: cleanContent,
        timestamp: msg.createdAt.getTime(),
        images,
      }
    })
  } catch (error) {
    console.error('获取对话历史错误:', error)
    return []
  }
}

/**
 * 获取或创建对话 ID
 * @param userId 用户 ID
 * @param agentId 智能 ID
 * @returns 对话 ID
 */
export async function getOrCreateConversationId(
  userId: string,
  agentId: string
): Promise<string | null> {
  try {
    // 查找最近的对话记录
    const lastMessage = await prisma.chatHistory.findFirst({
      where: {
        userId,
        agentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 如果有历史记录，返回对话 ID
    if (lastMessage && lastMessage.conversationId) {
      return lastMessage.conversationId
    }

    // 没有历史记录，返回 null（Coze 会自动创建新对话）
    return null
  } catch (error) {
    console.error('获取对话 ID 错误:', error)
    return null
  }
}

/**
 * 清除对话历史
 * @param userId 用户 ID
 * @param agentId 智能 ID
 */
export async function clearChatHistory(
  userId: string,
  agentId: string
): Promise<void> {
  try {
    await prisma.chatHistory.deleteMany({
      where: {
        userId,
        agentId,
      },
    })
  } catch (error) {
    console.error('清除对话历史错误:', error)
    throw new Error('清除对话历史失败')
  }
}
