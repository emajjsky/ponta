'use client'

import { useEffect, useState } from 'react'
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
  KeySquare,
  Plus,
  Search,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'

interface ActivationCode {
  id: string
  code: string
  status: string
  agentId: string | null
  agent: {
    id: string
    name: string
    slug: string
    seriesId: string | null
    series: {
      id: string
      name: string
    } | null
  } | null
  userId: string | null
  user: {
    id: string
    email: string
    nickname: string
  } | null
  activatedAt: string | null
  createdAt: string
}

interface Series {
  id: string
  name: string
  slug: string
}

export default function AdminActivationCodesPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 批量创建表单
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    seriesId: '',
    agentId: '',
    batchCount: '',
  })

  useEffect(() => {
    fetchCodes()
    fetchAgents()
    fetchSeries()
  }, [statusFilter])

  const fetchCodes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/activation-codes?${params}`)
      const data = await res.json()
      if (data.success) {
        setCodes(data.activationCodes || [])
      } else {
        setCodes([])
      }
    } catch (error) {
      console.error('获取激活码列表失败:', error)
      toast.error('获取激活码列表失败')
      setCodes([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      // 获取所有智能体，不限制数量
      const res = await fetch('/api/agents?limit=1000')
      const data = await res.json()
      if (data.success) {
        setAgents(data.agents)
      }
    } catch (error) {
      console.error('获取智能体列表失败:', error)
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

  const handleCreate = async () => {
    if (!createForm.seriesId || !createForm.agentId || !createForm.batchCount) {
      toast.error('请填写所有字段')
      return
    }

    const count = parseInt(createForm.batchCount)
    if (count < 1 || count > 1000) {
      toast.error('批量生成数量必须在1-1000之间')
      return
    }

    setCreateLoading(true)

    try {
      const res = await fetch('/api/admin/activation-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: createForm.agentId,
          count: count,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`成功创建 ${data.activationCodes.length} 个激活码！`)

        // 下载CSV
        const csvContent = [
          ['激活码', '智能体', '状态'].join(','),
          ...data.activationCodes.map((code: any) =>
            [code.code, code.agent?.name || '未知', code.status === 'UNUSED' ? '未使用' : '已使用'].join(',')
          ),
        ].join('\n')

        // 添加UTF-8 BOM以确保Excel正确显示中文
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `activation-codes-${Date.now()}.csv`
        link.click()

        setShowCreateForm(false)
        setCreateForm({ seriesId: '', agentId: '', batchCount: '' })
        fetchCodes()
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建激活码失败:', error)
      toast.error('创建失败')
    } finally {
      setCreateLoading(false)
    }
  }

  const filteredCodes = codes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (code.agent?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (code.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <h1 className="text-3xl font-bold">激活码管理</h1>
              <p className="text-muted-foreground">管理所有激活码</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            批量创建
          </Button>
        </div>

        {/* 创建表单 */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>批量创建激活码</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 系列选择 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  选择系列 <span className="text-red-500">*</span>
                </label>
                <Select
                  value={createForm.seriesId}
                  onValueChange={(value) => {
                    setCreateForm((prev) => ({ ...prev, seriesId: value, agentId: '' }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="先选择系列" />
                  </SelectTrigger>
                  <SelectContent>
                    {series.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 智能体选择 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  关联智能体 <span className="text-red-500">*</span>
                </label>
                <Select
                  value={createForm.agentId}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, agentId: value }))
                  }
                  disabled={!createForm.seriesId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={createForm.seriesId ? "选择智能体" : "请先选择系列"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents
                      .filter((agent) => agent.seriesId === createForm.seriesId)
                      .map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} (¥{agent.price})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {createForm.seriesId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    该系列共有 {agents.filter((a) => a.seriesId === createForm.seriesId).length} 个角色
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  生成数量 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={createForm.batchCount}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      batchCount: e.target.value,
                    }))
                  }
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  最多一次生成1000个
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={createLoading}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {createLoading ? '生成中...' : '生成并下载'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateForm({ seriesId: '', agentId: '', batchCount: '' })
                  }}
                  disabled={createLoading}
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 筛选栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜索激活码、智能体或用户..."
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
                  <SelectItem value="UNUSED">未使用</SelectItem>
                  <SelectItem value="ACTIVATED">已激活</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 激活码列表 */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              加载中...
            </CardContent>
          </Card>
        ) : filteredCodes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? '没有找到匹配的激活码'
                : '还没有激活码，点击右上角创建吧！'}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4">激活码</th>
                    <th className="p-4">智能体</th>
                    <th className="p-4">使用用户</th>
                    <th className="p-4">状态</th>
                    <th className="p-4">创建时间</th>
                    <th className="p-4">激活时间</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.map((code) => (
                    <tr key={code.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-mono text-sm">{code.code}</td>
                      <td className="p-4">
                        {code.agent ? (
                          <div>
                            <div className="font-medium">{code.agent.name}</div>
                            <div className="text-xs text-muted-foreground">
                              /{code.agent.slug}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">未绑定</span>
                        )}
                      </td>
                      <td className="p-4">
                        {code.user ? (
                          <div>
                            <div className="font-medium">{code.user.nickname}</div>
                            <div className="text-xs text-muted-foreground">
                              {code.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={code.status === 'ACTIVATED' ? 'default' : 'secondary'}
                        >
                          {code.status === 'ACTIVATED' ? '已激活' : '未使用'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(code.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-sm">
                        {code.activatedAt
                          ? new Date(code.activatedAt).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
