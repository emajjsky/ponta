import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/activation-codes/status/:status
 * 按状态获取激活码列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ status: string }> }
) {
  try {
    const { status } = await params

    // 验证状态值
    const validStatuses = ['UNUSED', 'ACTIVATED', 'EXPIRED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
    }

    const activationCodes = await prisma.activationCode.findMany({
      where: { status },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(
      {
        success: true,
        activationCodes,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取激活码列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
