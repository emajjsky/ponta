'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * 首页 CTA 区域操作按钮组件
 * 根据用户登录状态显示不同按钮
 */
export function CtaActions() {
  const { user, loading } = useAuth()

  // 如果正在加载，显示默认按钮
  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="text-lg px-8" asChild>
          <Link href="/shop">
            <ShoppingBag className="w-5 h-5 mr-2" />
            前往商城
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="text-lg px-8" asChild>
          <Link href="/register">
            免费注册
          </Link>
        </Button>
      </div>
    )
  }

  // 已登录用户：只显示前往商城按钮
  if (user) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="text-lg px-8" asChild>
          <Link href="/shop">
            <ShoppingBag className="w-5 h-5 mr-2" />
            前往商城
          </Link>
        </Button>
      </div>
    )
  }

  // 未登录用户：显示前往商城和免费注册
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="lg" className="text-lg px-8" asChild>
        <Link href="/shop">
          <ShoppingBag className="w-5 h-5 mr-2" />
          前往商城
        </Link>
      </Button>
      <Button size="lg" variant="outline" className="text-lg px-8" asChild>
        <Link href="/register">
          免费注册
        </Link>
      </Button>
    </div>
  )
}
