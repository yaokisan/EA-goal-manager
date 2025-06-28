/**
 * タスクリストコンポーネント
 * 
 * 設計参照: UI-requirements.md § 5 タスクリスト機能
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - TaskCard: タスクカード表示
 * - useTasks: タスク管理フック
 * - useProjects: プロジェクト管理フック
 * 
 * 実装要件:
 * - Notion風インライン編集
 * - 複数選択・一括操作
 * - 完了タスクの折りたたみ表示
 * - タスク追加機能
 */

'use client'

import { useState } from 'react'
import { Task, Project } from '@/types'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import TaskCard from './TaskCard'
import Button from '@/components/ui/Button'

interface TaskListProps {
  projectId?: string
  showAddButton?: boolean
  title?: string
}

export default function TaskList({ 
  projectId, 
  showAddButton = true,
  title = 'タスクリスト'
}: TaskListProps) {
  const { tasks, createTask, updateTask, deleteTask, toggleTaskStatus, copyTasksToNotion, loading } = useTasks(projectId)
  const { projects } = useProjects()
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [showCompleted, setShowCompleted] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const pendingTasks = tasks.filter(task => task.status === 'pending')
  const completedTasks = tasks.filter(task => task.status === 'completed')

  const getProjectForTask = (task: Task): Project | undefined => {
    return projects.find(p => p.id === task.project_id)
  }

  // タスクに関連するプロジェクトのメンバーを取得
  const getAvailableMembersForTask = (task: Task): string[] => {
    const taskProject = getProjectForTask(task)
    return taskProject?.members || []
  }

  // 新規タスク作成時の利用可能メンバーを取得
  const getAvailableMembersForNewTask = (): string[] => {
    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      return project?.members || []
    }
    // プロジェクト指定がない場合は全プロジェクトのメンバーを統合
    const allMembers = new Set<string>()
    projects.forEach(project => {
      project.members?.forEach(member => allMembers.add(member))
    })
    return Array.from(allMembers)
  }

  const handleAddTask = async (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
    try {
      await createTask(data)
      setIsAddingTask(false)
    } catch (error) {
      console.error('タスク作成エラー:', error)
    }
  }

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId)
  }

  const handleSaveTask = async (taskId: string, data: Partial<Task>) => {
    try {
      await updateTask(taskId, data)
      setEditingTaskId(null)
    } catch (error) {
      console.error('タスク更新エラー:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setIsAddingTask(false)
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
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMultiSelectMode}
          >
            {isMultiSelectMode ? '選択終了' : '複数選択'}
          </Button>
          
          {/* 一括コピーボタン */}
          {isMultiSelectMode && selectedTaskIds.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkCopy}
            >
              選択をコピー ({selectedTaskIds.length})
            </Button>
          )}
          
          {/* タスク追加ボタン */}
          {showAddButton && !isAddingTask && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddingTask(true)}
            >
              + タスク追加
            </Button>
          )}
        </div>
      </div>

      {/* 新規タスク追加フォーム */}
      {isAddingTask && (
        <div className="mb-4">
          <NewTaskForm
            projectId={projectId}
            projects={projects}
            availableMembers={getAvailableMembersForNewTask()}
            onSave={handleAddTask}
            onCancel={handleCancelEdit}
            loading={loading}
          />
        </div>
      )}

      {/* 未完了タスクリスト */}
      <div className="space-y-3">
        {pendingTasks.map(task => (
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
        ))}
      </div>

      {/* 完了タスクセクション */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
          >
            <span className={`transform transition-transform ${showCompleted ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span>Done ({completedTasks.length})</span>
          </button>
          
          {showCompleted && (
            <div className="space-y-3">
              {completedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={getProjectForTask(task)}
                  availableMembers={getAvailableMembersForTask(task)}
                  onToggleStatus={() => toggleTaskStatus(task.id)}
                  onCopy={() => handleCopyTask(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 空状態 */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>タスクがありません</p>
          {showAddButton && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddingTask(true)}
              className="mt-2"
            >
              最初のタスクを作成
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// 新規タスク作成フォームコンポーネント
interface NewTaskFormProps {
  projectId?: string
  projects: Project[]
  availableMembers: string[]
  onSave: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>) => void
  onCancel: () => void
  loading: boolean
}

function NewTaskForm({ projectId, projects, availableMembers, onSave, onCancel, loading }: NewTaskFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    project_id: projectId || (projects[0]?.id || ''),
    assignee: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1週間後
    status: 'pending' as const,
  })

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onSave(formData)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="border-2 border-blue-300 rounded-lg p-3 bg-blue-50">
      <div className="space-y-3">
        {/* タスク名 */}
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onKeyDown={handleKeyDown}
          className="w-full font-medium bg-white border border-gray-300 rounded px-3 py-2"
          placeholder="タスク名を入力"
          autoFocus
        />
        
        {/* メタ情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {!projectId && (
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          {availableMembers.length > 0 ? (
            <select
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">担当者を選択</option>
              {availableMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="担当者"
            />
          )}
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        
        {/* ボタン */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Enterで保存、Escでキャンセル
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" onClick={onCancel}>
              キャンセル
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? '作成中...' : '作成'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}