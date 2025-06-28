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

import { useState, useEffect } from 'react'
import TaskList from '@/components/tasks/TaskList'
import TaskCard from '@/components/tasks/TaskCard'
import ProjectTabs from '@/components/dashboard/ProjectTabs'
import GanttChart from '@/components/gantt/GanttChart'
import FocusMode from '@/components/focus/FocusMode'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useFocusMode } from '@/hooks/useFocusMode'

// デバッグ機能の読み込み（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  import('@/lib/debug/supabaseTest')
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [focusMode, setFocusMode] = useState(false)
  const { tasks, getRecentTasks } = useTasks()
  const { projects } = useProjects()

  const getProjectIdForFilter = () => {
    if (activeTab === 'recent' || activeTab === 'all') {
      return undefined
    }
    return activeTab
  }

  const { getTaskStats } = useFocusMode(getProjectIdForFilter())

  // フォーカスモード状態をローカルストレージから復元
  useEffect(() => {
    const savedFocusMode = localStorage.getItem('focusMode')
    if (savedFocusMode !== null) {
      setFocusMode(JSON.parse(savedFocusMode))
    }
    
    // アクティブタブの状態をローカルストレージから復元
    const savedActiveTab = localStorage.getItem('activeTab')
    if (savedActiveTab) {
      setActiveTab(savedActiveTab)
    }
  }, [])

  // フォーカスモード状態の変更をローカルストレージに保存
  const handleFocusModeToggle = () => {
    const newFocusMode = !focusMode
    setFocusMode(newFocusMode)
    localStorage.setItem('focusMode', JSON.stringify(newFocusMode))
  }

  // タブ変更時にローカルストレージに保存
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    localStorage.setItem('activeTab', tabId)
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

  const getFilteredTasksForGantt = () => {
    if (activeTab === 'recent') {
      return getRecentTasks()
    } else if (activeTab === 'all') {
      return tasks
    } else {
      return tasks.filter(task => task.project_id === activeTab)
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
        onTabChange={handleTabChange}
        focusMode={focusMode}
        onFocusModeToggle={handleFocusModeToggle}
      />
      
      {/* フォーカスモード表示エリア */}
      <FocusMode 
        isVisible={focusMode}
        onClose={() => {
          setFocusMode(false)
          localStorage.setItem('focusMode', JSON.stringify(false))
        }}
      />
      
      {/* ガントチャートとタスクリスト */}
      <div className="space-y-6">
        {/* ガントチャート */}
        <GanttChart
          tasks={getFilteredTasksForGantt()}
          projects={projects}
          activeTab={activeTab}
          focusMode={focusMode}
          taskStats={getTaskStats(getFilteredTasksForGantt(), activeTab)}
        />
        
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
  if (activeTab === 'recent') {
    return (
      <RecentTaskList title={title} />
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

// 直近1週間タスクリストコンポーネント
interface RecentTaskListProps {
  title: string
}

function RecentTaskList({ title }: RecentTaskListProps) {
  const { getRecentTasks, updateTask, toggleTaskStatus, copyTasksToNotion } = useTasks()
  const { projects } = useProjects()
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const recentTasks = getRecentTasks()

  const getProjectForTask = (task: any) => {
    return projects.find(p => p.id === task.project_id)
  }

  // タスクに関連するプロジェクトのメンバーを取得
  const getAvailableMembersForTask = (task: any): string[] => {
    const taskProject = getProjectForTask(task)
    return taskProject?.members || []
  }

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId)
  }

  const handleSaveTask = async (taskId: string, data: any) => {
    try {
      await updateTask(taskId, data)
      setEditingTaskId(null)
    } catch (error) {
      console.error('タスク更新エラー:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
  }

  const handleSelectTask = (taskId: string) => {
    if (!isMultiSelectMode) return
    
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleCopyTask = (taskId: string) => {
    copyTasksToNotion([taskId])
    showCopyFeedback()
  }

  const handleBulkCopy = () => {
    copyTasksToNotion(selectedTaskIds)
    setSelectedTaskIds([])
    setIsMultiSelectMode(false)
    showCopyFeedback()
  }

  const showCopyFeedback = () => {
    setCopyFeedback('コピー済み')
    setTimeout(() => setCopyFeedback(null), 1500)
  }

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    setSelectedTaskIds([])
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center space-x-2">
          {/* コピーフィードバック */}
          {copyFeedback && (
            <span className="text-sm text-green-600 font-medium">
              {copyFeedback}
            </span>
          )}
          
          {/* 複数選択モード */}
          <button
            onClick={toggleMultiSelectMode}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {isMultiSelectMode ? '選択終了' : '複数選択'}
          </button>
          
          {/* 一括コピーボタン */}
          {isMultiSelectMode && selectedTaskIds.length > 0 && (
            <button
              onClick={handleBulkCopy}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              選択をコピー ({selectedTaskIds.length})
            </button>
          )}
        </div>
      </div>

      {/* タスクリスト */}
      <div className="space-y-3">
        {recentTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>直近1週間に期限が迫っているタスクはありません</p>
          </div>
        ) : (
          recentTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              project={getProjectForTask(task)}
              availableMembers={getAvailableMembersForTask(task)}
              isEditing={editingTaskId === task.id}
              isSelected={selectedTaskIds.includes(task.id)}
              onEdit={() => handleEditTask(task.id)}
              onSave={(data) => handleSaveTask(task.id, data)}
              onCancel={handleCancelEdit}
              onToggleStatus={() => toggleTaskStatus(task.id)}
              onSelect={() => handleSelectTask(task.id)}
              onCopy={() => handleCopyTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}