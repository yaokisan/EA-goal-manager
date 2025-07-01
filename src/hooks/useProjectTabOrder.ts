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

  const supabase = createClient()

  // プロジェクトタブ順序を取得
  const fetchProjectTabOrder = useCallback(async () => {
    if (!user) {
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
        } else {
          throw error
        }
      } else {
        setProjectOrder(data.project_orders || [])
      }
    } catch (err) {
      console.error('❌ プロジェクトタブ順序取得エラー:', err)
      setError(err instanceof Error ? err.message : 'プロジェクトタブ順序の取得に失敗しました')
      setProjectOrder([])
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // プロジェクトタブ順序を保存
  const saveProjectTabOrder = useCallback(async (newOrder: string[]) => {
    if (!user) {
      console.warn('⚠️ ユーザーが認証されていません')
      throw new Error('ユーザーが認証されていません')
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

      // データベース保存成功後にローカル状態を更新
      setProjectOrder(newOrder)
      
      console.log('✅ プロジェクトタブ順序保存成功:', newOrder)
    } catch (err) {
      console.error('❌ プロジェクトタブ順序保存エラー:', err)
      setError(err instanceof Error ? err.message : 'プロジェクトタブ順序の保存に失敗しました')
      throw err // エラーを再スローしてProjectTabsコンポーネントでキャッチできるようにする
    }
  }, [user, supabase])

  // 初期読み込み
  useEffect(() => {
    fetchProjectTabOrder()
  }, [fetchProjectTabOrder])

  return {
    projectOrder,
    loading,
    error,
    saveProjectTabOrder,
    refetch: fetchProjectTabOrder
  }
}