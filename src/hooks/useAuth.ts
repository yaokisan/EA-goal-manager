/**
 * 認証管理カスタムフック
 * 
 * 設計参照: technical-requirements.md § 7 認証・セキュリティ
 * 
 * 実装要件:
 * - Google OAuth認証
 * - ユーザーセッション管理
 * - 自動ログイン/ログアウト
 * - 認証状態の監視
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // 初期認証状態の取得
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setUser(session?.user ?? null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)

        if (event === 'SIGNED_IN') {
          console.log('ユーザーがサインインしました:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('ユーザーがサインアウトしました')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Googleでサインイン
  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 環境に応じたベースURLを取得
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/dashboard`
        }
      })

      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // サインアウト
  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user
  }
}