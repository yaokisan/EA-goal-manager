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

import { useMemo, useState } from 'react'
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
  const { focusData } = useFocusMode()
  const { projects: allProjects } = useProjects()
  
  console.log('GanttChart state - editingTask:', editingTask)

  // ドラッグ終了時の処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    
    if (!over || active.id === over.id || !onTaskOrderChange) {
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
        project: project!
      }
    })
  }, [tasks, projects])

  // 表示期間を決定
  const { minDate, maxDate, totalDays } = useMemo(() => {
    // タイムゾーンに依存しない日付計算
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    
    let resultMinDate: Date, resultMaxDate: Date
    
    // 直近1週間タブの場合は本日から1週間固定
    if (activeTab === 'recent') {
      resultMinDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      resultMaxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6)
    }
    else if (focusMode && focusData?.deadline) {
      // フォーカスモードの場合、今日から期限までの期間を表示
      const deadline = new Date(focusData.deadline)
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
      
      // 1ヶ月前まで遡れるように開始日を調整（タイムゾーン対応）
      resultMinDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      resultMaxDate = deadlineDate
    }
    else {
      // 通常モード：選択された期間
      const selectedOption = PERIOD_OPTIONS.find(opt => opt.value === selectedPeriod)
      if (selectedOption && selectedOption.days > 0) {
        // 1ヶ月前から選択期間後まで
        resultMinDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        resultMaxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + selectedOption.days)
      }
      else {
        // カスタムモード：タスクの期間に基づく（1ヶ月前〜タスク終了後まで）
        if (ganttTasks.length === 0) {
          resultMinDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          resultMaxDate = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate())
        }
        else {
          const allDates = ganttTasks.flatMap(task => [task.startDate, task.endDate])
          const taskMinDate = new Date(Math.min(...allDates.map(d => d.getTime())))
          const taskMaxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
          
          // 1ヶ月前から、タスクまたは今日の2ヶ月後まで  
          const oneMonthBefore = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          const twoMonthsAfter = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate())
          
          const minTime = Math.min(oneMonthBefore.getTime(), taskMinDate.getTime() - 7 * 24 * 60 * 60 * 1000)
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

  // 日付をパーセンテージに変換（タイムゾーン対応）
  const dateToPercent = (date: Date) => {
    // タイムゾーンに依存しない日付のみで計算
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const baseDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    
    // 日単位での差分を計算
    const daysDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // セルの中央に配置するため0.5を加算
    const percent = ((daysDiff + 0.5) / actualTotalDays) * 100
    
    return Math.max(0, Math.min(100, percent))
  }

  // 今日の位置を計算（タイムゾーン対応）
  const now = new Date()
  const todayForCalc = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayPercent = dateToPercent(todayForCalc)
  
  

  // プロジェクト別の凡例
  const projectsInUse = Array.from(new Set(ganttTasks.map(task => task.project)))
    .filter(project => project)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* ヘッダー部分 */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white p-6">
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

        {/* フォーカスモード表示 */}
        {focusMode && (
          <div className="mt-4 text-sm opacity-90">
            フォーカスモード: 目標期限までの期間を表示中
          </div>
        )}
      </div>

      {/* メインコンテンツ */}
      <div className="flex">
        {/* 左側: タスクリスト */}
        <div className="w-80 bg-gray-50 border-r border-gray-200">
          {/* タスクヘッダー - 右側のヘッダー高さに合わせる */}
          <div className="bg-gray-100 border-b border-gray-200">
            <div className="p-3 text-center">
              <h3 className="font-semibold text-gray-900">タスク</h3>
            </div>
            <div className="flex border-t border-gray-200">
              <div className="flex-1 text-center py-2">
                <div className="text-xs text-gray-600">担当者</div>
              </div>
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
              items={ganttTasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-200">
                {ganttTasks.map((task, index) => (
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
                    width: `${(month.days.length / actualTotalDays) * 100}%`,
                    minWidth: `${month.days.length * 30}px`
                  }}
                >
                  <div className="p-2 text-center bg-blue-50">
                    <div className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                      {month.year}/{month.month}
                    </div>
                  </div>
                  
                  {/* 日付グリッド */}
                  <div className="flex border-t border-gray-200">
                    {month.days.map((day, dayIndex) => (
                      <div 
                        key={day.toISOString()}
                        className="text-center py-2 border-r border-gray-100 last:border-r-0 bg-blue-50"
                        style={{ 
                          width: `${(1 / actualTotalDays) * 100}%`,
                          minWidth: '30px' 
                        }}
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
            style={{ minWidth: `${actualTotalDays * 30}px`, minHeight: `${ganttTasks.length * 48}px` }}
          >
            {/* 今日の線 */}
            {todayPercent >= 0 && todayPercent <= 100 && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${todayPercent}%` }}
              >
                <div className="absolute -top-6 -left-6 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  今日
                </div>
              </div>
            )}

            {/* 週末の背景 */}
            {dateGrid.map((month) => 
              month.days.map((day) => {
                const dayOfWeek = day.getDay()
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                  const leftPercent = dateToPercent(day)
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className="absolute top-0 bottom-0 bg-gray-100 opacity-50"
                      style={{
                        left: `${leftPercent - (1 / actualTotalDays) * 50}%`,
                        width: `${(1 / actualTotalDays) * 100}%`
                      }}
                    />
                  )
                }
                return null
              })
            )}

            {/* タスクバー */}
            {ganttTasks.map((task, index) => {
              const startPercent = dateToPercent(task.startDate)
              const endPercent = dateToPercent(task.endDate)
              const width = endPercent - startPercent
              const isSelected = selectedTask === task.id
              const isDragged = draggedTask === task.id

              return (
                <div
                  key={task.id}
                  className="absolute flex items-center group"
                  style={{
                    top: `${index * 48 + 12}px`, // タスクの中央に配置 (48px高さの中央は24px、バー高さ24pxなので12pxオフセット)
                    left: `${startPercent}%`,
                    width: `${Math.max(width, 5)}%`,
                    height: '24px' // 進捗バーの高さを少し小さく
                  }}
                  onClick={() => console.log('Parent div clicked')}
                >
                  {/* タスクバー本体 */}
                  <button
                    type="button"
                    className={`relative h-full w-full rounded-lg shadow-sm transition-all duration-200 cursor-pointer border-0 p-0 ${
                      isDragged ? 'cursor-grabbing scale-105' : ''
                    } ${isSelected ? 'ring-2 ring-gray-400' : ''} hover:shadow-md`}
                    style={{ 
                      background: `linear-gradient(135deg, ${task.color} 0%, ${task.color}DD 50%, ${task.color}BB 100%)`,
                    }}
                    onClick={(e) => {
                      console.log('=== CLICK EVENT FIRED ===')
                      console.log('Task:', task)
                      console.log('Tasks array:', tasks)
                      const originalTask = tasks.find(t => t.id === task.id)
                      console.log('Found original task:', originalTask)
                      if (originalTask) {
                        setEditingTask(originalTask)
                      }
                    }}
                  >
                    {/* タスク名 */}
                    {width > 10 && (
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                        <span className="text-white text-sm font-medium truncate">
                          {task.name}
                        </span>
                      </div>
                    )}

                    {/* ドラッグハンドル（選択時またはホバー時） */}
                    {(isSelected || isDragged) && (
                      <>
                        {/* 左ハンドル */}
                        <div 
                          className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-4 bg-white rounded-sm shadow-md cursor-ew-resize opacity-90 hover:opacity-100 pointer-events-none"
                          style={{ left: '-6px' }}
                        />
                        
                        {/* 右ハンドル */}
                        <div 
                          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-4 bg-white rounded-sm shadow-md cursor-ew-resize opacity-90 hover:opacity-100 pointer-events-none"
                          style={{ right: '-6px' }}
                        />
                      </>
                    )}

                    {/* ホバー時のハンドル表示 */}
                    <div className="group-hover:opacity-60 opacity-0 transition-opacity duration-200 pointer-events-none">
                      <div 
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-4 bg-white rounded-sm shadow-md cursor-ew-resize"
                        style={{ left: '-6px' }}
                      />
                      <div 
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-4 bg-white rounded-sm shadow-md cursor-ew-resize"
                        style={{ right: '-6px' }}
                      />
                    </div>
                  </button>
                </div>
              )
            })}

            {/* グリッド線 */}
            {ganttTasks.map((_, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 border-b border-gray-100"
                style={{ top: `${(index + 1) * 48}px` }}
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