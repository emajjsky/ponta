'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Navbar } from '@/components/layout/Navbar'
import {
  ShoppingCart,
  Search,
  Package,
  User,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'

interface Order {
  id: string
  status: string
  amount: number
  paymentMethod: string
  transactionId: string | null
  createdAt: string
  user: {
    id: string
    email: string
    nickname: string
  }
  agent: {
    id: string
    name: string
    slug: string
    price: number
  }
  activationCode: {
    id: string
    code: string
    status: string
  } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('获取订单列表失败:', error)
      toast.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">待支付</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">订单管理</h1>
          <p className="text-muted-foreground">管理所有订单</p>
        </div>

        {/* 筛选栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜索订单ID、交易号、用户或智能体..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="PENDING">待支付</SelectItem>
                  <SelectItem value="COMPLETED">已完成</SelectItem>
                  <SelectItem value="CANCELLED">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 订单列表 */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              加载中...
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? '没有找到匹配的订单'
                : '还没有订单'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">订单 #{order.id.slice(0, 8)}</h3>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="text-sm text-muted-foreground mb-4">
                        创建于 {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ¥{order.amount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.paymentMethod === 'alipay' ? '支付宝' : '微信支付'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
                    {/* 用户信息 */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="w-4 h-4" />
                        <span>购买用户</span>
                      </div>
                      <div className="font-medium">{order.user.nickname}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.user.email}
                      </div>
                    </div>

                    {/* 智能体信息 */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Package className="w-4 h-4" />
                        <span>购买智能体</span>
                      </div>
                      <div className="font-medium">{order.agent.name}</div>
                      <div className="text-sm text-muted-foreground">
                        /{order.agent.slug} · ¥{order.agent.price}
                      </div>
                    </div>
                  </div>

                  {order.transactionId && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <CreditCard className="w-4 h-4" />
                        <span>交易号</span>
                      </div>
                      <div className="font-mono text-sm">{order.transactionId}</div>
                    </div>
                  )}

                  {order.activationCode && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Package className="w-4 h-4" />
                        <span>关联激活码</span>
                      </div>
                      <div className="font-mono text-sm">{order.activationCode.code}</div>
                      <Badge variant="outline" className="mt-1">
                        {order.activationCode.status === 'ACTIVATED' ? '已激活' : '未使用'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
