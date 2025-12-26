import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/series/[id]
 * 获取单个系列详情（管理员）
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    const { id } = await params

    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            slug: true,
            rarity: true,
            avatar: true,
            description: true,
            abilities: true,
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!series) {
      return NextResponse.json({ error: '系列不存在' }, { status: 404 })
    }

    // 解析 agents 的 abilities
    const seriesWithParsedAbilities = {
      ...series,
      agents: series.agents.map((agent) => ({
        ...agent,
        abilities: JSON.parse(agent.abilities),
      })),
    }

    return NextResponse.json(
      {
        success: true,
        series: seriesWithParsedAbilities,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('获取系列详情错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/series/[id]
 * 更新系列信息
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    const { id } = await params
    const body = await request.json()
    const {
      name,
      slug,
      description,
      coverImage,
      price,
      order,
      isActive,
    } = body

    // 检查系列是否存在
    const existingSeries = await prisma.series.findUnique({
      where: { id },
    })

    if (!existingSeries) {
      return NextResponse.json({ error: '系列不存在' }, { status: 404 })
    }

    // 如果要修改 slug，检查新 slug 是否已被使用
    if (slug && slug !== existingSeries.slug) {
      const slugExists = await prisma.series.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: '该 Slug 已被使用' },
          { status: 409 }
        )
      }
    }

    // 构建更新数据
    const updateData: any = {}
    if (name) updateData.name = name
    if (slug) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (price !== undefined) updateData.price = price
    if (order !== undefined) updateData.order = order
    if (isActive !== undefined) updateData.isActive = isActive

    // 更新系列
    const series = await prisma.series.update({
      where: { id },
      data: updateData,
      include: {
        agents: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: '系列更新成功',
        series,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('更新系列错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/series/[id]
 * 删除系列（软删除，设置 isActive = false）
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    const { id } = await params

    // 检查系列是否存在
    const existingSeries = await prisma.series.findUnique({
      where: { id },
    })

    if (!existingSeries) {
      return NextResponse.json({ error: '系列不存在' }, { status: 404 })
    }

    // 软删除（设置 isActive = false）
    const series = await prisma.series.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(
      {
        success: true,
        message: '系列删除成功',
        series,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('删除系列错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
