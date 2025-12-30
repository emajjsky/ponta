'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Search, Sparkles, ArrowRight, Package, ShoppingBag, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Agent {
  id: string
  name: string
  avatar: string
  rarity: string
  series?: {
    id: string
    name: string
  } | null
}

interface User {
  id: string
  uid: number
  nickname: string
  avatar?: string | null
}

interface ExchangeItem {
  id: string
  user: User
  providedAgent: Agent
  wantedAgent: Agent
  status: string
  hasProposed: boolean
  createdAt: Date
}

interface ExchangeMarketClientProps {
  initialExchanges: ExchangeItem[]
  agents: Agent[]
  series: {
    id: string
    name: string
  }[]
}

export function ExchangeMarketClient({
  initialExchanges,
  agents,
  series,
}: ExchangeMarketClientProps) {
  const router = useRouter()
  const [exchanges, setExchanges] = useState<ExchangeItem[]>(initialExchanges)
  const [loading, setLoading] = useState(false)
  const [searchAgent, setSearchAgent] = useState('')
  const [filterSeries, setFilterSeries] = useState('')

  const [selectedExchange, setSelectedExchange] = useState<ExchangeItem | null>(null)
  const [selectedMyCode, setSelectedMyCode] = useState('')
  const [verifyingCode, setVerifyingCode] = useState(false)

  /**
   * 筛选交易市场
   */
  const filteredExchanges = exchanges.filter((exchange) => {
    // 按系列筛选
    if (filterSeries && exchange.wantedAgent.series?.id !== filterSeries) {
      return false
    }

    // 按智能体搜索
    if (searchAgent) {
      const searchLower = searchAgent.toLowerCase()
      return (
        exchange.wantedAgent.name.toLowerCase().includes(searchLower) ||
        exchange.providedAgent.name.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  /**
   * 直接完成交换（无需对方确认）
   */
  const handleDirectTrade = async () => {
    if (!selectedExchange || !selectedMyCode) {
      toast.error('请选择要交换的对象和您的激活码')
      return
    }

    setLoading(true)

    try {
      // 先验证激活码
      setVerifyingCode(true)
      const verifyResponse = await fetch('/api/exchange/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: selectedMyCode }),
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResult.success || !verifyResult.canPublish) {
        toast.error(verifyResult.error || verifyResult.statusMessage || '激活码验证失败')
        setVerifyingCode(false)
        setLoading(false)
        return
      }

      setVerifyingCode(false)

      // 验证智能体是否匹配
      if (verifyResult.agent.id !== selectedExchange.wantedAgent.id) {
        toast.error(
          `您提供的激活码是【${verifyResult.agent.name}】，但对方想要的是【${selectedExchange.wantedAgent.name}】`
        )
        setLoading(false)
        return
      }

      // 直接完成交换（无需对方确认）
      const response = await fetch('/api/exchange/direct-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchangeId: selectedExchange.id,
          code: selectedMyCode,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('交换成功！您已获得新的智能体')
        setSelectedExchange(null)
        setSelectedMyCode('')
        // 重新加载市场列表
        window.location.reload()
      } else {
        toast.error(result.error || '交换失败')
      }
    } catch (error: any) {
      console.error('直接交换错误:', error)
      toast.error(error.message || '交换失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 页面标题 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">交易市场</h1>
                <p className="text-muted-foreground mt-2">与其他用户交换重复的盲盒激活码</p>
              </div>
            </div>

            {/* 右侧按钮组 */}
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/exchange/my">
                  <Package className="w-4 h-4 mr-2" />
                  我的交易
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/exchange/publish">
                  <Send className="w-4 h-4 mr-2" />
                  发布交换
                </Link>
              </Button>
              <Button asChild>
                <Link href="/shop">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  前往商城
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">搜索智能体</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索想要的智能体..."
                    value={searchAgent}
                    onChange={(e) => setSearchAgent(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">筛选系列</label>
                <select
                  value={filterSeries}
                  onChange={(e) => setFilterSeries(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">全部系列</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 交换列表 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExchanges.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无交换信息</p>
            </div>
          ) : (
            filteredExchanges.map((exchange) => (
              <Card key={exchange.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={exchange.user.avatar || undefined} />
                      <AvatarFallback>{exchange.user.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exchange.user.nickname}</p>
                      <p className="text-xs text-muted-foreground">UID: {exchange.user.uid}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 提供的智能体 */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={exchange.providedAgent.avatar}
                        alt={exchange.providedAgent.name}
                        fill
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exchange.providedAgent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {exchange.providedAgent.series?.name || '无系列'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        exchange.providedAgent.rarity === 'HIDDEN' ? 'default' : 'secondary'
                      }
                    >
                      {exchange.providedAgent.rarity === 'HIDDEN' ? '隐藏' : '标准'}
                    </Badge>
                  </div>

                  {/* 箭头 */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* 想要的智能体 */}
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={exchange.wantedAgent.avatar}
                        alt={exchange.wantedAgent.name}
                        fill
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exchange.wantedAgent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {exchange.wantedAgent.series?.name || '无系列'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        exchange.wantedAgent.rarity === 'HIDDEN' ? 'default' : 'secondary'
                      }
                    >
                      {exchange.wantedAgent.rarity === 'HIDDEN' ? '隐藏' : '标准'}
                    </Badge>
                  </div>

                  {/* 操作按钮 */}
                  {selectedExchange?.id === exchange.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="输入您的激活码"
                        value={selectedMyCode}
                        onChange={(e) => setSelectedMyCode(e.target.value)}
                        disabled={loading || verifyingCode}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && selectedMyCode && !verifyingCode) {
                            handleDirectTrade()
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleDirectTrade}
                          disabled={loading || verifyingCode || !selectedMyCode}
                          className="flex-1"
                        >
                          {loading || verifyingCode ? '处理中...' : '立即交换'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedExchange(null)
                            setSelectedMyCode('')
                          }}
                          disabled={loading}
                        >
                          取消
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        点击"立即交换"后将自动完成交易，无需对方确认
                      </p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSelectedExchange(exchange)}
                      disabled={exchange.status !== 'PENDING'}
                      className="w-full"
                    >
                      {exchange.status === 'PENDING' ? '立即交换' : '已交易'}
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    {new Date(exchange.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
