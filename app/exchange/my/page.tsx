import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { MyExchangeClient } from './components/MyExchangeClient'

export const metadata: Metadata = {
  title: '我的交易 - 碰嗒碰嗒',
  description: '管理我发布的交换和发起的交换请求',
}

/**
 * 我的交易页面（服务端组件）
 */
export default async function MyExchangePage() {
  // 获取 Cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  // 验证 Token
  if (!token) {
    redirect('/login')
  }

  try {
    await verifyToken(token)
  } catch (error) {
    redirect('/login')
  }

  return <MyExchangeClient />
}
