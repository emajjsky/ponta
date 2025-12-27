'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Plus, Pencil, Trash2, Package, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Series {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  price: number
  order: number
  isActive: boolean
  _count: {
    agents: number
  }
}

export default function SeriesListPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  // 加载系列列表
  const loadSeries = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/series?includeInactive=true')
      const data = await res.json()

      if (data.success) {
        setSeries(data.series)
      } else {
        toast.error(data.error || '加载失败')
      }
    } catch (error) {
      console.error('加载系列列表失败:', error)
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换系列状态
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/series/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(!currentStatus ? '系列已上架' : '系列已下架')
        loadSeries()
      } else {
        toast.error(data.error || '操作失败')
      }
    } catch (error) {
      console.error('切换状态失败:', error)
      toast.error('操作失败')
    }
  }

  // 删除系列
  const deleteSeries = async (id: string, name: string) => {
    if (!confirm(`确定要删除系列"${name}"吗？此操作不可恢复！`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/series/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        toast.success('删除成功')
        loadSeries()
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除系列失败:', error)
      toast.error('删除失败')
    }
  }

  useEffect(() => {
    loadSeries()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">系列管理</h1>
            <p className="text-muted-foreground">管理盲盒系列和价格配置</p>
          </div>
          <Button onClick={() => (window.location.href = '/admin/series/new')}>
            <Plus className="w-4 h-4 mr-2" />
            新建系列
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              系列列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-20 text-muted-foreground">
                加载中...
              </div>
            ) : series.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无系列</p>
                <Button
                  className="mt-4"
                  onClick={() => (window.location.href = '/admin/series/new')}
                >
                  创建第一个系列
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排序</TableHead>
                    <TableHead>系列名称</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>智能体数量</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {series.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">
                        {s.order}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{s.name}</div>
                          {s.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-md">
                              {s.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {s.slug}
                      </TableCell>
                      <TableCell>¥{s.price}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {s._count.agents} 个智能体
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(s.id, s.isActive)}
                        >
                          {s.isActive ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              (window.location.href = `/admin/series/${s.id}`)
                            }
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSeries(s.id, s.name)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
