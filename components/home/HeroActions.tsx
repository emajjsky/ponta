'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ArrowRight, Gift } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * 首页 Hero 区域操作按钮组件
 * 根据用户登录状态显示不同按钮
 */
export function HeroActions() {
  const { user, loading } = useAuth()

  // 如果正在加载，显示默认按钮
  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button size="lg" className="text-lg px-8" asChild>
          <Link href="/shop">
            <ShoppingBag className="w-5 h-5 mr-2" />
            探索盲盒商城
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="text-lg px-8" asChild>
          <Link href="/register">
            立即注册
          </Link>
        </Button>
      </div>
    )
  }

  // 已登录用户：显示商城和我的智能体
  if (user) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button size="lg" className="text-lg px-8" asChild>
          <Link href="/shop">
            <ShoppingBag className="w-5 h-5 mr-2" />
            探索盲盒商城
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="text-lg px-8" asChild>
          <Link href="/my-agents">
            <Gift className="w-5 h-5 mr-2" />
            我的智能体
          </Link>
        </Button>
      </div>
    )
  }

  // 未登录用户：显示商城、注册和我的智能体
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
      <Button size="lg" className="text-lg px-8" asChild>
        <Link href="/shop">
          <ShoppingBag className="w-5 h-5 mr-2" />
          探索盲盒商城
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </Button>
      <Button size="lg" variant="outline" className="text-lg px-8" asChild>
        <Link href="/register">
          立即注册
        </Link>
      </Button>
      <Button size="lg" variant="ghost" className="text-lg px-8" asChild>
        <Link href="/my-agents">
          <Gift className="w-5 h-5 mr-2" />
          我的智能体
        </Link>
      </Button>
    </div>
  )
}
