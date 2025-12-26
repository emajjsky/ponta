import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/activation-codes
 * 获取所有激活码（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // UNUSED | ACTIVATED | VOID

    const where: any = {}
    if (status) {
      where.status = status
    }

    const activationCodes = await prisma.activationCode.findMany({
      where,
      include: {
        agent: true,
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      {
        success: true,
        activationCodes,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('获取激活码列表错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

/**
 * POST /api/admin/activation-codes
 * 批量创建激活码
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const { agentId, count = 1 } = body

    if (!agentId) {
      return NextResponse.json({ error: '缺少 agentId' }, { status: 400 })
    }

    // 检查智能体是否存在
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    })

    if (!agent) {
      return NextResponse.json({ error: '智能体不存在' }, { status: 404 })
    }

    // 批量创建激活码
    // 新格式：PONTA + 10位随机字符（大写字母和数字）
    const createdCodes = await Promise.all(
      Array.from({ length: count }, async () => {
        // 生成10位随机字符（大写字母和数字）
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let randomChars = ''
        for (let i = 0; i < 10; i++) {
          randomChars += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        const code = `PONTA${randomChars}`

        return await prisma.activationCode.create({
          data: {
            code,
            agentId,
            status: 'UNUSED',
          },
        })
      })
    )

    // 重新查询包含agent信息的激活码
    const activationCodes = await prisma.activationCode.findMany({
      where: {
        id: { in: createdCodes.map(c => c.id) }
      },
      include: {
        agent: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `成功创建 ${count} 个激活码`,
        activationCodes,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }
    console.error('创建激活码错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
