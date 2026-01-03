'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Navbar } from '@/components/layout/Navbar'
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PasswordInput } from '@/components/ui/password-input'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { VoiceTypeSelector } from '@/components/admin/VoiceTypeSelector'

interface Series {
  id: string
  name: string
  slug: string
  price: number
}

export default function NewAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loadingSeries, setLoadingSeries] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    provider: 'COZE' as 'COZE' | 'OPENAI', // AI提供商
    botId: '7428933434510770211', // Coze配置
    apiToken: '', // Coze配置
    endpoint: '', // OpenAI配置
    apiKey: '', // OpenAI配置
    model: '', // OpenAI配置
    seriesId: '',
    avatar: '',
    rarity: 'STANDARD',
    description: '',
    abilities: '',
    systemPrompt: '',
    voiceType: '7426720361753903141', // 默认音色（Coze的爽快思思）
    isActive: true,
  })

  // 默认配置（从API加载）
  const [defaultConfig, setDefaultConfig] = useState<any>(null)

  // 加载系列列表和默认配置
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingSeries(true)

        // 加载系列列表
        const seriesRes = await fetch('/api/admin/series?includeInactive=true')
        const seriesData = await seriesRes.json()
        if (seriesData.success) {
          setSeriesList(seriesData.series)
        }

        // 加载默认配置
        const configRes = await fetch('/api/admin/default-config')
        const configData = await configRes.json()
        if (configData.success) {
          setDefaultConfig(configData.config)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setLoadingSeries(false)
      }
    }

    loadData()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 处理系列选择
  const handleSeriesChange = (value: string) => {
    setFormData((prev) => ({ ...prev, seriesId: value }))
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

  // 处理provider切换，自动填充默认值和切换音色体系
  const handleProviderChange = (value: 'COZE' | 'OPENAI') => {
    setFormData((prev) => {
      const newFormData = { ...prev, provider: value }

      // 如果切换到OpenAI且有默认配置，自动填充
      if (value === 'OPENAI' && defaultConfig?.openai) {
        newFormData.endpoint = prev.endpoint || defaultConfig.openai.endpoint
        newFormData.apiKey = prev.apiKey || defaultConfig.openai.apiKey
        newFormData.model = prev.model || defaultConfig.openai.model
        // 切换到火山引擎音色（voice_type格式）
        newFormData.voiceType = 'zh_female_shuangkuaisisi_moon_bigtts'
      }

      // 如果切换到Coze且有默认配置，自动填充
      if (value === 'COZE' && defaultConfig?.coze) {
        newFormData.botId = prev.botId || defaultConfig.coze.botId
        newFormData.apiToken = prev.apiToken || defaultConfig.coze.apiToken
        // 切换到Coze音色（voice_id格式）
        newFormData.voiceType = '7426720361753903141' // 爽快思思
      }

      return newFormData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.slug) {
      toast.error('请填写必填字段')
      return
    }

    // 验证provider配置
    if (formData.provider === 'COZE' && !formData.botId) {
      toast.error('请填写Coze Bot ID')
      return
    }

    if (formData.provider === 'OPENAI' && (!formData.endpoint || !formData.apiKey || !formData.model)) {
      toast.error('请填写完整的OpenAI配置（endpoint、apiKey、model）')
      return
    }

    setLoading(true)

    try {
      const abilities = formData.abilities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)

      // 构建providerConfig
      let providerConfig = {}

      if (formData.provider === 'COZE') {
        providerConfig = {
          botId: formData.botId,
          apiToken: formData.apiToken || process.env.COZE_API_TOKEN || '',
        }
      } else if (formData.provider === 'OPENAI') {
        providerConfig = {
          endpoint: formData.endpoint,
          apiKey: formData.apiKey,
          model: formData.model,
        }
      }

      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          provider: formData.provider,
          providerConfig: JSON.stringify(providerConfig),
          seriesId: formData.seriesId || null,
          avatar: formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.slug}`,
          description: formData.description || `${formData.name} - AI智能体助手`,
          price: 0,
          stock: 0,
          abilities,
          systemPrompt: formData.systemPrompt,
          voiceType: formData.voiceType, // 添加音色配置
          isActive: formData.isActive,
          rarity: formData.rarity,
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
          {/* AI Provider 配置 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI 接入方式</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  AI 提供商 <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.provider}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择AI提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COZE">
                      Coze（推荐，支持语音、视频等多模态）
                    </SelectItem>
                    <SelectItem value="OPENAI">
                      OpenAI 兼容接口（SiliconFlow、DeepSeek、Gemini等）
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.provider === 'COZE'
                    ? 'Coze提供完整的多模态支持，包括语音、视频对话'
                    : '支持所有兼容OpenAI API的服务商，仅支持文本对话'
                  }
                </p>
              </div>

              {formData.provider === 'COZE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Coze Bot ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="botId"
                      value={formData.botId}
                      onChange={handleChange}
                      placeholder="7428933434510770211"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      你的Coze智能体Bot ID
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API Token（可选）
                    </label>
                    <PasswordInput
                      name="apiToken"
                      value={formData.apiToken}
                      onChange={handleChange}
                      placeholder="留空使用环境变量 COZE_API_TOKEN"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      留空将使用环境变量中的默认Token
                    </p>
                  </div>
                </>
              )}

              {formData.provider === 'OPENAI' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API Endpoint <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="endpoint"
                      value={formData.endpoint}
                      onChange={handleChange}
                      placeholder="https://api.siliconflow.cn/v1/chat/completions"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      OpenAI兼容的API端点地址
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <PasswordInput
                      name="apiKey"
                      value={formData.apiKey}
                      onChange={handleChange}
                      placeholder="sk-xxx..."
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      API密钥
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="deepseek-chat"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      模型名称，例如：deepseek-chat、gpt-4、gemini-pro
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  所属系列
                </label>
                <Select
                  value={formData.seriesId || "none"}
                  onValueChange={(value) =>
                    handleSeriesChange(value === "none" ? "" : value)
                  }
                  disabled={loadingSeries}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingSeries
                          ? '加载系列列表中...'
                          : '请选择系列（可选）'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不归属于任何系列</SelectItem>
                    {seriesList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} (¥{s.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  如果不选择系列，该智能体将单独售卖
                </p>
              </div>

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
                  稀有度
                </label>
                <Select
                  value={formData.rarity}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, rarity: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择稀有度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">普通（STANDARD）</SelectItem>
                    <SelectItem value="HIDDEN">隐藏（HIDDEN）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  普通：容易抽到 | 隐藏：稀有，抽到概率低
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  头像图片
                </label>
                <ImageUpload
                  value={formData.avatar}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, avatar: url }))
                  }
                  label="头像图片"
                  placeholder="https://example.com/avatar.png"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  留空将使用自动生成的头像
                </p>
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

              {formData.provider === 'OPENAI' && (
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
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  语音合成音色
                </label>
                <VoiceTypeSelector
                  provider={formData.provider}
                  value={formData.voiceType}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, voiceType: value }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.provider === 'COZE'
                    ? 'Coze API的音色列表（使用Coze voice_id）'
                    : '火山引擎的音色列表（使用voice_type）'}
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
