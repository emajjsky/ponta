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
    const { agentSlug, message, conversationId: clientConversationId, images, isRegenerate } = body

    // 调试日志
    console.log('=== 收到聊天请求 ===')
    console.log('agentSlug:', agentSlug)
    console.log('message:', message)
    console.log('images:', images ? `收到 ${images.length} 张图片` : '无图片')
    if (images && images.length > 0) {
      console.log('第一张图片ID:', images[0].id)
      console.log('第一张图片base64长度:', images[0].base64.length)
    }

    // 参数验证
    if (!agentSlug) {
      return new Response(JSON.stringify({ error: '智能体 slug 不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 允许纯图片消息（message可以为空）
    if ((!message || typeof message !== 'string') && (!images || images.length === 0)) {
      return new Response(JSON.stringify({ error: '消息或图片不能为空' }), {
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

    // 调用AI API获取流式响应（支持图片）
    const stream = provider.chat(message, conversationId || undefined, history, images)

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
              // 发送完成事件
              const completeSseData = `data: ${JSON.stringify({
                event: 'completed',
                conversationId: actualConversationId,
              })}\n\n`
              controller.enqueue(encoder.encode(completeSseData))
            }
          }

          // 流结束后保存聊天历史
          if (fullAiResponse) {
            // 清理消息中的JSON元数据（Coze API的各类元数据）
            let cleanResponse = fullAiResponse
              // 移除 generate_answer_finish 消息
              .replace(/\s*\{"msg_type":"generate_answer_finish","data":".*?","from_module":.*?\}/g, '')
              .replace(/\s*\{"msg_type":"generate_answer_finish","data":"\{.*?\}","from_module":.*?\}/g, '')
              // 移除 time_capsule_recall 消息
              .replace(/\s*\{"msg_type":"time_capsule_recall","data":".*?","from_module":.*?\}/g, '')
              .replace(/\s*\{"msg_type":"time_capsule_recall","data":"\{.*?\}","from_module":.*?\}/g, '')
              // 移除其他可能的JSON元数据（通用模式）
              .replace(/\s*\{"msg_type":"[^"]*","data":".*?","from_module":"[^"]*"\}/g, '')
              .replace(/\s*\{"msg_type":"[^"]*","data":"\{[^}]*\}","from_module":"[^"]*"\}/g, '')
              .trim()

            // 保存聊天历史（包含图片）
            if (cleanResponse) {
              // 如果是重新生成，先删除最后一条AI消息（避免重复）
              if (isRegenerate) {
                const lastAiMessage = await prisma.chatHistory.findFirst({
                  where: {
                    userAgentId: userAgent.id,
                    role: 'assistant',
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                })
                
                if (lastAiMessage) {
                  await prisma.chatHistory.delete({
                    where: { id: lastAiMessage.id },
                  })
                  console.log('重新生成：已删除旧AI消息')
                }
              }
              
              await saveChatHistory(
                userAgent.id,
                payload.userId,
                agent.id,
                message,
                cleanResponse,
                actualConversationId || '',
                images, // 用户上传的图片
                undefined // AI通常不返回图片，传undefined
              )

              // 更新用户对话统计（异步执行，不阻塞响应）
              ;(async () => {
                try {
                  // 获取用户当前数据
                  const user = await prisma.user.findUnique({
                    where: { id: payload.userId },
                    select: { totalChats: true },
                  })

                  if (user) {
                    // 更新对话次数
                    await prisma.user.update({
                      where: { id: payload.userId },
                      data: {
                        totalChats: user.totalChats + 1,
                      },
                    })
                  }
                } catch (error) {
                  console.error('更新用户统计数据错误:', error)
                }
              })()
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
