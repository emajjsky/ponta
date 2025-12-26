import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import {
  Users,
  Package,
  ShoppingCart,
  KeySquare,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react'
import Link from 'next/link'

/**
 * 后台管理页面
 */
export default async function AdminPage() {
  // 验证管理员权限
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/login')
  }

  let payload
  try {
    payload = await verifyToken(token)
  } catch (error) {
    redirect('/login')
  }

  // 检查是否为管理员
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    redirect('/?error=no_permission')
  }

  // 获取统计数据
  const [
    totalUsers,
    totalAgents,
    totalOrders,
    totalActivationCodes,
    activeUsers,
    usedActivationCodes,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.activationCode.count(),
    prisma.user.count({
      where: {
        userAgents: {
          some: {
            activatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    }),
    prisma.activationCode.count({ where: { status: 'ACTIVATED' } }),
    prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }).then((result) => result._sum.amount || 0),
  ])

  const stats = [
    {
      title: '总用户数',
      value: totalUsers,
      active: activeUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/admin/users',
    },
    {
      title: '智能体数',
      value: totalAgents,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/admin/agents',
    },
    {
      title: '订单数',
      value: totalOrders,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/admin/orders',
    },
    {
      title: '激活码',
      value: totalActivationCodes,
      active: usedActivationCodes,
      icon: KeySquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/admin/activation-codes',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">后台管理</h1>
          <p className="text-muted-foreground">管理智能体、用户、订单和激活码</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    {stat.active !== undefined && (
                      <Badge variant="secondary">
                        {stat.active} 活跃
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 收入统计 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              总收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">
              ¥{totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              已完成订单的总金额
            </p>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/admin/users">
                  <Users className="w-4 h-4 mr-2" />
                  管理用户
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/agents">
                  <Package className="w-4 h-4 mr-2" />
                  管理智能体
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">数据库状态</span>
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API 状态</span>
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Coze API</span>
                  <Badge className="bg-blue-100 text-blue-800">已配置</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
