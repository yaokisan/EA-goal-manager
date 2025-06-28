/**
 * ルートページコンポーネント
 * 
 * 認証状態に応じてログインページまたはダッシュボードにリダイレクト
 */

'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // ローディング画面
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