'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Gift, ShoppingBag, User, LogOut, Menu, X, Settings, Award, ArrowLeftRight } from 'lucide-react'

/**
 * 导航栏组件
 */
export function Navbar() {
  const { user, logout, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /**
   * 处理登出
   */
  const handleLogout = async () => {
    await logout()
    setMobileMenuOpen(false)
  }

  /**
   * 导航链接配置
   */
  const navLinks = [
    { href: '/', label: '首页', public: true },
    { href: '/shop', label: '商城', public: true },
    { href: '/exchange/market', label: '交易中心', public: false },
    { href: '/profile', label: '个人中心', public: false },
    { href: '/my-agents', label: '我的智能体', public: false },
    { href: '/activate', label: '激活', public: false },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo 和品牌名 */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold">
              碰
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              碰嗒碰嗒
            </span>
          </Link>

          {/* 桌面端导航链接 */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              // 未登录且非公开链接，不显示
              if (!user && !link.public) return null

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )
            })}
            {/* 管理员专属：后台管理链接 */}
            {user && user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                后台管理
              </Link>
            )}
          </div>

          {/* 用户信息区域 */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
            ) : user ? (
              /* 已登录：显示用户下拉菜单 */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.nickname} />}
                      <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.nickname}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Award className="mr-2 h-4 w-4" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/exchange/my" className="cursor-pointer">
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      我的交易
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/exchange/market" className="cursor-pointer">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      交易市场
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/exchange/publish" className="cursor-pointer">
                      <Gift className="mr-2 h-4 w-4" />
                      发布交换
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-agents" className="cursor-pointer">
                      <Gift className="mr-2 h-4 w-4" />
                      我的智能体
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/activate" className="cursor-pointer">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      激活智能体
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          后台管理
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* 未登录：显示登录按钮 */
              <Button asChild>
                <Link href="/login">
                  <User className="w-4 h-4 mr-2" />
                  登录
                </Link>
              </Button>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navLinks.map((link) => {
              // 未登录且非公开链接，不显示
              if (!user && !link.public) return null

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )
            })}

            {/* 管理员专属：后台管理链接 */}
            {user && user.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                后台管理
              </Link>
            )}

            {/* 用户信息或登录按钮 */}
            <div className="pt-3 border-t">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <Avatar className="h-8 w-8">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.nickname} />}
                      <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user.nickname}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    登出
                  </Button>
                </div>
              ) : (
                <Button className="w-full" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <User className="w-4 h-4 mr-2" />
                    登录
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
