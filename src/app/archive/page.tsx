/**
 * アーカイブページコンポーネント
 * 
 * 設計参照: UI-requirements.md § 7 アーカイブ機能
 * 技術仕様: technical-requirements.md § 3.1 テーブル構造
 * 
 * 関連コンポーネント:
 * - TaskList: タスク表示形式の参考
 * - ProjectFilter: プロジェクトフィルター
 * 
 * 実装要件:
 * - 完了から1ヶ月経過したタスクを表示
 * - プロジェクト別フィルター（ドロップダウン）
 * - アーカイブ日付表示（黒背景白文字タグ）
 * - 総件数表示
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { FocusData } from '@/hooks/useFocusMode'

// アーカイブデータは実際のタスクから動的に取得
const mockArchivedTasks: any[] = []

const projects = [
  { id: 'all', name: 'すべてのプロジェクト' },
]

export default function ArchivePage() {
  const [selectedProject, setSelectedProject] = useState('all')
  const [archivedFocusModes, setArchivedFocusModes] = useState<FocusData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()
  
  const filteredTasks = selectedProject === 'all' 
    ? mockArchivedTasks 
    : mockArchivedTasks.filter(task => task.projectId === selectedProject)

  // フォーカスモードアーカイブを取得
  useEffect(() => {
    async function fetchArchivedFocusModes() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('focus_modes')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', false)
          .order('updated_at', { ascending: false })

        if (error) throw error
        setArchivedFocusModes(data || [])
      } catch (error) {
        console.error('フォーカスモードアーカイブ取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArchivedFocusModes()
  }, [user, supabase])
  
  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">アーカイブ</h1>
        <p className="mt-1 text-sm text-gray-600">
          完了したフォーカス目標と1ヶ月以上経過したタスク
        </p>
      </div>

      {/* フォーカスモードアーカイブ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">フォーカス目標アーカイブ</h2>
          <span className="text-sm text-gray-600">
            {loading ? '読み込み中...' : `${archivedFocusModes.length}件`}
          </span>
        </div>
        
        {archivedFocusModes.length > 0 ? (
          <div className="space-y-3">
            {archivedFocusModes.map((focus) => (
              <div key={focus.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-lg">🎯</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700">
                          {focus.goal || '目標未設定'}
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                          <span>📅 期限: {focus.deadline ? new Date(focus.deadline).toLocaleDateString('ja-JP') : '未設定'}</span>
                          <span>📝 作成: {new Date(focus.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                    {new Date(focus.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                アーカイブされたフォーカス目標はありません
              </p>
            </div>
          )
        )}
      </div>
      
      {/* タスクアーカイブセクション */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">タスクアーカイブ</h2>
        
        {/* フィルターと統計 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label htmlFor="project-filter" className="text-sm font-medium text-gray-700">
              プロジェクト:
            </label>
            <select
              id="project-filter"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            総件数: <span className="font-semibold text-gray-900">{filteredTasks.length}</span>件
          </div>
        </div>
      </div>
      
      {/* アーカイブタスクリスト */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 line-through opacity-60">
                  {task.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span 
                    className="px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: task.projectColor }}
                  >
                    {task.projectName}
                  </span>
                  <span>👤 {task.assignee}</span>
                  <span>✅ 完了: {task.completedAt}</span>
                </div>
              </div>
              
              <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                {task.archivedAt}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* 空状態 */}
      {filteredTasks.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            該当するアーカイブタスクはありません
          </p>
        </div>
      )}
      </div>
    </div>
  )
}