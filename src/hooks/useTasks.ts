/**
 * タスク管理カスタムフック
 * 
 * 設計参照: UI-requirements.md § 5 タスクリスト機能
 * 技術仕様: technical-requirements.md § 5.2 カスタムフック設計
 * 
 * 関連ファイル:
 * - mockData.ts: モックデータ
 * - types/index.ts: 型定義
 * 
 * 実装要件:
 * - タスクのCRUD操作
 * - プロジェクト別フィルタリング
 * - 状態管理（pending/completed）
 * - 将来的にSupabaseクエリに置き換え
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Task } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function useTasks(projectId?: string) {
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { user } = useAuth()

  // タスク一覧取得
  const fetchTasks = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      
      console.log('📥 Fetched tasks from DB:', data?.map(t => ({ id: t.id, name: t.name, order_index: t.order_index })))

      if (error) throw error
      
      // assigneeからassigneesへの互換性変換
      const tasksWithAssignees = (data || []).map(task => ({
        ...task,
        assignees: task.assignees || (task.assignee ? [task.assignee] : [])
      }))
      
      setAllTasks(tasksWithAssignees)
    } catch (err) {
      console.error('タスク取得エラー:', err)
      setError('タスクの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // 初期データ読み込み
  useEffect(() => {
    console.log('🔄 useEffect triggered - fetching tasks. User:', user?.id)
    if (user) {
      fetchTasks()
    }
  }, [user]) // fetchTasksを依存配列から削除して無限ループを防ぐ

  // プロジェクトでフィルタリングしたタスク（order_indexでソート）
  const tasks = useMemo(() => {
    const filtered = projectId 
      ? allTasks.filter(task => task.project_id === projectId)
      : allTasks
    
    // order_indexでソート（nullの場合は末尾に）
    return filtered.sort((a, b) => {
      if (a.order_index === null && b.order_index === null) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (a.order_index === null) return 1
      if (b.order_index === null) return -1
      return a.order_index - b.order_index
    })
  }, [allTasks, projectId])

  // タスクの並び順更新
  const updateTaskOrder = useCallback(async (taskId: string, newIndex: number) => {
    if (!user) throw new Error('認証が必要です')
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ order_index: newIndex })
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error
      
      // ローカル状態も更新
      setAllTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, order_index: newIndex } : task
      ))
    } catch (err) {
      console.error('タスク順序更新エラー:', err)
      throw err
    }
  }, [supabase, user])

  // 複数タスクの並び順を一括更新
  const updateMultipleTaskOrder = useCallback(async (updates: { id: string; order_index: number }[]) => {
    if (!user) throw new Error('認証が必要です')
    
    console.log('🔄 updateMultipleTaskOrder called with:', updates)
    
    try {
      // バッチ更新を実行
      const promises = updates.map(({ id, order_index }) => {
        console.log(`📤 Updating task ${id} to order_index ${order_index}`)
        return supabase
          .from('tasks')
          .update({ order_index })
          .eq('id', id)
          .eq('user_id', user.id)
          .select() // 更新されたデータを返す
      })
      
      const results = await Promise.all(promises)
      console.log('📋 Update results:', results.map(r => ({ 
        data: r.data?.map(task => ({ id: task.id, name: task.name, order_index: task.order_index })), 
        error: r.error 
      })))
      
      const errors = results.filter(result => result.error).map(result => result.error)
      
      if (errors.length > 0) {
        console.error('❌ Batch update errors:', errors)
        throw new Error(`一部のタスク更新に失敗: ${errors.length}件`)
      }
      
      console.log('✅ Batch update successful')
      
      // ローカル状態を更新
      setAllTasks(prev => {
        const updated = prev.map(task => {
          const update = updates.find(u => u.id === task.id)
          return update ? { ...task, order_index: update.order_index } : task
        })
        console.log('📝 Local state updated:', updated.map(t => ({ id: t.id, name: t.name, order_index: t.order_index })))
        return updated
      })
    } catch (err) {
      console.error('複数タスク順序更新エラー:', err)
      throw err
    }
  }, [supabase, user])

  // タスク作成
  const createTask = useCallback(async (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
    if (!user) throw new Error('認証が必要です')
    
    setLoading(true)
    setError(null)
    
    try {
      // 新しいタスクのorder_indexを計算（最大値+1）
      const maxOrderIndex = projectId 
        ? Math.max(...allTasks.filter(t => t.project_id === projectId).map(t => t.order_index || 0), 0)
        : Math.max(...allTasks.map(t => t.order_index || 0), 0)
      
      const newTaskData = {
        ...data,
        user_id: user.id,
        status: 'pending' as const,
        completed_at: null,
        order_index: maxOrderIndex + 1,
      }

      const { data: createdTask, error } = await supabase
        .from('tasks')
        .insert([newTaskData])
        .select()
        .single()

      if (error) throw error
      
      // assigneeからassigneesへの互換性変換
      const taskWithAssignees = {
        ...createdTask,
        assignees: createdTask.assignees || (createdTask.assignee ? [createdTask.assignee] : [])
      }
      
      setAllTasks(prev => [taskWithAssignees, ...prev])
      return taskWithAssignees
    } catch (err) {
      console.error('タスク作成エラー:', err)
      setError('タスクの作成に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase, user, allTasks, projectId])

  // タスク更新
  const updateTask = useCallback(async (id: string, data: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) throw new Error('認証が必要です')
    
    setLoading(true)
    setError(null)
    
    try {
      const currentTask = allTasks.find(task => task.id === id)
      if (!currentTask) throw new Error('タスクが見つかりません')

      const updateData = { ...data }
      
      // ステータスがcompletedに変更された場合、completed_atを設定
      if (data.status === 'completed' && currentTask.status !== 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
      // ステータスがpendingに戻された場合、completed_atをクリア
      if (data.status === 'pending' && currentTask.status === 'completed') {
        updateData.completed_at = null
      }

      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      
      // assigneeからassigneesへの互換性変換
      const taskWithAssignees = {
        ...updatedTask,
        assignees: updatedTask.assignees || (updatedTask.assignee ? [updatedTask.assignee] : [])
      }
      
      setAllTasks(prev => prev.map(task => 
        task.id === id ? taskWithAssignees : task
      ))
    } catch (err) {
      console.error('タスク更新エラー:', err)
      setError('タスクの更新に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [allTasks, supabase, user])

  // タスク削除
  const deleteTask = useCallback(async (id: string) => {
    if (!user) throw new Error('認証が必要です')
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      setAllTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      console.error('タスク削除エラー:', err)
      setError('タスクの削除に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // タスクステータス切り替え
  const toggleTaskStatus = useCallback(async (id: string) => {
    const task = allTasks.find(t => t.id === id)
    if (!task) return
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await updateTask(id, { status: newStatus })
  }, [allTasks, updateTask])

  // 単一タスク取得
  const getTask = useCallback((id: string) => {
    return allTasks.find(task => task.id === id)
  }, [allTasks])

  // 完了タスク取得
  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.status === 'completed')
  }, [tasks])

  // 未完了タスク取得
  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => task.status === 'pending')
  }, [tasks])

  // 直近1週間のタスク取得
  const getRecentTasks = useCallback(() => {
    const oneWeekFromNow = new Date()
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
    
    return allTasks.filter(task => {
      const endDate = new Date(task.end_date)
      return endDate <= oneWeekFromNow && task.status === 'pending'
    })
  }, [allTasks])

  // 複数タスクをNotion形式でコピー
  const copyTasksToNotion = useCallback((taskIds: string[]) => {
    const selectedTasks = allTasks.filter(task => taskIds.includes(task.id))
    const notionFormat = selectedTasks.map(task => 
      `- [ ] ${task.name} 【${task.end_date}】`
    ).join('\n')
    
    navigator.clipboard.writeText(notionFormat)
    return notionFormat
  }, [allTasks])

  return {
    tasks,
    allTasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    getTask,
    getCompletedTasks,
    getPendingTasks,
    getRecentTasks,
    copyTasksToNotion,
    fetchTasks, // データ再取得用
    updateTaskOrder, // 並び順更新
    updateMultipleTaskOrder, // 複数タスク並び順更新
  }
}