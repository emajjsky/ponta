import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Star, Sparkles, ShoppingCart, ExternalLink } from 'lucide-react'
import { AgentCard } from '@/components/shop/AgentCard'

/**
 * 稀有度配置
 */
const RARITY_CONFIG = {
  STANDARD: {
    label: '标准款',
    icon: Star,
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  HIDDEN: {
    label: '隐藏款',
    icon: Sparkles,
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
} as const

/**
 * 智能体详情页面
 */
export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // 查询智能体详情
  const agent = await prisma.agent.findUnique({
    where: { slug },
  })

  // 智能体不存在或已删除
  if (!agent || agent.deletedAt) {
    notFound()
  }

  // 解析 abilities JSON 字符串
  const abilities = JSON.parse(agent.abilities) as string[]

  // 获取稀有度配置
  const rarityConfig = RARITY_CONFIG[agent.rarity as keyof typeof RARITY_CONFIG]
  const RarityIcon = rarityConfig.icon

  // 获取相关推荐（同稀有度的其他智能体）
  const relatedAgents = await prisma.agent.findMany({
    where: {
      rarity: agent.rarity,
      id: { not: agent.id },
      deletedAt: null,
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      rarity: true,
      avatar: true,
      description: true,
      abilities: true,
      price: true,
    },
  })

  // 解析相关智能体的 abilities
  const relatedAgentsParsed = relatedAgents.map((related) => ({
    ...related,
    abilities: JSON.parse(related.abilities),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link href="/shop">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回商城
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：主要信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息卡片 */}
            <Card className={`${rarityConfig.bgColor} ${rarityConfig.borderColor} border-2`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* 头像 */}
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 mx-auto md:mx-0">
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-full h-full object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-xl"
                      />
                    </div>
                  </div>

                  {/* 名称和稀有度 */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <Badge className={`mb-3 ${rarityConfig.badgeColor} border-0`}>
                        <RarityIcon className="w-3 h-3 mr-1" />
                        {rarityConfig.label}
                      </Badge>
                      <h1 className={`text-4xl font-bold ${rarityConfig.textColor}`}>
                        {agent.name}
                      </h1>
                    </div>

                    <p className="text-lg text-muted-foreground">
                      {agent.description}
                    </p>

                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">盲盒价格:</span>
                      <span className={`text-4xl font-bold ${rarityConfig.textColor}`}>
                        ¥{agent.price.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 能力列表卡片 */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">特殊能力</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {abilities.map((ability, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        ✨
                      </div>
                      <span className="font-medium">{ability}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 详细说明卡片 */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold">产品说明</h2>

                <div className="space-y-3 text-muted-foreground">
                  <p>
                    这是一个<strong>实物盲盒产品</strong>，包含一个 NFC 智能卡片。
                  </p>
                  <p>购买流程：</p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>在商城下单购买盲盒</li>
                    <li>等待快递送达，收到实物盲盒</li>
                    <li>打开盲盒，取出 NFC 智能卡片</li>
                    <li>刮开卡片上的激活码</li>
                    <li>在网站激活页面输入激活码</li>
                    <li>激活成功后，即可开始与 AI 智能体对话！</li>
                  </ol>
                  <p className="text-sm italic">
                    注：每个智能体盲盒包含唯一的激活码，激活后永久有效。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：购买区域 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-6">
                {/* 价格 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">盲盒价格</p>
                  <p className={`text-5xl font-bold ${rarityConfig.textColor}`}>
                    ¥{agent.price.toFixed(1)}
                  </p>
                </div>

                {/* 稀有度 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">稀有度</p>
                  <Badge className={`${rarityConfig.badgeColor} border-0 text-base px-4 py-1`}>
                    <RarityIcon className="w-4 h-4 mr-2" />
                    {rarityConfig.label}
                  </Badge>
                </div>

                {/* 购买按钮 */}
                <div className="space-y-3">
                  <Button className="w-full" size="lg" asChild>
                    <a
                      href="https://example.com/buy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      前往购买
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    将跳转到外部购买平台
                  </p>
                </div>

                {/* 温馨提示 */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>温馨提示：</strong>
                    <br />
                    目前商城仅供展示，购买功能即将上线。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 相关推荐 */}
        {relatedAgentsParsed.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">相关推荐</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedAgentsParsed.map((related) => (
                <AgentCard key={related.id} agent={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 生成静态参数（用于静态生成）
 */
export async function generateStaticParams() {
  const agents = await prisma.agent.findMany({
    where: { deletedAt: null },
    select: { slug: true },
  })

  return agents.map((agent) => ({
    slug: agent.slug,
  }))
}

/**
 * 生成元数据
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agent = await prisma.agent.findUnique({
    where: { slug },
    select: { name: true, description: true },
  })

  if (!agent) {
    return {
      title: '智能体不存在 - 碰嗒碰嗒',
    }
  }

  return {
    title: `${agent.name} - 盲盒商城 - 碰嗒碰嗒`,
    description: agent.description,
  }
}
