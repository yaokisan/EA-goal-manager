/**
 * プロジェクトタブ順序管理フック
 * 
 * 設計参照: UI-requirements.md § 3.1 プロジェクトタブ
 * 技術仕様: technical-requirements.md § 5.2 データベース設計
 * 
 * 関連コンポーネント:
 * - ProjectTabs: プロジェクトタブコンポーネント
 * - useProjects: プロジェクト管理フック
 * 
 * 実装要件:
 * - プロジェクトタブの順序をユーザーごとに保存
 * - セッション跨いで永続化
 * - Supabase RLSによるセキュリティ
 * - データベースエラー時のフォールバック機能
 * - ローカルストレージ活用（フォールバック）
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface ProjectTabOrder {
  id: string
  user_id: string
  project_orders: string[]
  created_at: string
  updated_at: string
}

export function useProjectTabOrder() {
  const { user } = useAuth()
  const [projectOrder, setProjectOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasTableError, setHasTableError] = useState(false)

  const supabase = createClient()

  // ローカルストレージキー
  const getLocalStorageKey = () => `project_tab_order_${user?.id || 'anonymous'}`

  // ローカルストレージから順序を取得
  const getLocalOrder = useCallback(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(getLocalStorageKey())
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [user?.id])

  // ローカルストレージに順序を保存
  const setLocalOrder = useCallback((order: string[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(order))
    } catch (err) {
      console.warn('⚠️ ローカルストレージ保存失敗:', err)
    }
  }, [user?.id])

  // プロジェクトタブ順序を取得（フォールバック機能付き）
  const fetchProjectTabOrder = useCallback(async () => {
    if (!user) {
      // ローカルストレージからフォールバック
      const localOrder = getLocalOrder()
      setProjectOrder(localOrder)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('project_tab_orders')
        .select('project_orders')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // レコードが存在しない場合は空配列
          setProjectOrder([])
          setHasTableError(false)
        } else if (error.code === '42P01' || error.code === 'PGRST301') {
          // テーブルが存在しない場合またはスキーマエラー
          console.warn('⚠️ project_tab_ordersテーブルが利用できません。ローカルストレージを使用します。')
          setHasTableError(true)
          const localOrder = getLocalOrder()
          setProjectOrder(localOrder)
        } else {
          throw error
        }
      } else {
        setProjectOrder(data.project_orders || [])
        setHasTableError(false)
        // ローカルストレージにも同期保存
        setLocalOrder(data.project_orders || [])
      }
    } catch (err) {
      console.error('❌ プロジェクトタブ順序取得エラー:', err)
      setError(err instanceof Error ? err.message : 'プロジェクトタブ順序の取得に失敗しました')
      setHasTableError(true)
      
      // フォールバック：ローカルストレージから読み込み
      const localOrder = getLocalOrder()
      setProjectOrder(localOrder)
      console.log('🔄 ローカルストレージからプロジェクトタブ順序を読み込みました:', localOrder)
    } finally {
      setLoading(false)
    }
  }, [user, supabase, getLocalOrder, setLocalOrder])

  // プロジェクトタブ順序を保存（フォールバック機能付き）
  const saveProjectTabOrder = useCallback(async (newOrder: string[]) => {
    // まずローカル状態とローカルストレージを更新（即座に反映）
    setProjectOrder(newOrder)
    setLocalOrder(newOrder)

    if (!user) {
      console.warn('⚠️ ユーザーが認証されていません。ローカルストレージのみに保存します。')
      return // エラーをスローしない（ローカル保存で継続）
    }

    // テーブルエラーがある場合はローカルストレージのみ使用
    if (hasTableError) {
      console.log('🔄 データベーステーブルが利用できないため、ローカルストレージのみに保存します。')
      return
    }

    try {
      setError(null)

      // 既存のレコードがあるかチェック
      const { data: existingData } = await supabase
        .from('project_tab_orders')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('project_tab_orders')
          .update({ 
            project_orders: newOrder,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('project_tab_orders')
          .insert({
            user_id: user.id,
            project_orders: newOrder
          })

        if (error) throw error
      }

      console.log('✅ プロジェクトタブ順序データベース保存成功:', newOrder)
    } catch (err) {
      console.error('❌ プロジェクトタブ順序データベース保存エラー:', err)
      setError(err instanceof Error ? err.message : 'プロジェクトタブ順序のデータベース保存に失敗しました')
      
      // データベースエラーでもローカル保存は成功しているので、エラーをスローしない
      console.log('🔄 データベース保存に失敗しましたが、ローカルストレージには保存されています。')
      setHasTableError(true)
    }
  }, [user, supabase, hasTableError, setLocalOrder])

  // 初期読み込み
  useEffect(() => {
    fetchProjectTabOrder()
  }, [fetchProjectTabOrder])

  return {
    projectOrder,
    loading,
    error,
    hasTableError,
    saveProjectTabOrder,
    refetch: fetchProjectTabOrder
  }
}