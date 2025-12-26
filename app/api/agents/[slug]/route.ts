import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/agents/[slug]
 * 获取单个智能体的详细信息
 *
 * 路径参数：
 * - slug: 智能体的唯一标识符
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // 查询智能体
    const agent = await prisma.agent.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        rarity: true,
        avatar: true,
        description: true,
        abilities: true,
        price: true,
        botId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    })

    // 智能体不存在
    if (!agent) {
      return NextResponse.json(
        { error: '智能体不存在' },
        { status: 404 }
      )
    }

    // 智能体已删除
    if (agent.deletedAt) {
      return NextResponse.json(
        { error: '该智能体已下架' },
        { status: 410 }
      )
    }

    // 解析 abilities JSON 字符串
    const agentWithParsedAbilities = {
      ...agent,
      abilities: JSON.parse(agent.abilities),
    }

    return NextResponse.json(
      {
        success: true,
        agent: agentWithParsedAbilities,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取智能体详情错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
