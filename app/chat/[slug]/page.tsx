import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ClearChatButton } from '@/components/chat/ClearChatButton'

/**
 * 对话页面
 * 强制动态渲染（因为需要读取cookies进行认证）
 */
export const dynamic = 'force-dynamic'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // 获取 Cookie 并验证用户
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let payload
  if (!token) {
    redirect('/login')
  }

  try {
    payload = await verifyToken(token)
  } catch (error) {
    redirect('/login')
  }

  // 查询智能体
  const agent = await prisma.agent.findUnique({
    where: { slug },
  })

  if (!agent || agent.deletedAt) {
    notFound()
  }

  // 检查用户是否已激活该智能体
  const userAgent = await prisma.userAgent.findFirst({
    where: {
      userId: payload.userId,
      agentId: agent.id,
    },
  })

  // 如果未激活，显示提示页面
  if (!userAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-2xl font-bold">尚未激活该智能体</h2>
            <p className="text-muted-foreground">
              你还没有激活「{agent.name}」智能体。
              <br />
              请先购买盲盒并激活，才能开始对话哦！
            </p>
            <div className="flex flex-col gap-2 pt-4">
              <Button asChild>
                <Link href="/activate">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  立即激活
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/shop">
                  前往商城
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 已激活，显示对话界面
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部栏 */}
      <div className="border-b bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3">
        {/* 返回按钮 */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/my-agents">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>

        {/* 智能体信息 */}
        <Avatar className="w-10 h-10">
          <AvatarImage src={agent.avatar} alt={agent.name} />
          <AvatarFallback>{agent.name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="font-semibold">{agent.name}</h1>
          <p className="text-xs text-muted-foreground">在线</p>
        </div>

        {/* 清空对话按钮 */}
        <ClearChatButton userAgentId={userAgent.id} agentName={agent.name} />
      </div>

      {/* 对话界面 */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          agentSlug={agent.slug}
          agentName={agent.name}
          agentAvatar={agent.avatar}
        />
      </div>
    </div>
  )
}

/**
 * 生成元数据
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agent = await prisma.agent.findUnique({
    where: { slug },
    select: { name: true, description: true },
  })

  if (!agent) {
    return {
      title: '智能体不存在 - 碰嗒碰嗒',
    }
  }

  return {
    title: `与 ${agent.name} 对话 - 碰嗒碰嗒`,
    description: agent.description,
  }
}
