'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Gift, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * 激活码组件属性
 */
export interface ActivateCodeProps {
  onSuccess?: (agent: any) => void
  onError?: (error: string) => void
  showHelp?: boolean
  compact?: boolean // 紧凑模式（适用于侧边栏）
  redirectOnSuccess?: boolean // 激活成功后是否跳转
}

/**
 * 激活码输入组件
 * 可在任何页面嵌入使用
 */
export function ActivateCode({
  onSuccess,
  onError,
  showHelp = true,
  compact = false,
  redirectOnSuccess = true,
}: ActivateCodeProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activatedAgent, setActivatedAgent] = useState<any>(null)

  /**
   * 格式化激活码输入
   * 自动转大写
   * 格式: PONTA + 10位字符（例如：PONTA1234567890）
   */
  const formatCode = (value: string) => {
    // 移除所有非字母数字字符
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

    // 限制最大长度为10个字符（不含PONTA前缀）
    const truncated = cleaned.slice(0, 10)

    // 添加PONTA前缀
    return `PONTA${truncated}`
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
      onError?.('请输入完整的激活码')
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

      // 调用成功回调
      onSuccess?.(result.agent)

      // 延迟后跳转
      if (redirectOnSuccess) {
        setTimeout(() => {
          router.push('/my-agents')
        }, 1500)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '激活失败，请稍后重试'
      setError(errorMessage)
      onError?.(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={compact ? '' : 'w-full max-w-md mx-auto'}>
      {!compact && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            激活智能体
          </CardTitle>
          <CardDescription>输入盲盒中的激活码</CardDescription>
        </CardHeader>
      )}
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
              className={`text-center ${compact ? 'text-base' : 'text-xl'} tracking-wider font-mono`}
              maxLength={15}
              autoFocus={!compact}
            />
            {!compact && (
              <p className="text-xs text-muted-foreground text-center">
                示例：PONTA1234567890
              </p>
            )}
          </div>

          {/* 成功提示 */}
          {success && activatedAgent && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="font-semibold">激活成功！</div>
                {!compact && (
                  <div className="text-sm mt-1">
                    你已获得「{activatedAgent.name}」智能体
                  </div>
                )}
                {redirectOnSuccess && (
                  <div className="text-xs mt-2 text-green-600 dark:text-green-400">
                    正在跳转...
                  </div>
                )}
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
            size={compact ? 'default' : 'lg'}
            disabled={isLoading || success || code.length < 15}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                激活中...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                激活成功
              </>
            ) : (
              '立即激活'
            )}
          </Button>
        </form>

        {/* 帮助说明 */}
        {showHelp && !compact && (
          <div className="mt-6 pt-6 border-t space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">如何获取激活码？</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>在商城购买智能体盲盒</li>
              <li>收到实物盲盒后打开包装</li>
              <li>刮开 NFC 卡片上的激活码涂层</li>
              <li>在上方输入框中输入激活码</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
