import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * DELETE /api/exchange/cancel
 * 撤回已发布的交换
 *
 * 需要认证：是
 * Request Body:
 *   exchangeId: string - 交换信息ID
 *
 * 逻辑：
 * 1. 验证交换是否属于当前用户
 * 2. 验证交换状态（只能撤回PENDING状态）
 * 3. 检查是否有待处理的交换请求
 * 4. 删除交换记录
 */
export async function DELETE(request: NextRequest) {
  try {
    // 从 Cookie 中获取 Token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录，请先登录' }, { status: 401 })
    }

    // 验证 Token
    let payload
    try {
      payload = await verifyToken(token)
    } catch (error) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
    }

    // 获取请求体
    const body = await request.json()
    const { exchangeId } = body

    // 参数验证
    if (!exchangeId || typeof exchangeId !== 'string') {
      return NextResponse.json({ error: '交换信息ID不能为空' }, { status: 400 })
    }

    // 查询交换信息
    const exchange = await prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        proposals: {
          where: {
            status: 'PENDING',
          },
        },
      },
    })

    if (!exchange) {
      return NextResponse.json({ error: '交换信息不存在' }, { status: 404 })
    }

    // 验证是否是交换发布者
    if (exchange.userId !== payload.userId) {
      return NextResponse.json({
        error: '只能撤回自己发布的交换'
      }, { status: 403 })
    }

    // 验证状态
    if (exchange.status !== 'PENDING') {
      return NextResponse.json({
        error: '只能撤回待交易状态的交换，已交易或已完成的交换无法撤回'
      }, { status: 400 })
    }

    // 检查是否有待处理的交换请求
    if (exchange.proposals.length > 0) {
      return NextResponse.json({
        error: `该交换有 ${exchange.proposals.length} 个待处理的请求，请先处理这些请求后再撤回`
      }, { status: 400 })
    }

    // 删除交换记录
    await prisma.exchange.delete({
      where: { id: exchangeId },
    })

    return NextResponse.json({
      success: true,
      message: '已成功撤回该交换信息',
    })
  } catch (error) {
    console.error('撤回交换信息错误:', error)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
