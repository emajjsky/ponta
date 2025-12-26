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

interface Agent {
  id: string
  name: string
  slug: string
  botId: string
  description: string
  price: number
  stock: number
  abilities: string[]
  systemPrompt: string
  isActive: boolean
}

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    botId: '',
    description: '',
    price: '',
    stock: '',
    abilities: '',
    systemPrompt: '',
    isActive: true,
  })

  useEffect(() => {
    fetchAgent()
  }, [params.id])

  const fetchAgent = async () => {
    try {
      const res = await fetch(`/api/admin/agents/${params.id}`)
      const data = await res.json()
      if (data.success) {
        const agent = data.agent
        setFormData({
          name: agent.name,
          slug: agent.slug,
          botId: agent.botId || '',
          description: agent.description || '',
          price: agent.price.toString(),
          stock: agent.stock.toString(),
          abilities: agent.abilities.join(', '),
          systemPrompt: agent.systemPrompt || '',
          isActive: agent.isActive,
        })
      } else {
        toast.error(data.error || '获取智能体失败')
        router.push('/admin/agents')
      }
    } catch (error) {
      console.error('获取智能体失败:', error)
      toast.error('获取智能体失败')
      router.push('/admin/agents')
    } finally {
      setLoading(false)
    }
  }

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

    setSaving(true)

    try {
      const abilities = formData.abilities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)

      const res = await fetch(`/api/admin/agents/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          botId: formData.botId,
          description: formData.description,
          price: parseInt(formData.price),
          stock: parseInt(formData.stock) || 0,
          abilities,
          systemPrompt: formData.systemPrompt,
          isActive: formData.isActive,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('智能体更新成功！')
        router.push('/admin/agents')
      } else {
        toast.error(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新智能体失败:', error)
      toast.error('更新失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          加载中...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <h1 className="text-3xl font-bold">编辑智能体</h1>
            <p className="text-muted-foreground">修改智能体信息</p>
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
                  名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="例如：编程助手"
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
                  placeholder="例如：coding-assistant"
                  pattern="[a-z0-9-]+"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  只能包含小写字母、数字和连字符，用于URL路径
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Coze Bot ID <span className="text-red-500">*</span>
                </label>
                <Input
                  name="botId"
                  value={formData.botId}
                  onChange={handleChange}
                  placeholder="例如：7428933434510770211"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Coze AI 的 Bot ID，用于连接对话接口
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">描述</label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="描述这个智能体的功能和特点"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>价格与库存</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <label className="block text-sm font-medium mb-2">库存</label>
                <Input
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="100"
                />
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
                  能力标签 <span className="text-red-500">*</span>
                </label>
                <Input
                  name="abilities"
                  value={formData.abilities}
                  onChange={handleChange}
                  placeholder="编程,调试,代码审查"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  用逗号分隔多个能力标签
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  系统提示词
                </label>
                <Textarea
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleChange}
                  placeholder="You are a helpful coding assistant..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  设置智能体的行为和角色
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">上架状态</label>
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
              disabled={saving}
            >
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
