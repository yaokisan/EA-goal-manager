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

import { useState } from 'react'

// 仮のアーカイブデータ
const mockArchivedTasks = [
  {
    id: '1',
    name: '初期設計書作成',
    projectId: '1',
    projectName: 'プロジェクトA',
    projectColor: '#667eea',
    completedAt: '2024-03-15',
    archivedAt: '2024-04-15',
    assignee: '山田太郎',
  },
  {
    id: '2',
    name: 'APIエンドポイント実装',
    projectId: '1',
    projectName: 'プロジェクトA',
    projectColor: '#667eea',
    completedAt: '2024-03-20',
    archivedAt: '2024-04-20',
    assignee: '鈴木花子',
  },
  {
    id: '3',
    name: '要件定義書レビュー',
    projectId: '2',
    projectName: 'プロジェクトB',
    projectColor: '#ed8936',
    completedAt: '2024-03-10',
    archivedAt: '2024-04-10',
    assignee: '佐藤次郎',
  },
]

const projects = [
  { id: 'all', name: 'すべてのプロジェクト' },
  { id: '1', name: 'プロジェクトA' },
  { id: '2', name: 'プロジェクトB' },
]

export default function ArchivePage() {
  const [selectedProject, setSelectedProject] = useState('all')
  
  const filteredTasks = selectedProject === 'all' 
    ? mockArchivedTasks 
    : mockArchivedTasks.filter(task => task.projectId === selectedProject)
  
  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">アーカイブ</h1>
        <p className="mt-1 text-sm text-gray-600">
          完了から1ヶ月以上経過したタスク
        </p>
      </div>
      
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
  )
}