/**
 * フォーカスモード管理カスタムフック
 * 
 * 設計参照: UI-requirements.md § 6 フォーカスモード機能
 * 技術仕様: technical-requirements.md § 5.2 カスタムフック設計
 * 
 * 関連ファイル:
 * - mockData.ts: モックデータ
 * - types/index.ts: 型定義
 * 
 * 実装要件:
 * - フォーカス目標のCRUD操作
 * - 期限計算
 * - 進捗管理
 * - 将来的にSupabaseクエリに置き換え
 */

'use client'

import { useState, useCallback } from 'react'

export interface FocusData {
  id: string
  title: string
  deadline: string
  description: string
  created_at: string
  updated_at: string
}

// デフォルトのフォーカスデータ
const defaultFocusData: FocusData = {
  id: 'focus-1',
  title: '新機能リリースまでにすべてのバグを修正する',
  deadline: '2024-05-15',
  description: 'プロダクトの品質向上のため、既知のバグをすべて修正し、安定したリリースを実現する',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function useFocusMode() {
  const [focusData, setFocusData] = useState<FocusData>(defaultFocusData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フォーカス目標更新
  const updateFocusData = useCallback(async (data: Partial<Omit<FocusData, 'id' | 'created_at'>>) => {
    setLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setFocusData(prev => ({
        ...prev,
        ...data,
        updated_at: new Date().toISOString()
      }))
    } catch (err) {
      setError('フォーカス目標の更新に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

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
    if (!focusData.deadline) return 0
    
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
    
    if (relevantTasks.length === 0) return 0
    
    const completedTasks = relevantTasks.filter(task => task.status === 'completed')
    return Math.round((completedTasks.length / relevantTasks.length) * 100)
  }, [focusData.deadline])

  // フォーカス期間内のタスク統計を取得
  const getTaskStats = useCallback((tasks: any[], projectId?: string) => {
    if (!focusData.deadline) return { total: 0, completed: 0, remaining: 0, progress: 0 }
    
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
    
    const total = relevantTasks.length
    const completed = relevantTasks.filter(task => task.status === 'completed').length
    const remaining = total - completed
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return { total, completed, remaining, progress }
  }, [focusData.deadline])

  // 進捗更新（手動設定は削除）
  const updateProgress = useCallback(async (progress: number) => {
    // 自動計算に変更したため、この関数は使用しない
    console.warn('進捗は自動計算されます')
  }, [])

  // フォーカス目標完了（期限を今日に設定）
  const completeFocus = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    await updateFocusData({ deadline: today })
  }, [updateFocusData])

  // フォーカス目標リセット
  const resetFocus = useCallback(() => {
    setFocusData(defaultFocusData)
  }, [])

  const daysRemaining = calculateDaysRemaining(focusData.deadline)
  const urgencyLevel = getUrgencyLevel(focusData.deadline)

  return {
    focusData,
    loading,
    error,
    daysRemaining,
    urgencyLevel,
    updateFocusData,
    updateProgress,
    completeFocus,
    resetFocus,
    calculateDaysRemaining,
    getUrgencyLevel,
    calculateProgressFromTasks,
    getTaskStats,
  }
}