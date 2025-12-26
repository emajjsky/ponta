import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Sparkles } from 'lucide-react'

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

interface AgentCardProps {
  agent: Agent
  showRarity?: boolean
  showPrice?: boolean
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
 * 智能体卡片组件
 * 用于在商城列表中展示单个智能体盲盒
 */
export function AgentCard({ agent, showRarity = true, showPrice = true }: AgentCardProps) {
  const rarityConfig = RARITY_CONFIG[agent.rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.STANDARD
  const RarityIcon = rarityConfig.icon

  return (
    <Link href={`/agents/${agent.slug}`}>
      <Card
        className={`
          h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1
          ${rarityConfig.bgColor} ${rarityConfig.borderColor} border-2
          cursor-pointer group
        `}
      >
        {/* 卡片头部：头像和稀有度徽章 */}
        <CardHeader className="relative pb-4">
          {/* 稀有度徽章 */}
          {showRarity && (
            <Badge className={`absolute top-2 right-2 ${rarityConfig.badgeColor} border-0`}>
              <RarityIcon className="w-3 h-3 mr-1" />
              {rarityConfig.label}
            </Badge>
          )}

          {/* 智能体头像 */}
          <div className="flex justify-center pt-4">
            <div className="relative w-32 h-32">
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-full h-full object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
        </CardHeader>

        {/* 卡片内容：名称、描述、能力 */}
        <CardContent className="space-y-3">
          {/* 名称 */}
          <h3 className={`text-xl font-bold text-center ${rarityConfig.textColor}`}>
            {agent.name}
          </h3>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground text-center line-clamp-2">
            {agent.description}
          </p>

          {/* 能力标签 */}
          <div className="flex flex-wrap gap-1 justify-center">
            {agent.abilities.slice(0, 3).map((ability, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs px-2 py-0"
              >
                {ability}
              </Badge>
            ))}
            {agent.abilities.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{agent.abilities.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>

        {/* 卡片底部：价格和按钮 */}
        {showPrice && (
          <CardFooter className="flex items-center justify-between pt-4 border-t">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">盲盒价格</span>
              <span className={`text-2xl font-bold ${rarityConfig.textColor}`}>
                ¥{agent.price.toFixed(1)}
              </span>
            </div>
            <Button
              className={`${rarityConfig.bgColor} ${rarityConfig.textColor} border-2 hover:bg-opacity-80`}
            >
              查看详情
            </Button>
          </CardFooter>
        )}
        {!showPrice && (
          <CardFooter className="flex justify-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">点击查看详情</p>
          </CardFooter>
        )}
      </Card>
    </Link>
  )
}
