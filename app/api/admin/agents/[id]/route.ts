import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/agents/[id]
 * 获取单个智能体详情（管理员）
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await requireAdmin(request)

    const { id } = await params

    // 查询智能体
    const agent = await prisma.agent.findUnique({
      where: { id },
    })

    if (!agent) {
      return NextResponse.json(
        { error: '智能体不存在' },
        { status: 404 }
      )
    }

    // 解析 abilities
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
  } catch (error: any) {
    // 处理权限错误
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      )
    }

    console.error('获取智能体详情错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/agents/[id]
 * 更新智能体信息
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await requireAdmin(request)

    const { id } = await params

    // 获取请求体
    const body = await request.json()
    const {
      name,
      slug,
      provider,
      providerConfig,
      seriesId,
      rarity,
      avatar,
      description,
      abilities,
      price,
      stock,
      isActive,
      systemPrompt
    } = body

    // 检查智能体是否存在
    const existingAgent = await prisma.agent.findUnique({
      where: { id },
    })

    if (!existingAgent) {
      return NextResponse.json(
        { error: '智能体不存在' },
        { status: 404 }
      )
    }

    // 如果要修改 slug，检查新 slug 是否已被使用
    if (slug && slug !== existingAgent.slug) {
      const slugExists = await prisma.agent.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: '该 slug 已被使用' },
          { status: 409 }
        )
      }
    }

    // 验证providerConfig（如果提供）
    if (providerConfig) {
      try {
        JSON.parse(providerConfig)
      } catch (e) {
        return NextResponse.json(
          { error: 'providerConfig必须是有效的JSON字符串' },
          { status: 400 }
        )
      }
    }

    // 构建更新数据
    const updateData: any = {}
    if (name) updateData.name = name
    if (slug) updateData.slug = slug
    if (provider) updateData.provider = provider
    if (providerConfig) updateData.providerConfig = providerConfig
    if (seriesId !== undefined) updateData.seriesId = seriesId
    if (rarity) updateData.rarity = rarity
    if (avatar) updateData.avatar = avatar
    if (description !== undefined) updateData.description = description
    if (abilities) updateData.abilities = JSON.stringify(abilities)
    if (price !== undefined) updateData.price = price
    if (stock !== undefined) updateData.stock = stock
    if (isActive !== undefined) updateData.isActive = isActive
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt

    // 更新智能体
    const agent = await prisma.agent.update({
      where: { id },
      data: updateData,
    })

    // 解析 abilities
    const agentWithParsedAbilities = {
      ...agent,
      abilities: JSON.parse(agent.abilities),
    }

    return NextResponse.json(
      {
        success: true,
        message: '智能体更新成功',
        agent: agentWithParsedAbilities,
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

    console.error('更新智能体错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/agents/[id]
 * 删除智能体（软删除）
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await requireAdmin(request)

    const { id } = await params

    // 检查智能体是否存在
    const existingAgent = await prisma.agent.findUnique({
      where: { id },
    })

    if (!existingAgent) {
      return NextResponse.json(
        { error: '智能体不存在' },
        { status: 404 }
      )
    }

    // 软删除（设置 deletedAt）
    const agent = await prisma.agent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
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
        message: '智能体删除成功',
        agent: agentWithParsedAbilities,
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

    console.error('删除智能体错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
