'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    avatar: '',
  })

  // 获取当前用户资料
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()

        if (data.success) {
          setFormData({
            nickname: data.user.nickname || '',
            bio: data.user.bio || '',
            avatar: data.user.avatar || '',
          })
        } else {
          toast.error('获取用户资料失败')
          router.push('/profile')
        }
      } catch (error) {
        console.error('获取用户资料错误:', error)
        toast.error('网络错误，请稍后重试')
        router.push('/profile')
      } finally {
        setFetching(false)
      }
    }

    fetchProfile()
  }, [router])

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证
    if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      toast.error('昵称长度必须在2-20个字符之间')
      return
    }

    if (formData.bio.length > 200) {
      toast.error('个人简介不能超过200个字符')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('资料更新成功')
        router.push('/profile')
      } else {
        toast.error(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新用户资料错误:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理输入变化
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回个人中心
              </Link>
            </Button>
          </div>

          {/* 编辑表单 */}
          <Card>
            <CardHeader>
              <CardTitle>编辑个人资料</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 昵称 */}
                <div className="space-y-2">
                  <Label htmlFor="nickname">
                    昵称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="请输入昵称"
                    required
                    minLength={2}
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    2-20个字符，支持中英文、数字、下划线
                  </p>
                </div>

                {/* 头像URL */}
                <div className="space-y-2">
                  <Label htmlFor="avatar">头像URL</Label>
                  <Input
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    留空将使用默认头像
                  </p>
                </div>

                {/* 个人简介 */}
                <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="介绍一下自己..."
                    rows={4}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    最多200个字符
                  </p>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/profile')}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      '保存修改'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
