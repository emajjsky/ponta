'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Navbar } from '@/components/layout/Navbar'
import { ArrowLeft, Save, Image as ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/admin/ImageUpload'

export default function NewSeriesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    coverImage: '',
    price: '59',
    order: '0',
    isActive: true,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 根据名称自动生成slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.slug || !formData.price) {
      toast.error('请填写必填字段')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/series', {
        method: 'POST',
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
        toast.success('系列创建成功！')
        router.push('/admin/series')
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建系列失败:', error)
      toast.error('创建失败')
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-3xl font-bold">新建系列</h1>
            <p className="text-muted-foreground">创建新的盲盒系列</p>
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
                  onChange={handleNameChange}
                  placeholder="例如：奥特曼系列"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Slug会自动生成，也可以手动修改
                </p>
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
