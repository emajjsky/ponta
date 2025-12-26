'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Navbar } from '@/components/layout/Navbar'
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  nickname: string
  avatar: string | null
  role: string
  status: string
  createdAt: string
  _count: {
    userAgentCount: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    fetchUsers()
  }, [statusFilter, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (roleFilter !== 'all') params.append('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      toast.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (userId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || '操作成功')
        fetchUsers()
      } else {
        toast.error(data.error || '操作失败')
      }
    } catch (error) {
      console.error('操作失败:', error)
      toast.error('操作失败')
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理平台用户</p>
        </div>

        {/* 筛选栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜索邮箱或昵称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="ACTIVE">正常</SelectItem>
                  <SelectItem value="BANNED">已封禁</SelectItem>
                </SelectContent>
              </Select>

              {/* 角色筛选 */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="筛选角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有角色</SelectItem>
                  <SelectItem value="USER">普通用户</SelectItem>
                  <SelectItem value="ADMIN">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              加载中...
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? '没有找到匹配的用户'
                : '还没有用户'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* 头像 */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {user.nickname.charAt(0).toUpperCase()}
                      </div>

                      {/* 用户信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">
                            {user.nickname}
                          </h3>
                          <Badge
                            variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                          >
                            {user.role === 'ADMIN' ? (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                管理员
                              </>
                            ) : (
                              '用户'
                            )}
                          </Badge>
                          <Badge
                            variant={
                              user.status === 'ACTIVE'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {user.status === 'ACTIVE' ? '正常' : '已封禁'}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {user.email}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>{user._count.userAgentCount} 个智能体</span>
                          </div>
                          <span>
                            注册于 {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-2">
                      {user.role !== 'ADMIN' && (
                        <>
                          {user.status === 'ACTIVE' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(user.id, 'ban')}
                            >
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              封禁
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(user.id, 'unban')}
                            >
                              解封
                            </Button>
                          )}

                          {user.role === 'USER' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleAction(user.id, 'set_admin')
                              }
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              设为管理员
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleAction(user.id, 'remove_admin')
                              }
                            >
                              取消管理员
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
