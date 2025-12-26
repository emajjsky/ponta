import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Calendar, Sparkles, Star } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 智能体数据接口
 */
export interface Agent {
  id: string
  name: string
  slug: string
  rarity: string
  avatar: string
  description: string
  abilities: string[]
  price: number
}

/**
 * 用户智能体数据接口
 */
export interface UserAgent {
  id: string
  activatedAt: Date
  agent: Agent
}

interface UserCardProps {
  userAgent: UserAgent
}

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
 * 用户智能体卡片组件
 * 展示用户已激活的单个智能体
 */
export function UserCard({ userAgent }: UserCardProps) {
  const agent = userAgent.agent
  const rarityConfig = RARITY_CONFIG[agent.rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.STANDARD
  const RarityIcon = rarityConfig.icon

  return (
    <Card
      className={`${rarityConfig.bgColor} ${rarityConfig.borderColor} border-2 transition-all hover:shadow-xl hover:-translate-y-1`}
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
            <RarityIcon className="w-3 h-3 mr-1" />
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
        <div className="flex items-center justify-center text-xs text-muted-foreground mb-4 pb-4 border-b">
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
}
