'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Package, Send, Check, X, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
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

interface MyExchangeItem {
  id: string
  providedAgent: Agent
  wantedAgent: Agent
  status: string
  proposalCount: number
  pendingProposals: any[]
  createdAt: Date
}

interface MyProposalItem {
  id: string
  status: string
  myAgent: Agent
  wantedAgent: Agent
  publisher: User
  providedAgent: Agent
  exchangeStatus: string
  createdAt: Date
}

export function MyExchangeClient() {
  const [myExchanges, setMyExchanges] = useState<MyExchangeItem[]>([])
  const [myProposals, setMyProposals] = useState<MyProposalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [handling, setHandling] = useState(false)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/exchange/my')
        const result = await response.json()

        if (result.success) {
          setMyExchanges(result.myExchanges || [])
          setMyProposals(result.myProposals || [])
        }
      } catch (error) {
        console.error('加载交易数据错误:', error)
        toast.error('加载数据失败')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  /**
   * 处理交换请求（接受/拒绝）
   */
  const handleProposal = async (proposalId: string, action: 'accept' | 'reject') => {
    setHandling(true)

    try {
      const response = await fetch('/api/exchange/handle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposalId,
          action,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || '操作成功')
        // 重新加载数据
        window.location.reload()
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error: any) {
      console.error('处理交换请求错误:', error)
      toast.error(error.message || '操作失败，请稍后重试')
    } finally {
      setHandling(false)
    }
  }

  /**
   * 撤回发布的交换
   */
  const handleCancelExchange = async (exchangeId: string) => {
    if (!confirm('确定要撤回这个交换吗？撤回后需要重新发布才能在交易市场显示。')) {
      return
    }

    setHandling(true)

    try {
      const response = await fetch('/api/exchange/cancel', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exchangeId }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('撤回成功')
        // 重新加载数据
        window.location.reload()
      } else {
        toast.error(result.error || '撤回失败')
      }
    } catch (error: any) {
      console.error('撤回交换错误:', error)
      toast.error(error.message || '撤回失败，请稍后重试')
    } finally {
      setHandling(false)
    }
  }

  /**
   * 获取状态徽章
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">待交易</Badge>
      case 'TRADING':
        return <Badge className="bg-blue-500">交易中</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-500">已完成</Badge>
      case 'CANCELLED':
        return <Badge variant="outline">已取消</Badge>
      case 'ACCEPTED':
        return <Badge className="bg-green-500">已接受</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">已拒绝</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 页面标题 */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">我的交易</h1>
          <p className="text-muted-foreground mt-2">管理我发布的交换和发起的交换请求</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="published" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="published">
                我的发布 ({myExchanges.filter((e) => e.status === 'PENDING').length})
              </TabsTrigger>
              <TabsTrigger value="history">
                交易历史 ({myProposals.length + myExchanges.filter((e) => e.status !== 'PENDING').length})
              </TabsTrigger>
            </TabsList>

            {/* 我发布的交换 */}
            <TabsContent value="published" className="space-y-4">
              {myExchanges.filter((e) => e.status === 'PENDING').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>您当前没有待交易的交换信息</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/exchange/publish">去发布交换</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myExchanges
                  .filter((e) => e.status === 'PENDING')
                  .map((exchange) => (
                    <Card key={exchange.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            交换信息 {getStatusBadge(exchange.status)}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {new Date(exchange.createdAt).toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelExchange(exchange.id)}
                              disabled={handling}
                            >
                              撤回
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 交换内容 */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">我提供</p>
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                  src={exchange.providedAgent.avatar}
                                  alt={exchange.providedAgent.name}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {exchange.providedAgent.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {exchange.providedAgent.series?.name || '无系列'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-primary/10 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">我想要</p>
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                  src={exchange.wantedAgent.avatar}
                                  alt={exchange.wantedAgent.name}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {exchange.wantedAgent.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {exchange.wantedAgent.series?.name || '无系列'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 收到的请求 */}
                        {exchange.pendingProposals.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <p className="text-sm font-medium">
                              收到 {exchange.pendingProposals.length} 个交换请求：
                            </p>
                            {exchange.pendingProposals.map((proposal: any) => (
                              <div
                                key={proposal.id}
                                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage
                                      src={proposal.proposer.avatar || undefined}
                                    />
                                    <AvatarFallback>
                                      {proposal.proposer.nickname[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {proposal.proposer.nickname}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      提供：{proposal.proposerCode.agent.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleProposal(proposal.id, 'reject')}
                                    disabled={handling}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleProposal(proposal.id, 'accept')}
                                    disabled={handling}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {exchange.proposalCount === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            暂无交换请求
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            {/* 交易历史 */}
            <TabsContent value="history" className="space-y-4">
              {myProposals.length === 0 &&
              myExchanges.filter((e) => e.status !== 'PENDING').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无交易历史</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/exchange/market">去交易市场</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* 我发起的请求历史 */}
                  {myProposals.map((proposal) => (
                    <Card key={proposal.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            发起的请求 {getStatusBadge(proposal.status)}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {new Date(proposal.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 交换内容 */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">我提供</p>
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                  src={proposal.myAgent.avatar}
                                  alt={proposal.myAgent.name}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {proposal.myAgent.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {proposal.myAgent.series?.name || '无系列'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">对方提供</p>
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                  src={proposal.providedAgent.avatar}
                                  alt={proposal.providedAgent.name}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {proposal.providedAgent.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {proposal.providedAgent.series?.name || '无系列'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 对方信息 */}
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={proposal.publisher.avatar || undefined} />
                            <AvatarFallback>{proposal.publisher.nickname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              与 {proposal.publisher.nickname} 交换
                            </p>
                            <p className="text-xs text-muted-foreground">
                              UID: {proposal.publisher.uid}
                            </p>
                          </div>
                          {proposal.status === 'PENDING' && (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              等待确认
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* 我发布的已完成/已取消记录 */}
                  {myExchanges
                    .filter((e) => e.status !== 'PENDING')
                    .map((exchange) => (
                      <Card key={exchange.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              发布的交换 {getStatusBadge(exchange.status)}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {new Date(exchange.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* 交换内容 */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-2">我提供</p>
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 flex-shrink-0">
                                  <Image
                                    src={exchange.providedAgent.avatar}
                                    alt={exchange.providedAgent.name}
                                    fill
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {exchange.providedAgent.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {exchange.providedAgent.series?.name || '无系列'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-primary/10 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-2">我想要</p>
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 flex-shrink-0">
                                  <Image
                                    src={exchange.wantedAgent.avatar}
                                    alt={exchange.wantedAgent.name}
                                    fill
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {exchange.wantedAgent.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {exchange.wantedAgent.series?.name || '无系列'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 处理结果 */}
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm">
                              {exchange.status === 'COMPLETED' && '✅ 交换成功完成'}
                              {exchange.status === 'CANCELLED' && '❌ 已撤回'}
                              {exchange.status === 'TRADING' && '🔄 正在交易中'}
                              {exchange.proposalCount > 0 &&
                                `（收到 ${exchange.proposalCount} 个请求）`}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
