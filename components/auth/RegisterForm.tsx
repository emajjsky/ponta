'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

/**
 * 注册表单验证 Schema
 */
const registerSchema = z
  .object({
    email: z.string().min(1, '邮箱不能为空').email('邮箱格式不正确'),
    password: z
      .string()
      .min(1, '密码不能为空')
      .min(8, '密码至少8个字符')
      .regex(/[a-zA-Z]/, '密码必须包含字母')
      .regex(/[0-9]/, '密码必须包含数字'),
    confirmPassword: z.string().min(1, '请确认密码'),
    nickname: z
      .string()
      .min(1, '昵称不能为空')
      .min(2, '昵称至少2个字符')
      .max(20, '昵称最多20个字符')
      .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, '昵称只能包含中文、英文、数字、下划线'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码输入不一致',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

/**
 * 注册表单组件
 */
export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      nickname: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          nickname: data.nickname,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '注册失败')
      }

      toast.success('注册成功！')

      // 延迟后跳转到首页
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '注册失败，请稍后重试'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
        <CardDescription className="text-center">
          创建一个新账号开始使用
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 邮箱输入 */}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* 昵称输入 */}
          <div className="space-y-2">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="请输入昵称"
              disabled={isLoading}
              {...register('nickname')}
            />
            {errors.nickname && (
              <p className="text-sm text-red-500">{errors.nickname.message}</p>
            )}
          </div>

          {/* 密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="至少8个字符，包含字母和数字"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* 确认密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              disabled={isLoading}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* 提交按钮 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              '注册'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-center text-muted-foreground">
          已有账号？{' '}
          <a href="/login" className="text-primary hover:underline">
            立即登录
          </a>
        </p>
      </CardFooter>
    </Card>
  )
}
