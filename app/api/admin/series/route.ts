import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/series
 * 获取所有系列（管理员）
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }

    const series = await prisma.series.findMany({
      where,
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            rarity: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            agents: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(
      {
        success: true,
        series,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('获取系列列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

/**
 * POST /api/admin/series
 * 创建新系列
 *
 * 需要认证：是
 * 需要权限：ADMIN
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

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

    // 参数验证
    if (!name || !slug || !price) {
      return NextResponse.json(
        { error: '名称、Slug和价格为必填项' },
        { status: 400 }
      )
    }

    // 检查 slug 是否已存在
    const existingSeries = await prisma.series.findUnique({
      where: { slug },
    })

    if (existingSeries) {
      return NextResponse.json(
        { error: '该 Slug 已被使用' },
        { status: 409 }
      )
    }

    // 创建系列
    const series = await prisma.series.create({
      data: {
        name,
        slug,
        description: description || '',
        coverImage: coverImage || null,
        price: parseFloat(price),
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        agents: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: '系列创建成功',
        series,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('创建系列错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
