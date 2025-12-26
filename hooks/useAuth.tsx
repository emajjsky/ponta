'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * 用户信息接口
 */
export interface User {
  id: string
  email: string
  nickname: string
  avatar: string | null
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

/**
 * 认证 Context 数据接口
 */
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, nickname: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

/**
 * 认证 Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * useAuth Hook
 * 提供用户认证状态和方法
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * AuthProvider 组件属性
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * 认证提供者组件
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * 刷新用户信息
   */
  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 登录
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || '登录失败')
        return false
      }

      setUser(result.user)
      toast.success('登录成功！')
      return true
    } catch (error) {
      console.error('登录错误:', error)
      toast.error('登录失败，请稍后重试')
      return false
    }
  }

  /**
   * 注册
   */
  const register = async (
    email: string,
    password: string,
    nickname: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, nickname }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || '注册失败')
        return false
      }

      setUser(result.user)
      toast.success('注册成功！')
      return true
    } catch (error) {
      console.error('注册错误:', error)
      toast.error('注册失败，请稍后重试')
      return false
    }
  }

  /**
   * 登出
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      setUser(null)
      toast.success('已登出')
      router.push('/login')
    } catch (error) {
      console.error('登出错误:', error)
      toast.error('登出失败，请稍后重试')
    }
  }

  // 组件挂载时获取用户信息
  useEffect(() => {
    refreshUser()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
