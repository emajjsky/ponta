import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { createProvider } from '@/lib/ai-provider'
import { saveChatHistory, getOrCreateConversationId, getChatHistory } from '@/lib/coze'
import prisma from '@/lib/prisma'

/**
 * POST /api/chat
 * 与智能体对话（流式响应）
 *
 * 需要认证：是
 * Request Body:
 *   agentSlug: string - 智能体 slug
 *   message: string - 用户消息
 *   conversationId?: string - 对话 ID（可选）
 *
 * Response: Server-Sent Events (SSE) 流
 */
export async function POST(request: NextRequest) {
  try {
    // 从 Cookie 中获取 Token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return new Response(JSON.stringify({ error: '未登录，请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 验证 Token
    let payload
    try {
      payload = await verifyToken(token)
    } catch (error) {
      return new Response(JSON.stringify({ error: '登录已过期，请重新登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 获取请求体
    const body = await request.json()
    const { agentSlug, message, conversationId: clientConversationId } = body

    // 参数验证
    if (!agentSlug) {
      return new Response(JSON.stringify({ error: '智能体 slug 不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '消息不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 查询智能体
    const agent = await prisma.agent.findUnique({
      where: { slug: agentSlug },
    })

    if (!agent || agent.deletedAt) {
      return new Response(JSON.stringify({ error: '智能体不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 检查用户是否已激活该智能体
    const userAgent = await prisma.userAgent.findFirst({
      where: {
        userId: payload.userId,
        agentId: agent.id,
      },
    })

    if (!userAgent) {
      return new Response(JSON.stringify({ error: '你还没有激活该智能体，请先激活' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 获取或创建对话 ID
    const conversationId = clientConversationId || await getOrCreateConversationId(payload.userId, agent.id)

    // 加载对话历史（用于OpenAI等不维护会话状态的Provider）
    const history = await getChatHistory(payload.userId, agent.id, 20)

    // 使用Provider工厂创建AI实例
    const provider = await createProvider({
      ...agent,
      systemPrompt: agent.systemPrompt || undefined,
    })

    // 调用AI API获取流式响应
    const stream = provider.chat(message, conversationId || undefined, history)

    // 用于收集完整的 AI 回复（用于保存到数据库）
    let fullAiResponse = ''
    let actualConversationId = conversationId || null  // 实际的conversationId（从API返回值中获取）

    // 创建转换流（处理 SSE 格式）
    const encoder = new TextEncoder()
    const decodedStream = new ReadableStream({
      async start(controller) {
        try {
          // 使用 AsyncIterable 遍历流数据
          for await (const chunk of stream) {
            // 如果chunk包含conversationId，更新它
            if (chunk.conversationId) {
              actualConversationId = chunk.conversationId
            }

            fullAiResponse += chunk.content

            // 发送 SSE 格式数据
            const sseData = `data: ${JSON.stringify({
              event: 'delta',
              content: chunk.content,
            })}\n\n`
            controller.enqueue(encoder.encode(sseData))

            // 如果消息完成
            if (chunk.isComplete) {
              // 保存聊天历史
              if (fullAiResponse) {
                await saveChatHistory(
                  userAgent.id,
                  payload.userId,
                  agent.id,
                  message,
                  fullAiResponse,
                  actualConversationId || ''
                )
              }

              // 发送完成事件
              const completeSseData = `data: ${JSON.stringify({
                event: 'completed',
                conversationId: actualConversationId,
              })}\n\n`
              controller.enqueue(encoder.encode(completeSseData))
            }
          }

          // 流结束
          controller.close()
        } catch (error) {
          console.error('流处理错误:', error)

          // 发送错误事件
          const errorSseData = `data: ${JSON.stringify({
            event: 'error',
            error: error instanceof Error ? error.message : '对话发生错误',
          })}\n\n`
          controller.enqueue(encoder.encode(errorSseData))
          controller.close()
        }
      },
    })

    // 返回 SSE 流
    return new Response(decodedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
      },
    })
  } catch (error) {
    console.error('对话 API 错误:', error)
    return new Response(JSON.stringify({ error: '服务器错误，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
