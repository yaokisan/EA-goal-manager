/**
 * 認証プロバイダーコンポーネント
 * 
 * アプリケーション全体で認証状態を管理
 * ページアクセス権限の制御
 */

'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // 認証が必要なページのリスト
  const protectedRoutes = ['/dashboard', '/projects', '/archive']
  // 認証済みユーザーがアクセスできないページ
  const publicOnlyRoutes = ['/login']

  useEffect(() => {
    if (loading) return // ローディング中は何もしない

    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
    const isPublicOnlyRoute = publicOnlyRoutes.some(route => 
      pathname.startsWith(route)
    )

    if (!user && isProtectedRoute) {
      // 未認証ユーザーが保護されたページにアクセスしようとした場合
      router.push('/login')
    } else if (user && isPublicOnlyRoute) {
      // 認証済みユーザーがログインページにアクセスしようとした場合
      router.push('/dashboard')
    }
  }, [user, loading, pathname, router])

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🎯</span>
          </div>
          <div className="text-white text-lg font-medium">Focus Goal</div>
          <div className="text-white text-sm opacity-80 mt-2">読み込み中...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}