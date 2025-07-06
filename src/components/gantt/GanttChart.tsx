/**
 * ガントチャートコンポーネント
 * 
 * 設計参照: UI-requirements.md § 4 ガントチャート機能
 * 技術仕様: technical-requirements.md § 4.3 ガントチャート実装
 * 
 * 関連コンポーネント:
 * - Dashboard: ダッシュボードページ
 * - useTasks: タスク管理フック
 * - useProjects: プロジェクト管理フック
 * 
 * 実装要件:
 * - モダンなDIVベースレンダリング
 * - タスクバー表示（期間・ドラッグ可能）
 * - プロジェクト色分け
 * - 期間選択機能
 * - フォーカスモード対応
 */

'use client'

import { useMemo, useState, useEffect } from 'react'
import { Task, Project } from '@/types'
import { useFocusMode } from '@/hooks/useFocusMode'
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
import SortableGanttTask from './SortableGanttTask'
import TaskEditModal from '@/components/tasks/TaskEditModal'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'

interface GanttChartProps {
  tasks: Task[]
  projects: Project[]
  width?: number
  height?: number
  activeTab?: string
  focusMode?: boolean
  taskStats?: {
    total: number
    completed: number
    remaining: number
    progress: number
  }
  onTaskOrderChange?: (updates: { id: string; order_index: number }[], projectId?: string) => Promise<void>
  updateTask?: (id: string, data: Partial<Task>) => Promise<void>
  toggleTaskStatus?: (id: string) => Promise<void>
  deleteTask?: (id: string) => Promise<void>
  toggleTaskArchive?: (id: string) => Promise<void>
  projectId?: string
}

interface GanttTask {
  id: string
  name: string
  assignees: string[]
  startDate: Date
  endDate: Date
  color: string
  projectName: string
  avatar: string
  project: Project
  status: string
}

// 期間選択のオプション
const PERIOD_OPTIONS = [
  { value: '1month', label: '1ヶ月', days: 30 },
  { value: '2months', label: '2ヶ月', days: 60 },
  { value: '3months', label: '3ヶ月', days: 90 },
  { value: 'custom', label: 'カスタム', days: 0 }
]

// アバター生成関数
const getAvatarColor = (name: string) => {
  const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

const getAvatarInitials = (name: string) => {
  if (!name) return '?'
  return name.split('').slice(0, 2).join('').toUpperCase()
}

export default function GanttChart({ 
  tasks, 
  projects, 
  activeTab = 'all',
  focusMode = false,
  taskStats = { total: 0, completed: 0, remaining: 0, progress: 0 },
  onTaskOrderChange,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  toggleTaskArchive,
  projectId
}: GanttChartProps) {
  // ドラッグ&ドロップセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('2months')
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  
  // ガントチャート編集用の状態
  const [isDraggingGantt, setIsDraggingGantt] = useState(false)
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null)
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null)
  const { focusData } = useFocusMode()
  const { projects: allProjects } = useProjects()
  

  // X座標から日付を計算する関数
  const xToDate = (x: number, containerWidth: number) => {
    const percent = (x / containerWidth) * 100
    const daysDiff = (percent / 100) * actualTotalDays - 0.5 // 0.5はセンターオフセット
    const resultDate = new Date(minDate.getTime() + daysDiff * 24 * 60 * 60 * 1000)
    // 日付のみに正規化
    return new Date(resultDate.getFullYear(), resultDate.getMonth(), resultDate.getDate())
  }

  // ガントチャートドラッグ開始
  const handleGanttDragStart = (e: React.MouseEvent, taskId: string, type: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation()
    e.preventDefault()
    
    setIsDraggingGantt(true)
    setDraggedTask(taskId)
    setDragType(type)
    setDragStartX(e.clientX)
    
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setDragStartDate(new Date(task.start_date))
      setDragEndDate(new Date(task.end_date))
    }
  }

  // ガントチャートドラッグ中
  const handleGanttDragMove = (e: React.MouseEvent) => {
    if (!isDraggingGantt || !draggedTask) return
    
    e.preventDefault()
    
    const container = e.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()
    const deltaX = e.clientX - dragStartX
    const containerWidth = rect.width
    const daysDelta = Math.round((deltaX / containerWidth) * actualTotalDays)
    
    const originalTask = tasks.find(t => t.id === draggedTask)
    if (!originalTask) return
    
    const originalStartDate = new Date(originalTask.start_date)
    const originalEndDate = new Date(originalTask.end_date)
    
    if (dragType === 'move') {
      // タスク全体を移動
      const newStartDate = new Date(originalStartDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
      const newEndDate = new Date(originalEndDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
      
      setDragStartDate(newStartDate)
      setDragEndDate(newEndDate)
    } else if (dragType === 'resize-start') {
      // 開始日のみ変更
      const newStartDate = new Date(originalStartDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
      if (newStartDate < originalEndDate) {
        setDragStartDate(newStartDate)
        setDragEndDate(originalEndDate)
      }
    } else if (dragType === 'resize-end') {
      // 終了日のみ変更
      const newEndDate = new Date(originalEndDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
      if (newEndDate > originalStartDate) {
        setDragStartDate(originalStartDate)
        setDragEndDate(newEndDate)
      }
    }
  }

  // ガントチャートドラッグ終了
  const handleGanttDragEnd = async () => {
    if (!isDraggingGantt || !draggedTask || !dragStartDate || !dragEndDate || !updateTask) {
      resetDragState()
      return
    }

    try {
      const startDateStr = dragStartDate.toISOString().split('T')[0]
      const endDateStr = dragEndDate.toISOString().split('T')[0]
      
      await updateTask(draggedTask, {
        start_date: startDateStr,
        end_date: endDateStr
      })
    } catch (error) {
      console.error('ガントチャート編集エラー:', error)
    }

    resetDragState()
  }

  // ドラッグ状態をリセット
  const resetDragState = () => {
    setIsDraggingGantt(false)
    setDraggedTask(null)
    setDragType(null)
    setDragStartX(0)
    setDragStartDate(null)
    setDragEndDate(null)
  }

  // ドラッグ終了時の処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    
    if (!over || active.id === over.id || !onTaskOrderChange) {
      return
    }
    
    // 直近1週間タブではドラッグ&ドロップによる並び替えを無効化
    if (activeTab === 'recent') {
      return
    }
    
    const activeIndex = ganttTasks.findIndex(task => task.id === active.id)
    const overIndex = ganttTasks.findIndex(task => task.id === over.id)
    
    
    if (activeIndex !== -1 && overIndex !== -1) {
      // 新しい順序での配列を作成
      const newTasks = arrayMove(ganttTasks, activeIndex, overIndex)
      
      try {
        // order_indexを更新
        const updates = newTasks.map((task, index) => ({
          id: task.id,
          order_index: index + 1
        }))
        
        await onTaskOrderChange(updates, projectId)
      } catch (error) {
        console.error('❌ ガントチャートタスク順序更新エラー:', error)
      }
    }
  }

  // タスクデータをガントチャート用に変換
  const ganttTasks = useMemo((): GanttTask[] => {
    return tasks.map(task => {
      const project = projects.find(p => p.id === task.project_id)
      
      // 日付を正規化して時間による誤差を防ぐ
      const startDate = new Date(task.start_date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(task.end_date)
      endDate.setHours(0, 0, 0, 0)
      
      return {
        id: task.id,
        name: task.name,
        assignees: task.assignees || [],
        startDate,
        endDate,
        color: project?.color || '#6B7280',
        projectName: project?.name || 'Unknown',
        avatar: task.assignees && task.assignees.length > 0 ? task.assignees[0] : '未割当',
        project: project!,
        status: task.status
      }
    })
  }, [tasks, projects])

  // 直近1週間タブの場合は終了日が近い順にソート
  const sortedGanttTasks = useMemo(() => {
    if (activeTab === 'recent') {
      return [...ganttTasks].sort((a, b) => {
        // 終了日が近い順（昇順）
        return a.endDate.getTime() - b.endDate.getTime()
      })
    }
    return ganttTasks
  }, [ganttTasks, activeTab])

  // 完了タスクと未完了タスクを分離
  const activeTasks = sortedGanttTasks.filter(task => task.status !== 'completed')
  const completedTasks = sortedGanttTasks.filter(task => task.status === 'completed')

  // 表示期間を決定
  const { minDate, maxDate, totalDays } = useMemo(() => {
    // タイムゾーンに依存しない日付計算
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    
    let resultMinDate: Date, resultMaxDate: Date
    
    // 直近1週間タブの場合は本日から1週間固定（基準点を他のタブと統一するため1週間前から開始）
    if (activeTab === 'recent') {
      resultMinDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
      resultMaxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6)
    }
    else if (focusMode && focusData?.deadline) {
      // フォーカスモードの場合、1週間前から期限までの期間を表示
      const deadline = new Date(focusData.deadline)
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
      
      // 1週間前から開始（通常モードと同じ）
      resultMinDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
      resultMaxDate = deadlineDate
    }
    else {
      // 通常モード：選択された期間
      const selectedOption = PERIOD_OPTIONS.find(opt => opt.value === selectedPeriod)
      
      if (selectedOption && selectedOption.value !== 'custom') {
        // 通常の期間選択（1ヶ月、2ヶ月、3ヶ月）- 1ヶ月前から開始に変更
        resultMinDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        resultMaxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + selectedOption.days)
      }
      else {
        // カスタムモード：タスクの期間に基づく（1ヶ月前〜タスク終了後まで拡張）
        if (ganttTasks.length === 0) {
          resultMinDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          resultMaxDate = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate())
        }
        else {
          const allDates = ganttTasks.flatMap(task => [task.startDate, task.endDate])
          const taskMinDate = new Date(Math.min(...allDates.map(d => d.getTime())))
          const taskMaxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
          
          // 1ヶ月前から開始、必要に応じてさらに拡張
          const oneMonthBefore = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          const twoMonthsAfter = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate())
          
          // カスタムモードでは1ヶ月前から開始、必要に応じてさらに拡張
          const minTime = taskMinDate.getTime() < oneMonthBefore.getTime() 
            ? taskMinDate.getTime() - 7 * 24 * 60 * 60 * 1000 // タスク開始の1週間前
            : oneMonthBefore.getTime()
          const maxTime = Math.max(taskMaxDate.getTime() + 7 * 24 * 60 * 60 * 1000, twoMonthsAfter.getTime())
          
          resultMinDate = new Date(minTime)
          resultMaxDate = new Date(maxTime)
        }
      }
    }
    
    // 日付のみで作成されているため、正規化不要
    
    const result = {
      minDate: resultMinDate,
      maxDate: resultMaxDate,
      totalDays: 0 // 日付グリッドで計算される実際の日数を使用
    }
    
    
    return result
  }, [ganttTasks, selectedPeriod, focusMode, focusData, activeTab])

  // 日付グリッドを生成し、実際の総日数を計算
  const { dateGrid, actualTotalDays } = useMemo(() => {
    // 期間計算と同じ方法で総日数を計算
    const calculatedTotalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // minDateからmaxDateまでの全ての日付を生成
    const allDays = []
    let currentDay = new Date(minDate)
    
    while (currentDay <= maxDate) {
      allDays.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }
    
    // 月ごとにグループ化
    const monthGroups = new Map()
    allDays.forEach(day => {
      const monthKey = `${day.getFullYear()}-${day.getMonth() + 1}`
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, {
          year: day.getFullYear(),
          month: day.getMonth() + 1,
          days: []
        })
      }
      monthGroups.get(monthKey).days.push(new Date(day))
    })
    
    // グリッドを構築
    const grid: Array<{
      year: number
      month: number
      days: Date[]
      startDate: Date
      endDate: Date
    }> = []
    let totalDaysInGrid = 0
    
    monthGroups.forEach(monthInfo => {
      grid.push({
        ...monthInfo,
        startDate: new Date(monthInfo.days[0]),
        endDate: new Date(monthInfo.days[monthInfo.days.length - 1])
      })
      totalDaysInGrid += monthInfo.days.length
    })
    
    
    return {
      dateGrid: grid,
      actualTotalDays: calculatedTotalDays // 期間計算と一致させる
    }
  }, [minDate, maxDate])

  // 日付を固定ピクセル位置に変換（タイムゾーン対応）
  const dateToPixels = (date: Date) => {
    // タイムゾーンに依存しない日付のみで計算
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const baseDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    
    // 日単位での差分を計算
    const daysDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // 1日30px固定 + セルの中央に配置するため15pxオフセット
    const pixels = daysDiff * 30 + 15
    
    return Math.max(0, pixels)
  }

  // 今日の位置を計算（タイムゾーン対応）
  const now = new Date()
  const todayForCalc = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayPixels = dateToPixels(todayForCalc)
  
  // グローバルマウスイベントリスナー（actualTotalDays定義後）
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingGantt) {
        // コンテナを見つけてhandleGanttDragMoveを呼び出す
        const container = document.querySelector('[data-gantt-container]')
        if (container) {
          const rect = container.getBoundingClientRect()
          const deltaX = e.clientX - dragStartX
          const containerWidth = rect.width
          const daysDelta = Math.round((deltaX / containerWidth) * actualTotalDays)
          
          
          const originalTask = tasks.find(t => t.id === draggedTask)
          if (!originalTask) return
          
          const originalStartDate = new Date(originalTask.start_date)
          const originalEndDate = new Date(originalTask.end_date)
          
          if (dragType === 'move') {
            const newStartDate = new Date(originalStartDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
            const newEndDate = new Date(originalEndDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
            setDragStartDate(newStartDate)
            setDragEndDate(newEndDate)
          } else if (dragType === 'resize-start') {
            const newStartDate = new Date(originalStartDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
            if (newStartDate < originalEndDate) {
              setDragStartDate(newStartDate)
              setDragEndDate(originalEndDate)
            }
          } else if (dragType === 'resize-end') {
            const newEndDate = new Date(originalEndDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
            if (newEndDate > originalStartDate) {
              setDragStartDate(originalStartDate)
              setDragEndDate(newEndDate)
            }
          }
        }
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingGantt) {
        handleGanttDragEnd()
      }
    }

    if (isDraggingGantt) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDraggingGantt, dragStartX, dragType, draggedTask, tasks, actualTotalDays])

  // プロジェクト別の凡例
  const projectsInUse = Array.from(new Set(ganttTasks.map(task => task.project)))
    .filter(project => project)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* ヘッダー部分 */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">プロジェクトタイムライン</h2>
          
          <div className="flex items-center space-x-6">
            {/* 期間選択 */}
            {!focusMode && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">表示期間:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  {PERIOD_OPTIONS.map(option => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* プロジェクト凡例 */}
            <div className="flex items-center space-x-4">
              {projectsInUse.map(project => (
                <div key={project.id} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-medium">{project.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* メインコンテンツ */}
      <div className="flex">
        {/* 左側: タスクリスト */}
        <div className="w-80 bg-gray-50 border-r border-gray-200">
          {/* タスクヘッダー - 右側のヘッダー高さに合わせる */}
          <div className="bg-gray-100 border-b border-gray-200">
            <div className="p-2 text-center bg-blue-50" style={{ height: '40px' }}>
              <h3 className="font-semibold text-gray-900 text-sm">タスク</h3>
            </div>
            <div className="flex border-t border-gray-200 bg-gray-100" style={{ height: '40px' }}>
              <button
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className="flex-1 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className={`mr-2 text-gray-400 transition-transform ${showCompletedTasks ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                <span className="text-xs font-semibold text-gray-600">
                  Done {completedTasks.length > 0 && `(${completedTasks.length})`}
                </span>
              </button>
            </div>
          </div>
          
          {/* タスク一覧 */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext 
              items={showCompletedTasks ? [...completedTasks, ...activeTasks].map(task => task.id) : activeTasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-200">
                {/* 完了タスク（展開時のみ表示） */}
                {showCompletedTasks && completedTasks.map((task, index) => (
                  <SortableGanttTask
                    key={task.id}
                    task={task}
                    isSelected={selectedTask === task.id}
                    onSelect={() => {
                      const originalTask = tasks.find(t => t.id === task.id)
                      if (originalTask) {
                        setEditingTask(originalTask)
                      }
                    }}
                    onToggleStatus={toggleTaskStatus ? () => toggleTaskStatus(task.id) : undefined}
                    onDelete={deleteTask ? () => deleteTask(task.id) : undefined}
                    getAvatarColor={getAvatarColor}
                    getAvatarInitials={getAvatarInitials}
                  />
                ))}
                
                {/* アクティブタスク */}
                {activeTasks.map((task, index) => (
                  <SortableGanttTask
                    key={task.id}
                    task={task}
                    isSelected={selectedTask === task.id}
                    onSelect={() => {
                      const originalTask = tasks.find(t => t.id === task.id)
                      if (originalTask) {
                        setEditingTask(originalTask)
                      }
                    }}
                    onToggleStatus={toggleTaskStatus ? () => toggleTaskStatus(task.id) : undefined}
                    onDelete={deleteTask ? () => deleteTask(task.id) : undefined}
                    getAvatarColor={getAvatarColor}
                    getAvatarInitials={getAvatarInitials}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* 右側: タイムライン */}
        <div className="flex-1 overflow-x-auto">
          {/* 月ヘッダー */}
          <div className="bg-blue-50 border-b border-gray-200">
            <div className="flex" style={{ minWidth: `${actualTotalDays * 30}px` }}>
              {dateGrid.map((month, index) => (
                <div 
                  key={`${month.year}-${month.month}`}
                  className="border-r border-gray-200 last:border-r-0 bg-blue-50"
                  style={{
                    width: `${month.days.length * 30}px` // 1日30px固定
                  }}
                >
                  <div className="p-2 text-center bg-blue-50" style={{ height: '40px' }}>
                    <div className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                      {month.year}/{month.month}
                    </div>
                  </div>
                  
                  {/* 日付グリッド */}
                  <div className="flex border-t border-gray-200" style={{ height: '40px' }}>
                    {month.days.map((day, dayIndex) => (
                      <div 
                        key={day.toISOString()}
                        className="text-center flex items-center justify-center border-r border-gray-100 last:border-r-0 bg-blue-50"
                        style={{ 
                          width: '30px' // 1日30px固定
                        }}
                        data-testid={`date-cell-${day.toISOString().split('T')[0]}`}
                      >
                        <div className="text-xs text-gray-600">
                          {day.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* タスクバー */}
          <div 
            className="relative" 
            style={{ minWidth: `${actualTotalDays * 30}px`, minHeight: `${(showCompletedTasks ? completedTasks.length * 56 : 0) + (activeTasks.length * 56)}px` }}
            data-gantt-container
            onMouseMove={handleGanttDragMove}
            onMouseUp={handleGanttDragEnd}
            onMouseLeave={handleGanttDragEnd}
          >
            {/* 今日の線 */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${todayPixels}px` }}
            >
              <div className="absolute -top-12 -left-4 bg-red-500 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap" style={{ fontSize: '10px' }}>
                今日
              </div>
            </div>

            {/* 週末の背景 */}
            {dateGrid.map((month) => 
              month.days.map((day) => {
                const dayOfWeek = day.getDay()
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                  const leftPixels = dateToPixels(day)
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className="absolute top-0 bottom-0 bg-gray-100 opacity-50"
                      style={{
                        left: `${leftPixels - 15}px`, // セル中央オフセットを調整
                        width: '30px' // 1日分の固定幅
                      }}
                    />
                  )
                }
                return null
              })
            )}

            {/* 完了タスクのバー（展開時のみ表示） */}
            {showCompletedTasks && completedTasks.map((task, index) => {
              // ドラッグ中の一時的な日付を使用
              const currentStartDate = (isDraggingGantt && draggedTask === task.id && dragStartDate) 
                ? dragStartDate 
                : task.startDate
              const currentEndDate = (isDraggingGantt && draggedTask === task.id && dragEndDate) 
                ? dragEndDate 
                : task.endDate

              const startPixels = dateToPixels(currentStartDate)
              const endPixels = dateToPixels(currentEndDate)
              const widthPixels = endPixels - startPixels
              const isSelected = selectedTask === task.id
              const isDragged = draggedTask === task.id

              return (
                <div
                  key={task.id}
                  className="absolute flex items-center group"
                  style={{
                    top: `${index * 56 + 16}px`, // 完了タスクは最上部に配置
                    left: `${startPixels}px`,
                    width: `${Math.max(widthPixels, 30)}px`, // 最小30px
                    height: '24px' // 進捗バーの高さ
                  }}
                >
                  {/* タスクバー本体 */}
                  <div
                    className={`relative h-full w-full rounded-lg shadow-sm transition-all duration-200 select-none ${
                      isDragged || (isDraggingGantt && draggedTask === task.id) ? 'cursor-grabbing scale-105 shadow-xl ring-2 ring-blue-400' : 'cursor-move'
                    } ${isSelected ? 'ring-2 ring-gray-400' : ''} hover:shadow-md opacity-60`}
                    style={{ 
                      background: `linear-gradient(135deg, #9CA3AF 0%, #9CA3AFDD 50%, #9CA3AFBB 100%)` // 完了タスクは灰色
                    }}
                    onMouseDown={(e) => {
                      // 左クリックでドラッグ開始
                      if (e.button === 0) { // 左クリック
                        e.preventDefault()
                        setSelectedTask(task.id) // タスクを選択状態にする
                        handleGanttDragStart(e, task.id, 'move')
                      }
                    }}
                    onClick={(e) => {
                      // ドラッグしていない場合のみモーダルを開く
                      if (!isDraggingGantt) {
                        const originalTask = tasks.find(t => t.id === task.id)
                        if (originalTask) {
                          setSelectedTask(task.id) // タスクを選択状態にする
                          setEditingTask(originalTask)
                        }
                      }
                    }}
                  >
                    {/* タスク名 */}
                    {widthPixels > 60 && ( // 60px以上の場合に名前を表示
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                        <span className="text-white text-sm font-medium truncate line-through">
                          {task.name}
                        </span>
                      </div>
                    )}

                    {/* ドラッグ中の日付フィードバック */}
                    {isDraggingGantt && draggedTask === task.id && dragStartDate && dragEndDate && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                        {dragStartDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })} 〜 {dragEndDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                      </div>
                    )}

                    {/* リサイズハンドル */}
                    <>
                      {/* 左ハンドル - より大きなヒット領域とスタイリング */}
                      <div 
                        className={`absolute top-0 bottom-0 flex items-center justify-center cursor-ew-resize transition-all duration-200 ${
                          isSelected || isDragged 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        style={{ 
                          left: '-8px', 
                          width: '16px' // より大きなクリック領域
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task.id) // タスクを選択状態にする
                          handleGanttDragStart(e, task.id, 'resize-start')
                        }}
                      >
                        <div className="w-1 h-6 bg-white rounded-full shadow-lg border border-gray-300 hover:bg-gray-50 transition-colors" />
                      </div>
                      
                      {/* 右ハンドル - より大きなヒット領域とスタイリング */}
                      <div 
                        className={`absolute top-0 bottom-0 flex items-center justify-center cursor-ew-resize transition-all duration-200 ${
                          isSelected || isDragged 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        style={{ 
                          right: '-8px', 
                          width: '16px' // より大きなクリック領域
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task.id) // タスクを選択状態にする
                          handleGanttDragStart(e, task.id, 'resize-end')
                        }}
                      >
                        <div className="w-1 h-6 bg-white rounded-full shadow-lg border border-gray-300 hover:bg-gray-50 transition-colors" />
                      </div>
                    </>

                    {/* アクションボタン（完了タスク用） */}
                    <div 
                      className={`absolute top-0 flex items-center space-x-1 transition-all duration-200 ${
                        isSelected || isDragged 
                          ? 'opacity-100' 
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                      style={{ 
                        right: '100%', 
                        marginRight: '8px',
                        height: '100%'
                      }}
                    >
                      {/* アーカイブボタン */}
                      {toggleTaskArchive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const originalTask = tasks.find(t => t.id === task.id)
                            if (originalTask) {
                              toggleTaskArchive(task.id)
                            }
                          }}
                          className="w-6 h-6 bg-white rounded shadow-lg border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center text-xs"
                          title="アーカイブ"
                        >
                          📥
                        </button>
                      )}
                      
                      {/* 削除ボタン */}
                      {deleteTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('このタスクを削除しますか？')) {
                              deleteTask(task.id)
                            }
                          }}
                          className="w-6 h-6 bg-white rounded shadow-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center text-xs"
                          title="削除"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* アクティブタスクのバー */}
            {activeTasks.map((task, index) => {
              // ドラッグ中の一時的な日付を使用
              const currentStartDate = (isDraggingGantt && draggedTask === task.id && dragStartDate) 
                ? dragStartDate 
                : task.startDate
              const currentEndDate = (isDraggingGantt && draggedTask === task.id && dragEndDate) 
                ? dragEndDate 
                : task.endDate

              const startPixels = dateToPixels(currentStartDate)
              const endPixels = dateToPixels(currentEndDate)
              const widthPixels = endPixels - startPixels
              const isSelected = selectedTask === task.id
              const isDragged = draggedTask === task.id

              return (
                <div
                  key={task.id}
                  className="absolute flex items-center group"
                  style={{
                    top: `${(showCompletedTasks ? completedTasks.length * 56 : 0) + (index * 56) + 16}px`,
                    left: `${startPixels}px`,
                    width: `${Math.max(widthPixels, 30)}px`, // 最小30px
                    height: '24px'
                  }}
                  data-testid={`task-bar-${task.id}`}
                >
                  {/* タスクバー本体 */}
                  <div
                    className={`relative h-full w-full rounded-lg shadow-sm transition-all duration-200 select-none ${
                      isDragged || (isDraggingGantt && draggedTask === task.id) ? 'cursor-grabbing scale-105 shadow-xl ring-2 ring-blue-400' : 'cursor-move'
                    } ${isSelected ? 'ring-2 ring-gray-400' : ''} hover:shadow-md`}
                    style={{ 
                      background: `linear-gradient(135deg, ${task.color} 0%, ${task.color}DD 50%, ${task.color}BB 100%)`
                    }}
                    onMouseDown={(e) => {
                      // 左クリックでドラッグ開始
                      if (e.button === 0) { // 左クリック
                        e.preventDefault()
                        setSelectedTask(task.id) // タスクを選択状態にする
                        handleGanttDragStart(e, task.id, 'move')
                      }
                    }}
                    onClick={(e) => {
                      // ドラッグしていない場合のみモーダルを開く
                      if (!isDraggingGantt) {
                        const originalTask = tasks.find(t => t.id === task.id)
                        if (originalTask) {
                          setSelectedTask(task.id) // タスクを選択状態にする
                          setEditingTask(originalTask)
                        }
                      }
                    }}
                  >
                    {/* タスク名 */}
                    {widthPixels > 60 && ( // 60px以上の場合に名前を表示
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                        <span className="text-white text-sm font-medium truncate">
                          {task.name}
                        </span>
                      </div>
                    )}

                    {/* ドラッグ中の日付フィードバック */}
                    {isDraggingGantt && draggedTask === task.id && dragStartDate && dragEndDate && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                        {dragStartDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })} 〜 {dragEndDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                      </div>
                    )}

                    {/* リサイズハンドル */}
                    <>
                      {/* 左ハンドル - より大きなヒット領域とスタイリング */}
                      <div 
                        className={`absolute top-0 bottom-0 flex items-center justify-center cursor-ew-resize transition-all duration-200 ${
                          isSelected || isDragged 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        style={{ 
                          left: '-8px', 
                          width: '16px' // より大きなクリック領域
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task.id) // タスクを選択状態にする
                          handleGanttDragStart(e, task.id, 'resize-start')
                        }}
                      >
                        <div className="w-1 h-6 bg-white rounded-full shadow-lg border border-gray-300 hover:bg-gray-50 transition-colors" />
                      </div>
                      
                      {/* 右ハンドル - より大きなヒット領域とスタイリング */}
                      <div 
                        className={`absolute top-0 bottom-0 flex items-center justify-center cursor-ew-resize transition-all duration-200 ${
                          isSelected || isDragged 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        style={{ 
                          right: '-8px', 
                          width: '16px' // より大きなクリック領域
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task.id) // タスクを選択状態にする
                          handleGanttDragStart(e, task.id, 'resize-end')
                        }}
                      >
                        <div className="w-1 h-6 bg-white rounded-full shadow-lg border border-gray-300 hover:bg-gray-50 transition-colors" />
                      </div>
                    </>

                    {/* アクションボタン */}
                    <div 
                      className={`absolute top-0 flex items-center space-x-1 transition-all duration-200 ${
                        isSelected || isDragged 
                          ? 'opacity-100' 
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                      style={{ 
                        right: '100%', 
                        marginRight: '8px',
                        height: '100%'
                      }}
                    >
                      {/* アーカイブボタン */}
                      {toggleTaskArchive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const originalTask = tasks.find(t => t.id === task.id)
                            if (originalTask) {
                              toggleTaskArchive(task.id)
                            }
                          }}
                          className="w-6 h-6 bg-white rounded shadow-lg border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center text-xs"
                          title="アーカイブ"
                        >
                          📥
                        </button>
                      )}
                      
                      {/* 削除ボタン */}
                      {deleteTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('このタスクを削除しますか？')) {
                              deleteTask(task.id)
                            }
                          }}
                          className="w-6 h-6 bg-white rounded shadow-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center text-xs"
                          title="削除"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* グリッド線 */}
            {showCompletedTasks && completedTasks.map((_, index) => (
              <div
                key={`completed-${index}`}
                className="absolute left-0 right-0 border-b border-gray-100"
                style={{ top: `${(index + 1) * 56}px` }}
              />
            ))}
            {activeTasks.map((_, index) => (
              <div
                key={`active-${index}`}
                className="absolute left-0 right-0 border-b border-gray-100"
                style={{ top: `${(showCompletedTasks ? completedTasks.length * 56 : 0) + ((index + 1) * 56)}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* フッター統計 */}
      {focusMode && taskStats.total > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">📋</span>
              <span className="font-medium text-gray-700">
                総タスク: {taskStats.total}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">✅</span>
              <span className="font-medium text-green-600">
                完了: {taskStats.completed}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">📈</span>
              <span className="font-medium text-blue-600">
                進捗: {taskStats.progress}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 空状態 */}
      {ganttTasks.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">タスクがありません</h3>
          <p className="text-gray-500">
            タスクを追加すると、ここにタイムラインが表示されます
          </p>
        </div>
      )}

      {/* タスク編集モーダル */}
      <TaskEditModal
        isOpen={editingTask !== null}
        task={editingTask}
        project={editingTask ? allProjects.find(p => p.id === editingTask.project_id) : undefined}
        availableMembers={editingTask ? allProjects.find(p => p.id === editingTask.project_id)?.members || [] : []}
        onClose={() => setEditingTask(null)}
        onSave={updateTask || (() => Promise.resolve())}
      />
    </div>
  )
}