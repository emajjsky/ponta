import { SeriesList } from '@/components/shop/SeriesList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import prisma from '@/lib/prisma'

export interface Series {
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

/**
 * 动态渲染，不缓存
 * 每次请求都查询数据库，确保新增系列即时显示
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * 盲盒商城页面
 */
export default async function ShopPage() {
  // 服务端获取系列数据
  const seriesList = await prisma.series.findMany({
    where: {
      isActive: true,
    },
    include: {
      _count: {
        select: {
          agents: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* 返回按钮 */}
            <div className="flex justify-start">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Link>
              </Button>
            </div>

            {/* 标题 */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white animate-collision">
              盲盒商城
            </h1>

            {/* 副标题 */}
            <p className="text-lg text-muted-foreground">
              每一个盲盒都藏着一个独特的 AI 智能体伙伴
              <br />
              购买实物盲盒，收到 NFC 卡片，刮开激活码即可唤醒！
            </p>

            {/* 特色标签 */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <span className="text-2xl">🎁</span>
                <span className="text-sm font-medium">实物盲盒</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <span className="text-2xl">📱</span>
                <span className="text-sm font-medium">NFC 一碰激活</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <span className="text-2xl">🤖</span>
                <span className="text-sm font-medium">AI 智能对话</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容：系列列表 */}
      <div className="container mx-auto px-4 py-8">
        <SeriesList initialSeries={seriesList} />
      </div>

      {/* 购买流程说明 */}
      <div className="bg-white dark:bg-gray-900 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              如何激活你的 AI 智能体？
            </h2>

            <div className="grid md:grid-cols-4 gap-6">
              {/* 步骤 1 */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                  1
                </div>
                <h3 className="font-semibold">购买盲盒</h3>
                <p className="text-sm text-muted-foreground">
                  在商城选择喜欢的智能体盲盒下单购买
                </p>
              </div>

              {/* 步骤 2 */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center text-2xl font-bold text-secondary">
                  2
                </div>
                <h3 className="font-semibold">收到盲盒</h3>
                <p className="text-sm text-muted-foreground">
                  等待快递送达，收到实物盲盒包装
                </p>
              </div>

              {/* 步骤 3 */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center text-2xl font-bold text-accent">
                  3
                </div>
                <h3 className="font-semibold">刮开激活码</h3>
                <p className="text-sm text-muted-foreground">
                  打开盲盒，刮开 NFC 卡片上的激活码
                </p>
              </div>

              {/* 步骤 4 */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-dark/10 rounded-full flex items-center justify-center text-2xl font-bold text-dark">
                  4
                </div>
                <h3 className="font-semibold">激活对话</h3>
                <p className="text-sm text-muted-foreground">
                  在网站输入激活码，开始与 AI 智能体对话
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
