import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/agents
 * 获取所有智能体列表（管理员）
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin(request)

    // 查询所有智能体（仅未删除的）
    const agents = await prisma.agent.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            userAgents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 解析 abilities
    const agentsWithParsedAbilities = agents.map((agent) => ({
      ...agent,
      abilities: JSON.parse(agent.abilities),
    }))

    return NextResponse.json(
      {
        success: true,
        agents: agentsWithParsedAbilities,
      },
      { status: 200 }
    )
  } catch (error: any) {
    // 处理权限错误
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    console.error('获取智能体列表错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/agents
 * 创建新智能体
 *
 * 需要认证：是
 * 需要权限：ADMIN
 *
 * Request Body:
 *   name: string - 智能体名称
 *   slug: string - URL 标识符
 *   botId: string - Coze Bot ID
 *   rarity: string - 稀有度 (STANDARD | HIDDEN)
 *   avatar: string - 头像 URL
 *   description: string - 描述
 *   abilities: string[] - 能力列表
 *   price: number - 价格
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const { payload } = await requireAdmin(request)

    // 获取请求体
    const body = await request.json()
    const { name, slug, botId, seriesId, rarity, avatar, description, abilities, price, stock, isActive, systemPrompt } = body

    // 参数验证
    if (!name || !slug || !botId) {
      return NextResponse.json(
        { error: '缺少必需参数：name, slug, botId' },
        { status: 400 }
      )
    }

    // 检查 slug 是否已存在
    const existingAgent = await prisma.agent.findUnique({
      where: { slug },
    })

    if (existingAgent) {
      return NextResponse.json(
        { error: '该 slug 已被使用' },
        { status: 409 }
      )
    }

    // 创建智能体
    const agent = await prisma.agent.create({
      data: {
        name,
        slug,
        botId,
        seriesId: seriesId || null,
        rarity: rarity || 'STANDARD',
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${slug}`,
        description: description || `${name} - AI智能体助手`,
        abilities: JSON.stringify(abilities || []),
        price: price || 0,
        stock: stock || 0,
        isActive: isActive !== undefined ? isActive : true,
        systemPrompt: systemPrompt || null,
      },
    })

    // 解析 abilities
    const agentWithParsedAbilities = {
      ...agent,
      abilities: JSON.parse(agent.abilities),
    }

    return NextResponse.json(
      {
        success: true,
        message: '智能体创建成功',
        agent: agentWithParsedAbilities,
      },
      { status: 201 }
    )
  } catch (error: any) {
    // 处理权限错误
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    console.error('创建智能体错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
