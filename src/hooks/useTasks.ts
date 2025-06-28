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

import { useState, useCallback } from 'react'
import { Task } from '@/types'
import { mockTasks, MOCK_USER_ID } from '@/lib/mockData'

export function useTasks(projectId?: string) {
  const [allTasks, setAllTasks] = useState<Task[]>(mockTasks)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // プロジェクトでフィルタリングしたタスク
  const tasks = projectId 
    ? allTasks.filter(task => task.project_id === projectId)
    : allTasks

  // タスク作成
  const createTask = useCallback(async (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
    setLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newTask: Task = {
        ...data,
        id: `task-${Date.now()}`,
        user_id: MOCK_USER_ID,
        status: 'pending',
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      setAllTasks(prev => [newTask, ...prev])
      return newTask
    } catch (err) {
      setError('タスクの作成に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // タスク更新
  const updateTask = useCallback(async (id: string, data: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>) => {
    setLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setAllTasks(prev => prev.map(task => {
        if (task.id === id) {
          const updatedTask = { 
            ...task, 
            ...data, 
            updated_at: new Date().toISOString() 
          }
          
          // ステータスがcompletedに変更された場合、completed_atを設定
          if (data.status === 'completed' && task.status !== 'completed') {
            updatedTask.completed_at = new Date().toISOString()
          }
          // ステータスがpendingに戻された場合、completed_atをクリア
          if (data.status === 'pending' && task.status === 'completed') {
            updatedTask.completed_at = null
          }
          
          return updatedTask
        }
        return task
      }))
    } catch (err) {
      setError('タスクの更新に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // タスク削除
  const deleteTask = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setAllTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      setError('タスクの削除に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

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
  }
}