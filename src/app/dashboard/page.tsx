/**
 * ダッシュボードページコンポーネント
 * 
 * 設計参照: UI-requirements.md § 3 ダッシュボード機能
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - ProjectTabs: プロジェクトタブ
 * - FocusMode: フォーカスモード
 * - GanttChart: ガントチャート
 * - TaskList: タスクリスト
 * 
 * 実装要件:
 * - プロジェクトタブ切り替え
 * - フォーカスモード表示/非表示
 * - ガントチャートとタスクリストの並列表示
 */

'use client'

import { useState } from 'react'
import TaskList from '@/components/tasks/TaskList'
import ProjectTabs from '@/components/dashboard/ProjectTabs'
import { useTasks } from '@/hooks/useTasks'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('recent')
  const [focusMode, setFocusMode] = useState(false)
  const { getRecentTasks } = useTasks()

  const getProjectIdForFilter = () => {
    if (activeTab === 'recent' || activeTab === 'all') {
      return undefined
    }
    return activeTab
  }

  const getTaskListTitle = () => {
    switch (activeTab) {
      case 'recent':
        return '直近1週間のタスク'
      case 'all':
        return 'すべてのタスク'
      default:
        return 'プロジェクトのタスク'
    }
  }

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-600">
          プロジェクトとタスクを管理
        </p>
      </div>
      
      {/* プロジェクトタブ */}
      <ProjectTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        focusMode={focusMode}
        onFocusModeToggle={() => setFocusMode(!focusMode)}
      />
      
      {/* フォーカスモード表示エリア */}
      {focusMode && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white animate-pulse">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🎯</span>
                <span className="font-semibold">フォーカス期限：2024年5月15日</span>
              </div>
              <p className="text-lg">新機能リリースまでにすべてのバグを修正する</p>
            </div>
            <button className="text-white/80 hover:text-white">
              編集
            </button>
          </div>
        </div>
      )}
      
      {/* ガントチャートとタスクリスト */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ガントチャート（仮実装） */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">ガントチャート</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <span>📋</span>
                <span className="font-medium">8/12</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📈</span>
                <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">67%</span>
              </div>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-500">
            ガントチャート実装予定
          </div>
        </div>
        
        {/* タスクリスト */}
        <FilteredTaskList
          activeTab={activeTab}
          projectId={getProjectIdForFilter()}
          title={getTaskListTitle()}
        />
      </div>
    </div>
  )
}

// フィルタリングされたタスクリストコンポーネント
interface FilteredTaskListProps {
  activeTab: string
  projectId?: string
  title: string
}

function FilteredTaskList({ activeTab, projectId, title }: FilteredTaskListProps) {
  const { getRecentTasks } = useTasks()

  if (activeTab === 'recent') {
    const recentTasks = getRecentTasks()
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>直近1週間に期限が迫っているタスクはありません</p>
            </div>
          ) : (
            recentTasks.map(task => (
              <div key={task.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="font-medium text-red-900">{task.name}</div>
                <div className="text-sm text-red-700 mt-1">
                  期限: {new Date(task.end_date).toLocaleDateString('ja-JP')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <TaskList
      projectId={projectId}
      title={title}
      showAddButton={true}
    />
  )
}