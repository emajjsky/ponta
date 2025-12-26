import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingBag, Star, Sparkles } from 'lucide-react'
import prisma from '@/lib/prisma'
import { AgentCard } from '@/components/shop/AgentCard'

interface SeriesDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function SeriesDetailPage({
  params,
}: SeriesDetailPageProps) {
  const { slug } = await params

  // 获取系列详情
  const series = await prisma.series.findUnique({
    where: {
      slug,
      isActive: true,
    },
    include: {
      agents: {
        where: {
          deletedAt: null,
          isActive: true,
        },
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
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!series) {
    notFound()
  }

  // 解析 abilities
  const agentsWithParsedAbilities = series.agents.map((agent) => ({
    ...agent,
    abilities: JSON.parse(agent.abilities),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* 返回按钮 */}
            <div className="flex justify-start">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/shop">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回商城
                </Link>
              </Button>
            </div>

            {/* 系列标题 */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold animate-collision">
                {series.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {series.description}
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{agentsWithParsedAbilities.length} 个角色</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-sm">
                  <span className="text-2xl">💰</span>
                  <span className="font-bold text-lg">¥{series.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 角色展示 */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">系列角色</h2>
            <p className="text-muted-foreground">
              点击角色查看详细能力介绍
            </p>
          </div>

          {/* 角色网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {agentsWithParsedAbilities.map((agent) => (
              <AgentCard key={agent.id} agent={agent} showRarity={true} showPrice={false} />
            ))}
          </div>

          {/* 购买说明 */}
          <div className="mt-12 p-8 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border-2 border-primary/20">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">购买盲盒，随机获得其中一个角色！</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                每个盲盒包含该系列中随机一个角色的激活码。
                收到实物盲盒后，刮开包装中的激活码，即可在网站激活对应的AI智能体伙伴！
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>普通款：{agentsWithParsedAbilities.filter((a) => a.rarity === 'STANDARD').length} 个</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>隐藏款：{agentsWithParsedAbilities.filter((a) => a.rarity === 'HIDDEN').length} 个</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 生成静态参数
 */
export async function generateStaticParams() {
  const series = await prisma.series.findMany({
    where: {
      isActive: true,
    },
    select: {
      slug: true,
    },
  })

  return series.map((series) => ({
    slug: series.slug,
  }))
}

/**
 * 生成元数据
 */
export async function generateMetadata({
  params,
}: SeriesDetailPageProps) {
  const { slug } = await params
  const series = await prisma.series.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
    },
  })

  if (!series) {
    return {
      title: '系列不存在 - 碰嗒碰嗒',
    }
  }

  return {
    title: `${series.name} - 碰嗒碰嗒`,
    description: series.description || `购买${series.name}系列盲盒，随机获得独特的AI智能体伙伴！`,
  }
}
