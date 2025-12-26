'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  Filter,
  Star,
  Sparkles,
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  slug: string
  seriesId: string | null
  series: {
    id: string
    name: string
    slug: string
  } | null
  description: string
  price: number
  stock: number
  abilities: string[]
  rarity: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    userAgentCount: number
  }
}

interface Series {
  id: string
  name: string
  slug: string
}

export default function AdminAgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeries, setSelectedSeries] = useState<string>('all')

  useEffect(() => {
    fetchAgents()
    fetchSeries()
  }, [])

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents')
      const data = await res.json()
      if (data.success) {
        setAgents(data.agents)
      }
    } catch (error) {
      console.error('获取智能体列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/admin/series')
      const data = await res.json()
      if (data.success) {
        setSeries(data.series)
      }
    } catch (error) {
      console.error('获取系列列表失败:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个智能体吗？')) return

    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        alert('删除成功！')
        fetchAgents()
      } else {
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除智能体失败:', error)
      alert('删除失败')
    }
  }

  const filteredAgents = agents.filter((agent) => {
    // 搜索过滤
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.slug.toLowerCase().includes(searchTerm.toLowerCase())

    // 系列过滤
    const matchesSeries =
      selectedSeries === 'all' ||
      (!agent.seriesId && selectedSeries === 'none') ||
      agent.seriesId === selectedSeries

    return matchesSearch && matchesSeries
  })

  // 按系列分组
  const groupedAgents = filteredAgents.reduce((acc, agent) => {
    const seriesId = agent.seriesId || 'none'
    if (!acc[seriesId]) {
      acc[seriesId] = {
        series: agent.series,
        agents: [],
      }
    }
    acc[seriesId].agents.push(agent)
    return acc
  }, {} as Record<string, { series: Agent['series']; agents: Agent[] }>)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                ← 返回后台
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">智能体管理</h1>
              <p className="text-muted-foreground">管理所有AI智能体</p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/agents/new')}>
            <Plus className="w-4 h-4 mr-2" />
            新建智能体
          </Button>
        </div>

        {/* 搜索和筛选框 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜索智能体名称或Slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 系列筛选 */}
              <div className="w-64">
                <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="筛选系列" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部系列</SelectItem>
                    <SelectItem value="none">未分配系列</SelectItem>
                    {series.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 智能体列表 */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              加载中...
            </CardContent>
          </Card>
        ) : filteredAgents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm || selectedSeries !== 'all'
                ? '没有找到匹配的智能体'
                : '还没有智能体，点击右上角创建吧！'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedAgents).map(([seriesId, group]) => (
              <div key={seriesId}>
                {/* 系列标题 */}
                {selectedSeries === 'all' && (
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      {group.series ? (
                        <>
                          <span>{group.series.name}</span>
                          <Badge variant="outline" className="text-sm">
                            {group.agents.length} 个角色
                          </Badge>
                        </>
                      ) : (
                        <>
                          <span>未分配系列</span>
                          <Badge variant="secondary" className="text-sm">
                            {group.agents.length} 个角色
                          </Badge>
                        </>
                      )}
                    </h2>
                  </div>
                )}

                {/* 该系列下的智能体列表 */}
                <div className="space-y-4">
                  {group.agents.map((agent) => (
                    <Card key={agent.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold">{agent.name}</h3>

                              {/* 系列徽章 */}
                              {agent.series && selectedSeries !== 'all' && (
                                <Badge variant="outline" className="text-xs">
                                  {agent.series.name}
                                </Badge>
                              )}

                              {/* 稀有度徽章 */}
                              {agent.rarity === 'HIDDEN' ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  隐藏款
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  <Star className="w-3 h-3 mr-1" />
                                  标准款
                                </Badge>
                              )}

                              <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                                {agent.isActive ? '已上架' : '已下架'}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">/{agent.slug}</p>

                            <p className="text-sm mb-3 line-clamp-2">{agent.description}</p>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {agent.abilities.slice(0, 3).map((ability, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {ability}
                                </Badge>
                              ))}
                              {agent.abilities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{agent.abilities.length - 3}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <span>库存: {agent.stock}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-green-600 font-semibold">¥{agent.price}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span>{agent._count.userAgentCount} 用户</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/agents/${agent.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(agent.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              删除
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
