import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Package, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 稀有度配置
 */
const RARITY_CONFIG = {
  STANDARD: {
    label: '标准款',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  HIDDEN: {
    label: '隐藏款',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
} as const

/**
 * 我的智能体页面
 */
export default async function MyAgentsPage() {
  // 获取 Cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  // 验证 Token
  let payload
  if (!token) {
    redirect('/login')
  }

  try {
    payload = await verifyToken(token)
  } catch (error) {
    redirect('/login')
  }

  // 查询用户的智能体
  const userAgents = await prisma.userAgent.findMany({
    where: {
      userId: payload.userId,
    },
    include: {
      agent: true,
    },
    orderBy: {
      activatedAt: 'desc',
    },
  })

  // 过滤掉已删除的智能体
  const validUserAgents = userAgents.filter((ua) => ua.agent && ua.agent.deletedAt === null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  ← 返回首页
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold mb-2">我的智能体</h1>
            <p className="text-muted-foreground">
              你已激活 <span className="font-semibold text-foreground">{validUserAgents.length}</span> 个 AI 智能体伙伴
            </p>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 空状态 */}
          {validUserAgents.length === 0 && (
            <Card className="text-center py-16">
              <CardContent className="space-y-4">
                <div className="text-6xl">🎁</div>
                <h2 className="text-2xl font-bold">还没有智能体</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  你还没有激活任何 AI 智能体。前往商城购买盲盒，收到后刮开激活码即可激活！
                </p>
                <div className="flex justify-center gap-3 pt-4">
                  <Button asChild>
                    <Link href="/shop">
                      <Package className="w-4 h-4 mr-2" />
                      前往商城
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/activate">
                      立即激活
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 智能体网格 */}
          {validUserAgents.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {validUserAgents.map((userAgent) => {
                const agent = userAgent.agent!
                const rarityConfig = RARITY_CONFIG[agent.rarity as keyof typeof RARITY_CONFIG]

                return (
                  <Card
                    key={userAgent.id}
                    className={`${rarityConfig.bgColor} ${rarityConfig.borderColor} border-2 transition-all hover:shadow-lg`}
                  >
                    <CardContent className="p-6">
                      {/* 头像 */}
                      <div className="flex justify-center mb-4">
                        <div className="relative w-24 h-24">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-full h-full object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
                          />
                        </div>
                      </div>

                      {/* 名称和稀有度 */}
                      <div className="text-center mb-4">
                        <Badge className={`mb-2 ${rarityConfig.badgeColor} border-0`}>
                          {rarityConfig.label}
                        </Badge>
                        <h3 className={`text-xl font-bold ${rarityConfig.textColor}`}>
                          {agent.name}
                        </h3>
                      </div>

                      {/* 描述 */}
                      <p className="text-sm text-muted-foreground text-center line-clamp-2 mb-4">
                        {agent.description}
                      </p>

                      {/* 激活时间 */}
                      <div className="flex items-center justify-center text-xs text-muted-foreground mb-4">
                        <Calendar className="w-3 h-3 mr-1" />
                        激活于 {format(new Date(userAgent.activatedAt), 'PPP', { locale: zhCN })}
                      </div>

                      {/* 操作按钮 */}
                      <div className="space-y-2">
                        <Button className="w-full" asChild>
                          <Link href={`/chat/${agent.slug}`}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            开始对话
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/agents/${agent.slug}`}>
                            查看详情
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* 底部提示 */}
          {validUserAgents.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/shop">
                  <Package className="w-4 h-4 mr-2" />
                  继续收集更多智能体
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
