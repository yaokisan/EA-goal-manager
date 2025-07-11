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
  goal: '',
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2週間後
  project_id: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function useFocusMode(projectId?: string) {
  const [focusData, setFocusData] = useState<FocusData | null>(null)
  const [loading, setLoading] = useState(true) // 初期状態をtrueに
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { user } = useAuth()

  // フォーカスデータを初期取得
  const fetchFocusData = useCallback(async () => {
    console.log('=== fetchFocusData called ===')
    console.log('認証状態 - user:', user?.id)
    
    if (!user) {
      console.log('ユーザー未認証のため、フォーカスモードは非表示')
      // 認証されていない場合はフォーカスモードを表示しない
      setFocusData(null)
      setLoading(false)
      return
    }

    try {
      console.log('認証済みユーザー - Supabaseからデータ取得中...')
      setLoading(true)
      
      // プロジェクト別のアクティブなフォーカスモードを探す
      let query = supabase
        .from('focus_modes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      // プロジェクトIDが指定されている場合はフィルタリング
      if (projectId) {
        query = query.eq('project_id', projectId)
      } else {
        // 「すべて」タブの場合はproject_idがnullのものを取得
        query = query.is('project_id', null)
      }
      
      let { data, error } = await query.single()

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
          // 完全に新規ユーザーの場合 - 自動作成しない
          console.log('完全に新規ユーザー - フォーカスモードなし')
          setFocusData(null)
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
      // エラーの場合はnullのままにしてフォーカスモードを非表示
      setFocusData(null)
    } finally {
      setLoading(false)
    }
  }, [user, supabase, projectId])

  // 初期データ取得
  useEffect(() => {
    console.log('=== useFocusMode useEffect triggered ===')
    console.log('user dependency changed:', user?.id)
    fetchFocusData()
  }, [fetchFocusData, user?.id])

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

  // フォーカス目標新規作成
  const createFocusData = useCallback(async (data: Partial<Omit<FocusData, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) {
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const newFocusData = {
        ...defaultFocusData,
        ...data,
        user_id: user.id,
        project_id: projectId || null
      }
      
      const { data: createdData, error: createError } = await supabase
        .from('focus_modes')
        .insert(newFocusData)
        .select()
        .single()
      
      if (createError) throw createError
      setFocusData(createdData)
    } catch (err) {
      console.error('フォーカス目標作成エラー:', err)
      setError('フォーカス目標の作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user, supabase, projectId])

  // フォーカス目標更新
  const updateFocusData = useCallback(async (data: Partial<Omit<FocusData, 'id' | 'user_id' | 'created_at'>>) => {
    if (!focusData) {
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      // 認証されていない場合のみローカル更新
      if (!user || focusData.id === 'temp-id') {
        const updatedData = {
          ...focusData,
          ...updateData
        }
        setFocusData(updatedData)
        localStorage.setItem('focusData', JSON.stringify(updatedData))
        return
      }

      // error-fallbackの場合は新規作成を試行
      if (focusData.id === 'error-fallback') {
        const newFocusData = {
          ...defaultFocusData,
          ...updateData,
          user_id: user.id,
          project_id: projectId || null
        }
        
        const { data: createdData, error: createError } = await supabase
          .from('focus_modes')
          .insert(newFocusData)
          .select()
          .single()
        
        if (createError) throw createError
        setFocusData(createdData)
        return
      }
      
      const { data: updatedData, error } = await supabase
        .from('focus_modes')
        .update(updateData)
        .eq('id', focusData.id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      setFocusData(updatedData)
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
    } finally {
      setLoading(false)
    }
  }, [user, focusData, supabase, projectId])

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
    createFocusData,
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