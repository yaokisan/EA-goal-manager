/**
 * 売上目標管理カスタムフック
 * 
 * 実装要件:
 * - 売上目標のCRUD操作
 * - プロジェクト別の売上目標管理
 * - 期間設定による動的な目標管理
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface SalesTarget {
  id: string
  project_id: string
  year_month: string // "2024-01"
  target_amount: number
  user_id: string
  created_at: string
  updated_at: string
}

export function useSalesTargets() {
  const [salesTargets, setSalesTargets] = useState<SalesTarget[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { user } = useAuth()

  // 売上目標一覧取得
  const fetchSalesTargets = useCallback(async (projectId?: string) => {
    if (!user) return
    
    try {
      setLoading(true)
      let query = supabase
        .from('sales_targets')
        .select('*')
        .eq('user_id', user.id)
        .order('year_month', { ascending: true })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error
      setSalesTargets(data || [])
    } catch (err) {
      console.error('売上目標取得エラー:', err)
      setError('売上目標の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // 売上目標の一括保存/更新
  const saveSalesTargets = useCallback(async (projectId: string, targets: { [yearMonth: string]: number }) => {
    if (!user) throw new Error('認証が必要です')
    
    setLoading(true)
    setError(null)
    
    try {
      // 既存の売上目標を削除
      await supabase
        .from('sales_targets')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id)

      // 新しい売上目標を挿入
      const targetData = Object.entries(targets)
        .filter(([_, amount]) => amount >= 0) // 0以上の値を保存（0も含む）
        .map(([yearMonth, amount]) => ({
          project_id: projectId,
          year_month: yearMonth,
          target_amount: amount,
          user_id: user.id
        }))

      if (targetData.length > 0) {
        const { error } = await supabase
          .from('sales_targets')
          .insert(targetData)

        if (error) throw error
      }

      // 更新されたデータを再取得
      await fetchSalesTargets(projectId)
    } catch (err) {
      console.error('売上目標保存エラー:', err)
      setError('売上目標の保存に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase, user, fetchSalesTargets])

  // プロジェクト別の売上目標取得
  const getProjectSalesTargets = useCallback((projectId: string) => {
    return salesTargets.filter(target => target.project_id === projectId)
  }, [salesTargets])

  // 直近3ヶ月の売上目標取得
  const getRecentSalesTargets = useCallback((projectId: string) => {
    const now = new Date()
    const recentMonths: string[] = []
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      recentMonths.push(yearMonth)
    }

    return salesTargets.filter(target => 
      target.project_id === projectId && 
      recentMonths.includes(target.year_month)
    )
  }, [salesTargets])

  return {
    salesTargets,
    loading,
    error,
    fetchSalesTargets,
    saveSalesTargets,
    getProjectSalesTargets,
    getRecentSalesTargets,
  }
}