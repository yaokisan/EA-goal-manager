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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers'
import SortableTaskCard from './SortableTaskCard'

interface TaskListProps {
  projectId?: string
  showAddButton?: boolean
  title?: string
  tasks?: any[]
  updateTask?: (id: string, data: any) => Promise<void>
  toggleTaskStatus?: (id: string) => Promise<void>
  copyTasksToNotion?: (taskIds: string[]) => string
  createTask?: (data: any) => Promise<any>
  deleteTask?: (id: string) => Promise<void>
  loading?: boolean
}

export default function TaskList({ 
  projectId, 
  showAddButton = true,
  title = 'タスクリスト',
  tasks: propTasks,
  updateTask: propUpdateTask,
  toggleTaskStatus: propToggleTaskStatus,
  copyTasksToNotion: propCopyTasksToNotion,
  createTask: propCreateTask,
  deleteTask: propDeleteTask,
  loading: propLoading
}: TaskListProps) {
  // フォールバック用のuseTasks（propsが渡されない場合のみ使用）
  const fallbackUseTasks = useTasks(projectId)
  const { projects } = useProjects()
  
  // propsから渡された値があればそれを使用、なければフォールバック
  const tasks = propTasks ?? fallbackUseTasks.tasks
  const createTask = propCreateTask ?? fallbackUseTasks.createTask
  const updateTask = propUpdateTask ?? fallbackUseTasks.updateTask
  const deleteTask = propDeleteTask ?? fallbackUseTasks.deleteTask
  const toggleTaskStatus = propToggleTaskStatus ?? fallbackUseTasks.toggleTaskStatus
  const copyTasksToNotion = propCopyTasksToNotion ?? fallbackUseTasks.copyTasksToNotion
  const loading = propLoading ?? fallbackUseTasks.loading
  const updateMultipleTaskOrder = fallbackUseTasks.updateMultipleTaskOrder
  
  // ドラッグ&ドロップセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [showCompleted, setShowCompleted] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  // プロジェクト別フィルタリング処理（propsでtasksが渡された場合）
  const filteredTasks = propTasks ? (
    projectId ? propTasks.filter(task => task.project_id === projectId) : propTasks
  ) : tasks
  
  const pendingTasks = filteredTasks.filter(task => task.status === 'pending')
  const completedTasks = filteredTasks.filter(task => task.status === 'completed')
  

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

  // ドラッグ終了時の処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    
    if (!over || active.id === over.id) {
      return
    }
    
    const activeIndex = pendingTasks.findIndex(task => task.id === active.id)
    const overIndex = pendingTasks.findIndex(task => task.id === over.id)
    
    
    if (activeIndex !== -1 && overIndex !== -1) {
      try {
        // 新しいorder_indexを計算してデータベースを更新
        const newTasks = arrayMove(pendingTasks, activeIndex, overIndex)
        const updates = newTasks.map((task, index) => ({
          id: task.id,
          order_index: index + 1
        }))
        
        await updateMultipleTaskOrder(updates)
      } catch (error) {
        console.error('❌ タスク順序更新エラー:', error)
        // エラー時は元に戻すか、データを再取得する
      }
    }
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
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext 
          items={pendingTasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <SortableTaskCard
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
                isMultiSelectMode={isMultiSelectMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
      {filteredTasks.length === 0 && (
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
    assignees: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1週間後
    status: 'pending' as const,
    order_index: null as number | null,
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
            <div className="space-y-1">
              <div className="text-xs text-gray-600">担当者 (複数選択可)</div>
              <div className="max-h-20 overflow-y-auto border border-gray-300 rounded p-1">
                {availableMembers.map((member) => (
                  <label key={member} className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.assignees.includes(member)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ 
                            ...formData, 
                            assignees: [...formData.assignees, member] 
                          })
                        } else {
                          setFormData({ 
                            ...formData, 
                            assignees: formData.assignees.filter(a => a !== member) 
                          })
                        }
                      }}
                      className="w-3 h-3"
                    />
                    <span>{member}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">担当者 (カンマ区切り)</div>
              <input
                type="text"
                value={formData.assignees.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  assignees: e.target.value.split(',').map(a => a.trim()).filter(a => a) 
                })}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                placeholder="担当者 (複数の場合はカンマ区切り)"
              />
            </div>
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