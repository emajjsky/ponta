import { RegisterForm } from '@/components/auth/RegisterForm'

/**
 * 注册页面
 */
export default function RegisterPage() {
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

        {/* 注册表单 */}
        <RegisterForm />
      </div>
    </div>
  )
}
