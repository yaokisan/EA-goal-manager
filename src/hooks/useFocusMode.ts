/**
 * フォーカスモード管理カスタムフック
 * 
 * 設計参照: UI-requirements.md § 6 フォーカスモード機能
 * 技術仕様: technical-requirements.md § 5.2 カスタムフック設計
 * 
 * 関連ファイル:
 * - types/index.ts: 型定義
 * - Supabase: データベース連携
 * 
 * 実装要件:
 * - フォーカス目標のCRUD操作
 * - 期限計算
 * - 進捗管理
 * - Supabaseクエリによるデータ永続化
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { testSupabaseConnection } from '@/lib/debug/supabaseTest'

export interface FocusData {
  id: string
  goal: string // データベースのフィールド名に合わせる
  deadline: string
  project_id?: string | null
  is_active: boolean
  user_id: string
  created_at: string
  updated_at: string
}

// デフォルトのフォーカスデータ（新規作成用）
const defaultFocusData: Omit<FocusData, 'id' | 'user_id'> = {
  goal: '新機能リリースまでにすべてのバグを修正する',
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2週間後
  project_id: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function useFocusMode() {
  const [focusData, setFocusData] = useState<FocusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { user } = useAuth()

  // フォーカスデータを初期取得
  const fetchFocusData = useCallback(async () => {
    console.log('=== fetchFocusData called ===')
    console.log('認証状態 - user:', user?.id)
    
    if (!user) {
      console.log('ユーザー未認証のため、ローカルストレージから復元')
      // ユーザーが認証されていない場合はローカルストレージから復元、なければデフォルト
      const savedFocusData = localStorage.getItem('focusData')
      if (savedFocusData) {
        try {
          const parsedData = JSON.parse(savedFocusData)
          console.log('ローカルストレージから復元:', parsedData)
          setFocusData(parsedData)
          return
        } catch (error) {
          console.error('ローカルストレージからのフォーカスデータ復元エラー:', error)
        }
      }
      
      // デフォルトデータを設定
      const defaultData = {
        ...defaultFocusData,
        id: 'temp-id',
        user_id: 'temp-user'
      }
      console.log('デフォルトデータを設定:', defaultData)
      setFocusData(defaultData)
      localStorage.setItem('focusData', JSON.stringify(defaultData))
      return
    }

    try {
      console.log('認証済みユーザー - Supabaseからデータ取得中...')
      setLoading(true)
      
      // まずは、アクティブなフォーカスモードを探す
      let { data, error } = await supabase
        .from('focus_modes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      console.log('アクティブなフォーカスモード検索結果:', { data, error })

      if (error && error.code === 'PGRST116') {
        // アクティブなフォーカスモードが見つからない場合、全体から最新のものを取得
        console.log('アクティブなフォーカスモードが見つからない、最新のフォーカスモードを検索中...')
        const { data: latestData, error: latestError } = await supabase
          .from('focus_modes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        console.log('最新フォーカスモード検索結果:', { latestData, latestError })

        if (latestError && latestError.code === 'PGRST116') {
          // 完全に新規ユーザーの場合
          console.log('完全に新規ユーザー - フォーカスデータを新規作成')
          const newFocusData = {
            ...defaultFocusData,
            user_id: user.id,
            project_id: null
          }
          console.log('新規作成データ:', newFocusData)
          
          const { data: createdData, error: createError } = await supabase
            .from('focus_modes')
            .insert(newFocusData)
            .select()
            .single()

          console.log('新規作成結果:', { createdData, createError })
          
          if (createError) throw createError
          setFocusData(createdData)
        } else if (latestData) {
          // 既存のフォーカスモードをアクティブにして使用
          console.log('既存のフォーカスモードをアクティブに変更')
          const { data: updatedData, error: updateError } = await supabase
            .from('focus_modes')
            .update({ is_active: true })
            .eq('id', latestData.id)
            .eq('user_id', user.id)
            .select()
            .single()

          console.log('アクティブ化結果:', { updatedData, updateError })
          
          if (updateError) throw updateError
          setFocusData(updatedData)
        } else {
          throw latestError
        }
      } else if (error) {
        throw error
      } else {
        console.log('既存のアクティブなデータを設定:', data)
        setFocusData(data)
      }
    } catch (err) {
      console.error('フォーカスデータ取得エラー:', err)
      setError('フォーカスデータの取得に失敗しました')
      // エラーの場合もデフォルトデータを設定
      const fallbackData = {
        ...defaultFocusData,
        id: 'error-fallback',
        user_id: user?.id || 'temp-user'
      }
      console.log('エラー時のフォールバックデータ:', fallbackData)
      setFocusData(fallbackData)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // 初期データ取得
  useEffect(() => {
    console.log('=== useFocusMode useEffect triggered ===')
    console.log('user dependency changed:', user?.id)
    fetchFocusData()
  }, [fetchFocusData])

  // focusDataの変更を監視
  useEffect(() => {
    if (focusData) {
      console.log('=== focusData updated ===')
      console.log('新しいfocusData:', focusData)
      console.log('ローカルストレージとの同期確認...')
      
      // 認証されていない場合はローカルストレージに保存
      if (focusData.id === 'temp-id' || focusData.id === 'error-fallback' || !user) {
        localStorage.setItem('focusData', JSON.stringify(focusData))
        console.log('ローカルストレージに保存完了')
      }
    }
  }, [focusData, user])

  // フォーカス目標更新
  const updateFocusData = useCallback(async (data: Partial<Omit<FocusData, 'id' | 'user_id' | 'created_at'>>) => {
    console.log('=== updateFocusData called ===')
    console.log('データ:', data)
    console.log('現在のfocusData:', focusData)
    console.log('認証状態 - user:', user?.id)
    
    if (!focusData) {
      console.log('focusDataがnullのため更新をスキップ')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      }
      console.log('更新データ:', updateData)

      // 認証されていない場合のみローカル更新
      if (!user || focusData.id === 'temp-id') {
        console.log('ローカル更新モード（認証なし）')
        const updatedData = {
          ...focusData,
          ...updateData
        }
        setFocusData(updatedData)
        // ローカルストレージに保存
        localStorage.setItem('focusData', JSON.stringify(updatedData))
        console.log('ローカルストレージに保存完了:', updatedData)
        return
      }

      // error-fallbackの場合は新規作成を試行
      if (focusData.id === 'error-fallback') {
        console.log('error-fallbackの場合は新規作成を試行')
        const newFocusData = {
          ...defaultFocusData,
          ...updateData,
          user_id: user.id,
          project_id: null
        }
        console.log('新規作成データ:', newFocusData)
        
        const { data: createdData, error: createError } = await supabase
          .from('focus_modes')
          .insert(newFocusData)
          .select()
          .single()

        console.log('新規作成結果:', { createdData, createError })
        
        if (createError) throw createError
        setFocusData(createdData)
        console.log('新規フォーカスデータ作成完了:', createdData)
        return
      }

      console.log('Supabaseに更新リクエスト送信中...')
      console.log('更新対象ID:', focusData.id)
      console.log('ユーザーID:', user.id)
      console.log('送信するupdateData:', updateData)
      
      const { data: updatedData, error } = await supabase
        .from('focus_modes')
        .update(updateData)
        .eq('id', focusData.id)
        .eq('user_id', user.id)
        .select()
        .single()

      console.log('Supabaseレスポンス:', { updatedData, error })
      
      if (error) {
        console.error('Supabaseエラーの詳細:', error)
        throw error
      }
      
      setFocusData(updatedData)
      console.log('フォーカスデータ更新完了:', updatedData)
    } catch (err) {
      console.error('フォーカス目標更新エラー:', err)
      setError('フォーカス目標の更新に失敗しました')
      // エラーの場合でもローカル更新を実行
      const fallbackData = {
        ...focusData,
        ...data,
        updated_at: new Date().toISOString()
      }
      setFocusData(fallbackData)
      console.log('エラー時のローカル更新:', fallbackData)
    } finally {
      setLoading(false)
    }
  }, [user, focusData, supabase])

  // 期限までの日数計算
  const calculateDaysRemaining = useCallback((deadline: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }, [])

  // 緊急度判定
  const getUrgencyLevel = useCallback((deadline: string) => {
    const daysRemaining = calculateDaysRemaining(deadline)
    
    if (daysRemaining < 0) return 'overdue'
    if (daysRemaining <= 1) return 'critical'
    if (daysRemaining <= 3) return 'urgent'
    if (daysRemaining <= 7) return 'warning'
    return 'normal'
  }, [calculateDaysRemaining])

  // フォーカス期間内のタスク進捗を自動計算する関数
  const calculateProgressFromTasks = useCallback((tasks: any[], projectId?: string) => {
    if (!focusData?.deadline) return 0
    
    const focusDeadline = new Date(focusData.deadline)
    const now = new Date()
    
    // フォーカス期間内のタスクをフィルタリング
    let relevantTasks = tasks.filter(task => {
      const taskEnd = new Date(task.end_date)
      return taskEnd <= focusDeadline
    })
    
    // プロジェクト指定がある場合はさらにフィルタリング
    if (projectId && projectId !== 'all' && projectId !== 'recent') {
      relevantTasks = relevantTasks.filter(task => task.project_id === projectId)
    }
    
    // フォーカスモードで特定のプロジェクトが設定されている場合
    if (focusData.project_id) {
      relevantTasks = relevantTasks.filter(task => task.project_id === focusData.project_id)
    }
    
    if (relevantTasks.length === 0) return 0
    
    const completedTasks = relevantTasks.filter(task => task.status === 'completed')
    return Math.round((completedTasks.length / relevantTasks.length) * 100)
  }, [focusData])

  // フォーカス期間内のタスク統計を取得
  const getTaskStats = useCallback((tasks: any[], projectId?: string) => {
    if (!focusData?.deadline) return { total: 0, completed: 0, remaining: 0, progress: 0 }
    
    const focusDeadline = new Date(focusData.deadline)
    
    // フォーカス期間内のタスクをフィルタリング
    let relevantTasks = tasks.filter(task => {
      const taskEnd = new Date(task.end_date)
      return taskEnd <= focusDeadline
    })
    
    // プロジェクト指定がある場合はさらにフィルタリング
    if (projectId && projectId !== 'all' && projectId !== 'recent') {
      relevantTasks = relevantTasks.filter(task => task.project_id === projectId)
    }
    
    // フォーカスモードで特定のプロジェクトが設定されている場合
    if (focusData.project_id) {
      relevantTasks = relevantTasks.filter(task => task.project_id === focusData.project_id)
    }
    
    const total = relevantTasks.length
    const completed = relevantTasks.filter(task => task.status === 'completed').length
    const remaining = total - completed
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return { total, completed, remaining, progress }
  }, [focusData])

  // フォーカス目標完了（期限を今日に設定）
  const completeFocus = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    await updateFocusData({ deadline: today })
  }, [updateFocusData])

  // フォーカス目標リセット
  const resetFocus = useCallback(async () => {
    if (!user) return

    try {
      // 現在のフォーカスモードを非アクティブにする
      if (focusData) {
        await supabase
          .from('focus_modes')
          .update({ is_active: false })
          .eq('id', focusData.id)
          .eq('user_id', user.id)
      }

      // 新しいフォーカスモードを作成
      await fetchFocusData()
    } catch (err) {
      console.error('フォーカス目標リセットエラー:', err)
      setError('フォーカス目標のリセットに失敗しました')
    }
  }, [user, focusData, supabase, fetchFocusData])

  const daysRemaining = focusData ? calculateDaysRemaining(focusData.deadline) : 0
  const urgencyLevel = focusData ? getUrgencyLevel(focusData.deadline) : 'normal'

  // デバッグ用の関数
  const debugSupabase = useCallback(async () => {
    console.log('=== useFocusMode デバッグ情報 ===')
    console.log('現在のfocusData:', focusData)
    console.log('認証状態 - user:', user?.id)
    console.log('loading:', loading)
    console.log('error:', error)
    
    // Supabase接続テスト実行
    const connectionTest = await testSupabaseConnection()
    console.log('Supabase接続テスト結果:', connectionTest)
    
    return {
      focusData,
      user: user?.id,
      loading,
      error,
      connectionTest
    }
  }, [focusData, user, loading, error])

  return {
    focusData,
    loading,
    error,
    daysRemaining,
    urgencyLevel,
    updateFocusData,
    completeFocus,
    resetFocus,
    calculateDaysRemaining,
    getUrgencyLevel,
    calculateProgressFromTasks,
    getTaskStats,
    fetchFocusData,
    debugSupabase,
  }
}