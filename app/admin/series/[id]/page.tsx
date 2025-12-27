'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Navbar } from '@/components/layout/Navbar'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface Series {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  price: number
  order: number
  isActive: boolean
}

export default function EditSeriesPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    coverImage: '',
    price: '59',
    order: '0',
    isActive: true,
  })

  // 加载系列数据
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setFetchLoading(true)
        const res = await fetch(`/api/admin/series/${params.id}`)
        const data = await res.json()

        if (data.success && data.series) {
          const s = data.series
          setFormData({
            name: s.name,
            slug: s.slug,
            description: s.description || '',
            coverImage: s.coverImage || '',
            price: s.price.toString(),
            order: s.order.toString(),
            isActive: s.isActive,
          })
        } else {
          toast.error(data.error || '加载失败')
          router.push('/admin/series')
        }
      } catch (error) {
        console.error('加载系列数据失败:', error)
        toast.error('加载失败')
        router.push('/admin/series')
      } finally {
        setFetchLoading(false)
      }
    }

    fetchSeries()
  }, [params.id, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.slug || !formData.price) {
      toast.error('请填写必填字段')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/series/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          coverImage: formData.coverImage || null,
          price: parseFloat(formData.price),
          order: parseInt(formData.order) || 0,
          isActive: formData.isActive,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('系列更新成功！')
        router.push('/admin/series')
      } else {
        toast.error(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新系列失败:', error)
      toast.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20 text-muted-foreground">
            加载中...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/series')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">编辑系列</h1>
            <p className="text-muted-foreground">修改系列信息</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  系列名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="例如：奥特曼系列"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="例如：ultraman"
                  pattern="[a-z0-9-]+"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  只能包含小写字母、数字和连字符
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  描述
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="描述这个系列的主题和特色"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  封面图片
                </label>
                <ImageUpload
                  value={formData.coverImage}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, coverImage: url }))
                  }
                  label="封面图片"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    价格（元）<span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="59"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    排序顺序
                  </label>
                  <Input
                    name="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    数字越小越靠前
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">立即上架</label>
                  <p className="text-xs text-muted-foreground">
                    关闭后用户将无法在商城看到此系列
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/series')}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
