'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Gift, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * 激活页面内容组件
 */
function ActivatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activatedAgent, setActivatedAgent] = useState<any>(null)

  // 从 URL 获取预填激活码（用于扫码场景）
  useEffect(() => {
    const prefillCode = searchParams.get('code')
    if (prefillCode) {
      setCode(prefillCode.toUpperCase())
    }
  }, [searchParams])

  /**
   * 格式化激活码输入
   * 自动转大写
   * 新格式: PONTA + 10位字符（例如：PONTA1234567890）
   */
  const formatCode = (value: string) => {
    // 移除所有非字母数字字符
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

    // 限制最大长度为15个字符（PONTA + 10位）
    const truncated = cleaned.slice(0, 15)

    return truncated
  }

  /**
   * 处理输入变化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value)
    setCode(formatted)
    setError(null)
  }

  /**
   * 提交激活
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code || code.length !== 15) {
      setError('请输入完整的激活码（格式：PONTA + 10位字符）')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '激活失败')
      }

      // 激活成功
      setSuccess(true)
      setActivatedAgent(result.agent)
      toast.success(result.message || '激活成功！')

      // 延迟后跳转到我的智能体页面
      setTimeout(() => {
        router.push('/my-agents')
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '激活失败，请稍后重试'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              ← 返回首页
            </Link>
          </Button>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4 animate-collision">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">激活智能体</h1>
          <p className="text-muted-foreground">
            输入盲盒中的激活码，唤醒你的 AI 伙伴
          </p>
        </div>

        {/* 激活卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>输入激活码</CardTitle>
            <CardDescription>
              激活码格式：PONTA + 10位字符
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 激活码输入 */}
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  激活码
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="PONTA1234567890"
                  value={code}
                  onChange={handleInputChange}
                  disabled={isLoading || success}
                  className="text-center text-xl tracking-wider font-mono"
                  maxLength={15}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  示例：PONTA1234567890
                </p>
              </div>

              {/* 成功提示 */}
              {success && activatedAgent && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="font-semibold">激活成功！</div>
                    <div className="text-sm mt-1">
                      你已获得「{activatedAgent.name}」智能体
                    </div>
                    <div className="text-xs mt-2 text-green-600 dark:text-green-400">
                      正在跳转到我的智能体...
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 错误提示 */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || success || code.length !== 15}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    激活中...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    激活成功
                  </>
                ) : (
                  '立即激活'
                )}
              </Button>
            </form>

            {/* 帮助提示 */}
            <div className="mt-6 pt-6 border-t space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">如何获取激活码？</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>在商城购买智能体盲盒</li>
                <li>收到实物盲盒后打开包装</li>
                <li>刮开 NFC 卡片上的激活码涂层</li>
                <li>在上方输入框中输入激活码</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * 激活页面（使用 Suspense 包裹）
 */
export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <ActivatePageContent />
    </Suspense>
  )
}
