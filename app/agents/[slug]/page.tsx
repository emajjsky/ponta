import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Star, Sparkles, ShoppingCart, ExternalLink } from 'lucide-react'

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
    include: {
      series: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
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
                <h2 className="text-2xl font-bold">如何激活</h2>

                <div className="space-y-3 text-muted-foreground">
                  <p>
                    获得这个AI智能体伙伴，需要通过<strong>系列盲盒</strong>或<strong>激活码</strong>！
                  </p>
                  <p>激活流程：</p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>前往商城，选择对应的系列盲盒</li>
                    <li>购买系列盲盒，随机获得该系列中的一个智能体</li>
                    <li>收到实物盲盒后，刮开卡片上的激活码</li>
                    <li>在网站<strong>激活页面</strong>输入激活码</li>
                    <li>激活成功后，即可开始与 AI 智能体对话！</li>
                  </ol>
                  <p className="text-sm italic">
                    注：每个激活码唯一且激活后永久有效。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：系列信息 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-6">
                {/* 所属系列 */}
                {agent.seriesId && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">所属系列</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/shop/series/${agent.series?.slug || ''}`}>
                      查看{agent.series?.name || ''}系列
                    </Link>
                  </Button>
                </div>
                )}

                {/* 稀有度 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">稀有度</p>
                  <Badge className={`${rarityConfig.badgeColor} border-0 text-base px-4 py-1`}>
                    <RarityIcon className="w-4 h-4 mr-2" />
                    {rarityConfig.label}
                  </Badge>
                </div>

                {/* 提示信息 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 提示：</strong>
                    <br />
                    通过激活码激活后，可永久使用此智能体进行对话！
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
