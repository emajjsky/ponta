'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Navbar } from '@/components/layout/Navbar'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function NewAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    botId: '7428933434510770211',
    description: '',
    price: '29.9',
    stock: '100',
    abilities: '',
    systemPrompt: '',
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
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
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
      const abilities = formData.abilities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)

      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          botId: formData.botId,
          description: formData.description || `${formData.name} - AI智能体助手`,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock) || 100,
          abilities,
          systemPrompt: formData.systemPrompt,
          isActive: formData.isActive,
          // 自动生成的值
          rarity: 'STANDARD',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.slug}`,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('智能体创建成功！')
        router.push('/admin/agents')
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建智能体失败:', error)
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
            onClick={() => router.push('/admin/agents')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">新建智能体</h1>
            <p className="text-muted-foreground">创建新的AI智能体（基于Coze API）</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Coze API配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Coze Bot ID <span className="text-red-500">*</span>
                </label>
                <Input
                  name="botId"
                  value={formData.botId || '7428933434510770211'}
                  onChange={handleChange}
                  placeholder="7428933434510770211"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  你的Coze智能体Bot ID，用于对话功能
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  智能体名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="例如：编程助手"
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
                  placeholder="例如：coding-assistant"
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
                  placeholder="描述这个智能体的功能和特点"
                  rows={2}
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
                    placeholder="9.90"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    库存
                  </label>
                  <Input
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>能力与配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  能力标签
                </label>
                <Input
                  name="abilities"
                  value={formData.abilities}
                  onChange={handleChange}
                  placeholder="编程,调试,代码审查"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  用逗号分隔多个能力标签
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  系统提示词（System Prompt）
                </label>
                <Textarea
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleChange}
                  placeholder="You are a helpful coding assistant..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  设置智能体的行为和角色，留空使用默认配置
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">立即上架</label>
                  <p className="text-xs text-muted-foreground">
                    关闭后用户将无法在商城看到此智能体
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
              onClick={() => router.push('/admin/agents')}
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
