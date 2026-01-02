import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

/**
 * GET /api/user/addresses
 * 获取用户的所有收货地址
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)

    const addresses = await prisma.address.findMany({
      where: { userId: payload.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      addresses,
    })
  } catch (error: any) {
    console.error('获取收货地址错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

/**
 * POST /api/user/addresses
 * 创建新的收货地址
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    const body = await request.json()
    const { name, phone, province, city, district, detail, isDefault } = body

    // 验证必填字段
    if (!name || !phone || !province || !city || !district || !detail) {
      return NextResponse.json(
        { error: '请填写完整的地址信息' },
        { status: 400 }
      )
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      )
    }

    // 如果设置为默认地址，需要先将其他地址设为非默认
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: payload.userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: payload.userId,
        name,
        phone,
        province,
        city,
        district,
        detail,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({
      success: true,
      address,
      message: '地址添加成功',
    })
  } catch (error: any) {
    console.error('创建收货地址错误:', error)
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
