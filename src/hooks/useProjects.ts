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

import { useState, useCallback } from 'react'
import { Project } from '@/types'
import { mockProjects, MOCK_USER_ID } from '@/lib/mockData'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // プロジェクト作成
  const createProject = useCallback(async (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setLoading(true)
    setError(null)
    
    try {
      // モック用の遅延
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newProject: Project = {
        ...data,
        id: `project-${Date.now()}`,
        user_id: MOCK_USER_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (err) {
      setError('プロジェクトの作成に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // プロジェクト更新
  const updateProject = useCallback(async (id: string, data: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>) => {
    setLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setProjects(prev => prev.map(project => 
        project.id === id 
          ? { 
              ...project, 
              ...data, 
              updated_at: new Date().toISOString() 
            }
          : project
      ))
    } catch (err) {
      setError('プロジェクトの更新に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // プロジェクト削除
  const deleteProject = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setProjects(prev => prev.filter(project => project.id !== id))
    } catch (err) {
      setError('プロジェクトの削除に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

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
  }
}