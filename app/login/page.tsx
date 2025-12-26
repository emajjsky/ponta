import { LoginForm } from '@/components/auth/LoginForm'

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>
}

/**
 * 登录页面
 */
export default async function LoginPage(props: LoginPageProps) {
  const { redirect, error } = await props.searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 animate-collision">
            碰嗒碰嗒
          </h1>
          <p className="text-muted-foreground">AI 智能体盲盒平台</p>
        </div>

        {/* 登录表单 */}
        <LoginForm redirectUrl={redirect || undefined} />

        {/* 错误提示 */}
        {error === 'token_expired' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 text-center">
            登录已过期，请重新登录
          </div>
        )}
      </div>
    </div>
  )
}
