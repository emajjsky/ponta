'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sparkles, Package, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
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

interface Series {
  id: string
  name: string
  agents: Agent[]
}

interface PublishExchangeClientProps {
  agents: Agent[]
  series: Series[]
}

export function PublishExchangeClient({ agents, series }: PublishExchangeClientProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // 验证后的激活码信息
  const [codeInfo, setCodeInfo] = useState<{
    agent: Agent
    status: string
    canPublish: boolean
    statusMessage: string
  } | null>(null)

  /**
   * 验证激活码
   */
  const handleVerifyCode = async () => {
    if (!code.trim()) {
      toast.error('请输入激活码')
      return
    }

    setVerifying(true)
    setCodeInfo(null)

    try {
      const response = await fetch('/api/exchange/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const result = await response.json()

      if (result.success) {
        setCodeInfo(result)

        if (!result.canPublish) {
          toast.error(result.statusMessage || '该激活码无法发布')
        } else {
          toast.success('激活码验证成功！')
        }
      } else {
        toast.error(result.error || '验证失败')
      }
    } catch (error: any) {
      console.error('验证激活码错误:', error)
      toast.error(error.message || '验证失败，请稍后重试')
    } finally {
      setVerifying(false)
    }
  }

  /**
   * 处理系列选择
   */
  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeriesId(seriesId)
    setSelectedAgentId('') // 清空已选择的智能体
  }

  /**
   * 根据系列筛选智能体
   */
  const getFilteredAgents = () => {
    if (!selectedSeriesId) {
      return agents
    }
    return agents.filter((agent) => agent.series?.id === selectedSeriesId)
  }

  const filteredAgents = getFilteredAgents()

  /**
   * 发布到交易市场
   */
  const handlePublish = async () => {
    if (!codeInfo?.canPublish) {
      toast.error('请先验证激活码')
      return
    }

    if (!selectedAgentId) {
      toast.error('请选择想要交换的智能体')
      return
    }

    // 不能交换同一个智能体
    if (selectedAgentId === codeInfo.agent.id) {
      toast.error('不能交换同一个智能体')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/exchange/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          wantedAgentId: selectedAgentId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('发布成功！您的交换信息已上架到交易市场')
        router.push('/exchange/market')
      } else {
        toast.error(result.error || '发布失败')
      }
    } catch (error: any) {
      console.error('发布交换错误:', error)
      toast.error(error.message || '发布失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">发布交换</h1>
          <p className="text-muted-foreground mt-2">将重复的盲盒激活码发布到交易市场</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 左侧：输入激活码 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                第一步：输入激活码
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">激活码</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="请输入激活码"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={verifying || loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyCode()
                      }
                    }}
                  />
                  <Button
                    onClick={handleVerifyCode}
                    disabled={verifying || loading || !code.trim()}
                  >
                    {verifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '验证'
                    )}
                  </Button>
                </div>
              </div>

              {/* 验证结果 */}
              {codeInfo && (
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-3">
                    {codeInfo.canPublish ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      {codeInfo.canPublish ? '验证通过' : '验证失败'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={codeInfo.agent.avatar}
                        alt={codeInfo.agent.name}
                        fill
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{codeInfo.agent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {codeInfo.agent.series?.name || '无系列'}
                      </p>
                      <Badge
                        variant={
                          codeInfo.agent.rarity === 'HIDDEN' ? 'default' : 'secondary'
                        }
                        className="mt-1"
                      >
                        {codeInfo.agent.rarity === 'HIDDEN' ? '隐藏' : '标准'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    {codeInfo.statusMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右侧：选择想要的智能体 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                第二步：选择想要的智能体
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">按系列筛选</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={selectedSeriesId}
                  onChange={(e) => handleSeriesChange(e.target.value)}
                >
                  <option value="">全部系列</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.agents.length}个智能体)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">选择智能体（只能一个）</label>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {filteredAgents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      该系列暂无智能体
                    </p>
                  ) : (
                    filteredAgents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        disabled={!codeInfo?.canPublish}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          selectedAgentId === agent.id
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card hover:bg-muted/50'
                        } ${!codeInfo?.canPublish ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={agent.avatar}
                            alt={agent.name}
                            fill
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium truncate">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {agent.series?.name || '无系列'}
                          </p>
                        </div>
                        <Badge
                          variant={agent.rarity === 'HIDDEN' ? 'default' : 'secondary'}
                        >
                          {agent.rarity === 'HIDDEN' ? '隐藏' : '标准'}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 发布按钮 */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {codeInfo?.canPublish && selectedAgentId ? (
                  <span>
                    用【{codeInfo.agent.name}】交换【
                    {filteredAgents.find((a) => a.id === selectedAgentId)?.name}】
                  </span>
                ) : (
                  <span>请完成上述两个步骤</span>
                )}
              </div>
              <Button
                size="lg"
                onClick={handlePublish}
                disabled={!codeInfo?.canPublish || !selectedAgentId || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    发布中...
                  </>
                ) : (
                  '发布到交易市场'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 提示信息 */}
        <Card className="mt-4 bg-muted/50 border-muted">
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm font-medium text-foreground">📋 发布规则：</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>只能发布您<strong>已激活</strong>过的智能体的重复激活码</li>
              <li>激活码状态必须为<strong>未使用</strong></li>
              <li>激活码必须属于您（通过购买或分配获得）</li>
              <li>发布后其他用户可以在交易市场看到您的交换信息</li>
              <li>您可以随时在"我的交易"中撤回未完成的发布</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
