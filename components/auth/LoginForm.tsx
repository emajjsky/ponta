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
import { useAuth } from '@/hooks/useAuth'

/**
 * 登录表单验证 Schema
 */
const loginSchema = z.object({
  email: z.string().min(1, '邮箱不能为空').email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  redirectUrl?: string
}

/**
 * 登录表单组件
 */
export function LoginForm({ redirectUrl }: LoginFormProps) {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // 使用 useAuth 的 login 方法，确保状态同步
      const success = await login(data.email, data.password)

      if (success) {
        // 重定向
        if (redirectUrl) {
          router.push(redirectUrl)
        } else {
          router.push('/')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败，请稍后重试'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
        <CardDescription className="text-center">
          输入邮箱和密码登录您的账号
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

          {/* 密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* 提交按钮 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              '登录'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-center text-muted-foreground">
          还没有账号？{' '}
          <a href="/register" className="text-primary hover:underline">
            立即注册
          </a>
        </p>
      </CardFooter>
    </Card>
  )
}
