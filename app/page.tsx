import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HeroActions } from '@/components/home/HeroActions'
import { CtaActions } from '@/components/home/CtaActions'
import {
  Gift,
  Sparkles,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  Zap,
  Shield,
  Users
} from 'lucide-react'

/**
 * 首页
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <Navbar />

      {/* Hero 区域 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* 品牌标题 */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold animate-collision">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  碰嗒碰嗒
                </span>
              </h1>
              <p className="text-2xl md:text-3xl text-muted-foreground font-medium">
                AI 智能体盲盒平台
              </p>
            </div>

            {/* 副标题 */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              通过 NFC 芯片碰一碰，唤醒你的专属 AI 智能体伙伴！
              <br />
              每一个盲盒都藏着一个独特的 AI 角色，等待你来发现。
            </p>

            {/* CTA 按钮 */}
            <HeroActions />
          </div>
        </div>

        {/* 装饰元素 */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </section>

      {/* 特性展示 */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              为什么选择碰嗒碰嗒？
            </h2>
            <p className="text-muted-foreground text-lg">
              独特的体验，让 AI 智能体走进现实
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 特性 1 */}
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">实物盲盒</h3>
                <p className="text-sm text-muted-foreground">
                  购买实体盲盒，收到精美的 NFC 智能卡片
                </p>
              </CardContent>
            </Card>

            {/* 特性 2 */}
            <Card className="border-2 hover:border-secondary transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">独特角色</h3>
                <p className="text-sm text-muted-foreground">
                  每个 AI 智能体都有独特的性格和能力
                </p>
              </CardContent>
            </Card>

            {/* 特性 3 */}
            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold">一碰激活</h3>
                <p className="text-sm text-muted-foreground">
                  NFC 技术，刮开激活码即可唤醒智能体
                </p>
              </CardContent>
            </Card>

            {/* 特性 4 */}
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">智能对话</h3>
                <p className="text-sm text-muted-foreground">
                  与 AI 智能体进行流畅的多轮对话
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 使用流程 */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              如何开始？
            </h2>
            <p className="text-muted-foreground text-lg">
              简单 4 步，拥有你的 AI 智能体伙伴
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {/* 步骤 1 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">选购盲盒</h3>
                  <p className="text-sm text-muted-foreground">
                    在商城选择喜欢的智能体盲盒
                  </p>
                </div>
              </div>

              {/* 步骤 2 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">收到盲盒</h3>
                  <p className="text-sm text-muted-foreground">
                    快递送达，打开包装取出卡片
                  </p>
                </div>
              </div>

              {/* 步骤 3 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">激活智能体</h3>
                  <p className="text-sm text-muted-foreground">
                    刮开激活码，在网站输入激活
                  </p>
                </div>
              </div>

              {/* 步骤 4 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  4
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">开始对话</h3>
                  <p className="text-sm text-muted-foreground">
                    与你的 AI 伙伴开始精彩对话
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2">
            <CardContent className="p-12 text-center space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  准备好了吗？
                </h2>
                <p className="text-lg text-muted-foreground">
                  探索 AI 智能体盲盒的奇妙世界
                </p>
              </div>

              <CtaActions />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-900 border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 碰嗒碰嗒 (PONT-PONTA). All rights reserved.</p>
          <p className="mt-2">AI 智能体盲盒平台 - 让 AI 走进现实</p>
        </div>
      </footer>
    </div>
  )
}
