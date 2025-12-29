import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MessageCircle,
  Box,
  Edit,
  ArrowLeft,
  Trophy
} from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
  // 检查登录状态
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/login')
  }

  try {
    // 验证token
    const payload = await verifyToken(token)

    // 查询用户数据
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userAgents: {
          include: {
            agent: true,
          },
          take: 6, // 只显示最近6个
          orderBy: {
            activatedAt: 'desc',
          },
        },
      },
    })

    if (!user) {
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-8">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Link>
            </Button>
          </div>

          <div className="max-w-6xl mx-auto space-y-6">
            {/* 用户信息卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-2xl">
                        {user.nickname?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold">{user.nickname}</h1>
                        {user.role === 'ADMIN' && (
                          <Badge variant="destructive">管理员</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">UID: {user.uid}</p>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/profile/edit">
                      <Edit className="w-4 h-4 mr-2" />
                      编辑资料
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{user.totalAgents}</div>
                    <div className="text-sm text-muted-foreground">智能体</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{user.totalChats}</div>
                    <div className="text-sm text-muted-foreground">对话</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 统计数据 */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Box className="w-4 h-4 mr-2" />
                    智能体收藏
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{user.totalAgents}</div>
                  <p className="text-xs text-muted-foreground mt-1">已激活智能体</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    对话统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{user.totalChats}</div>
                  <p className="text-xs text-muted-foreground mt-1">累计对话次数</p>
                </CardContent>
              </Card>
            </div>

            {/* 最近激活的智能体 */}
            {user.userAgents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    最近激活的智能体
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {user.userAgents.map((userAgent) => (
                      <Link
                        key={userAgent.id}
                        href={`/chat/${userAgent.agent.slug}`}
                        className="block"
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="text-center">
                              <Avatar className="h-16 w-16 mx-auto mb-2">
                                <AvatarImage src={userAgent.agent.avatar} />
                                <AvatarFallback>
                                  {userAgent.agent.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium text-sm truncate">
                                {userAgent.agent.name}
                              </div>
                              <Badge
                                variant={
                                  userAgent.agent.rarity === 'HIDDEN'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="mt-1 text-xs"
                              >
                                {userAgent.agent.rarity === 'HIDDEN'
                                  ? '隐藏'
                                  : '普通'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('个人中心错误:', error)
    redirect('/login')
  }
}
