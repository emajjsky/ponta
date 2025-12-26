'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Package } from 'lucide-react'

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

interface SeriesCardProps {
  series: Series
}

export function SeriesCard({ series }: SeriesCardProps) {
  return (
    <Link href={`/shop/series/${series.slug}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary overflow-hidden cursor-pointer h-full">
        {/* 系列封面 */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center overflow-hidden">
          {series.coverImage ? (
            <img
              src={series.coverImage}
              alt={series.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-6xl">🎁</div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              ¥{series.price}
            </Badge>
          </div>
        </div>

        {/* 系列信息 */}
        <CardContent className="p-6">
          <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
            {series.name}
          </h3>

          {series.description && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {series.description}
            </p>
          )}

          {/* 角色数量 */}
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              包含 {series._count.agents} 个角色
            </span>
          </div>

          {/* 购买按钮 */}
          <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
            查看详情
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
