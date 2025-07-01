/**
 * プロジェクト管理カスタムフック
 * 
 * 設計参照: UI-requirements.md § 6 プロジェクト管理機能
 * 技術仕様: technical-requirements.md § 5.2 カスタムフック設計
 * 
 * 関連ファイル:
 * - mockData.ts: モックデータ
 * - types/index.ts: 型定義
 * 
 * 実装要件:
 * - プロジェクトのCRUD操作
 * - 状態管理（ローカルstate）
 * - 将来的にSupabaseクエリに置き換え
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Project } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { user } = useAuth()

  // プロジェクト一覧取得
  const fetchProjects = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('プロジェクト取得エラー:', err)
      setError('プロジェクトの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // 初期データ読み込みとリアルタイム購読
  useEffect(() => {
    if (user) {
      fetchProjects()
      
      // リアルタイム更新の購読
      const subscription = supabase
        .channel('projects-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('プロジェクトリアルタイム更新:', payload)
            
            if (payload.eventType === 'INSERT') {
              const newProject = payload.new as Project
              
              setProjects(prev => {
                // 重複チェック
                if (prev.some(project => project.id === newProject.id)) {
                  return prev
                }
                return [newProject, ...prev]
              })
            }
            else if (payload.eventType === 'UPDATE') {
              const updatedProject = payload.new as Project
              
              setProjects(prev => prev.map(project => 
                project.id === updatedProject.id ? updatedProject : project
              ))
            }
            else if (payload.eventType === 'DELETE') {
              setProjects(prev => prev.filter(project => project.id !== payload.old.id))
            }
          }
        )
        .subscribe()

      // クリーンアップ
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user, supabase])

  // プロジェクト作成
  const createProject = useCallback(async (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('認証が必要です')
    
    setLoading(true)
    setError(null)
    
    try {
      const newProjectData = {
        ...data,
        user_id: user.id,
        members: data.members || [], // メンバー情報のデフォルト値を設定
      }

      const { data: createdProject, error } = await supabase
        .from('projects')
        .insert([newProjectData])
        .select()
        .single()

      if (error) throw error
      
      setProjects(prev => [createdProject, ...prev])
      return createdProject
    } catch (err) {
      console.error('プロジェクト作成エラー:', err)
      setError('プロジェクトの作成に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // プロジェクト更新
  const updateProject = useCallback(async (id: string, data: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) throw new Error('認証が必要です')
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProject : project
      ))
    } catch (err) {
      console.error('プロジェクト更新エラー:', err)
      setError('プロジェクトの更新に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // プロジェクト削除
  const deleteProject = useCallback(async (id: string) => {
    if (!user) throw new Error('認証が必要です')
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      setProjects(prev => prev.filter(project => project.id !== id))
    } catch (err) {
      console.error('プロジェクト削除エラー:', err)
      setError('プロジェクトの削除に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // 単一プロジェクト取得
  const getProject = useCallback((id: string) => {
    return projects.find(project => project.id === id)
  }, [projects])

  // アクティブプロジェクト取得
  const getActiveProjects = useCallback(() => {
    return projects.filter(project => project.status === 'active')
  }, [projects])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    getActiveProjects,
    fetchProjects, // データ再取得用
  }
}