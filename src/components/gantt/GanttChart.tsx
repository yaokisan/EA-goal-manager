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
 * - タスクバー表示（期間・進捗）
 * - プロジェクト色分け
 * - レスポンシブ対応
 * - インタラクティブ機能（ホバー・クリック）
 */

'use client'

import { useMemo, useState } from 'react'
import { Task, Project } from '@/types'

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
}

interface GanttTask {
  id: string
  name: string
  assignee: string | null
  startDate: Date
  endDate: Date
  progress: number
  color: string
  projectName: string
  avatar: string
  category: string
}

// タスクカテゴリ別の色設定
const TASK_CATEGORIES = {
  'UI設計': { color: '#8B5CF6', label: 'デザイン' },
  'データベース': { color: '#EC4899', label: 'デザイン' },
  'API実装': { color: '#06B6D4', label: '開発' },
  'テスト実装': { color: '#10B981', label: 'テスト' },
  'default': { color: '#6B7280', label: '開発' }
}

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
  taskStats = { total: 0, completed: 0, remaining: 0, progress: 0 }
}: GanttChartProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  // タスクデータをガントチャート用に変換
  const ganttTasks = useMemo((): GanttTask[] => {
    return tasks.map(task => {
      const project = projects.find(p => p.id === task.project_id)
      
      // タスク名からカテゴリを推定
      const taskName = task.name.toLowerCase()
      let category = 'default'
      if (taskName.includes('ui') || taskName.includes('デザイン') || taskName.includes('設計書')) {
        category = 'UI設計'
      } else if (taskName.includes('データベース') || taskName.includes('db')) {
        category = 'データベース'
      } else if (taskName.includes('api') || taskName.includes('実装')) {
        category = 'API実装'
      } else if (taskName.includes('テスト')) {
        category = 'テスト実装'
      }
      
      const categoryInfo = TASK_CATEGORIES[category as keyof typeof TASK_CATEGORIES] || TASK_CATEGORIES.default
      
      return {
        id: task.id,
        name: task.name,
        assignee: task.assignee,
        startDate: new Date(task.start_date),
        endDate: new Date(task.end_date),
        progress: task.status === 'completed' ? 100 : Math.floor(Math.random() * 70 + 20),
        color: categoryInfo.color,
        projectName: project?.name || 'Unknown',
        avatar: task.assignee || '未割当',
        category: categoryInfo.label
      }
    })
  }, [tasks, projects])

  // 日付範囲計算
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (ganttTasks.length === 0) {
      const today = new Date()
      return {
        minDate: today,
        maxDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        totalDays: 30
      }
    }
    
    const allDates = ganttTasks.flatMap(task => [task.startDate, task.endDate])
    const min = new Date(Math.min(...allDates.map(d => d.getTime())))
    const max = new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // 少し余裕を持たせる
    min.setDate(min.getDate() - 2)
    max.setDate(max.getDate() + 2)
    
    const days = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      minDate: min,
      maxDate: max,
      totalDays: Math.max(days, 30)
    }
  }, [ganttTasks])

  // 日付グリッドを生成
  const dateGrid = useMemo(() => {
    const grid = []
    let currentMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    
    while (currentMonth <= maxDate) {
      const monthInfo = {
        year: currentMonth.getFullYear(),
        month: currentMonth.getMonth() + 1,
        startDate: new Date(currentMonth),
        endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      }
      
      // その月の日付を生成
      const days = []
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
        if (day >= minDate && day <= maxDate) {
          days.push(new Date(day))
        }
      }
      
      grid.push({ ...monthInfo, days })
      currentMonth.setMonth(currentMonth.getMonth() + 1)
    }
    
    return grid
  }, [minDate, maxDate])

  // 日付をパーセンテージに変換
  const dateToPercent = (date: Date) => {
    const totalTime = maxDate.getTime() - minDate.getTime()
    const taskTime = date.getTime() - minDate.getTime()
    return Math.max(0, Math.min(100, (taskTime / totalTime) * 100))
  }

  // 今日の位置を計算
  const todayPercent = dateToPercent(new Date())

  // カテゴリ別の凡例
  const categories = Array.from(new Set(ganttTasks.map(task => task.category)))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* ヘッダー部分 */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">プロジェクトタイムライン</h2>
          
          {/* カテゴリ凡例 */}
          <div className="flex items-center space-x-4">
            {categories.map(category => {
              const categoryTasks = ganttTasks.filter(t => t.category === category)
              const categoryColor = categoryTasks[0]?.color || '#6B7280'
              
              return (
                <div key={category} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <span className="text-sm font-medium">{category}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex">
        {/* 左側: タスクリスト */}
        <div className="w-80 bg-gray-50 border-r border-gray-200">
          {/* タスクヘッダー */}
          <div className="p-4 bg-gray-100 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">タスク</h3>
          </div>
          
          {/* タスク一覧 */}
          <div className="divide-y divide-gray-200">
            {ganttTasks.map((task) => (
              <div 
                key={task.id}
                className={`p-4 hover:bg-white transition-colors cursor-pointer ${
                  selectedTask === task.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedTask(task.id === selectedTask ? null : task.id)}
              >
                <div className="flex items-center space-x-3">
                  {/* アバター */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: getAvatarColor(task.avatar) }}
                  >
                    {getAvatarInitials(task.avatar)}
                  </div>
                  
                  {/* タスク情報 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{task.name}</h4>
                    <p className="text-sm text-gray-500">
                      {task.assignee || '未割当'} • {Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24))}日間
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右側: タイムライン */}
        <div className="flex-1 overflow-x-auto">
          {/* 月ヘッダー */}
          <div className="bg-blue-50 border-b border-gray-200">
            <div className="flex" style={{ minWidth: '800px' }}>
              {dateGrid.map((month, index) => (
                <div 
                  key={`${month.year}-${month.month}`}
                  className="border-r border-gray-200 last:border-r-0"
                  style={{
                    width: `${(month.days.length / totalDays) * 100}%`,
                    minWidth: `${month.days.length * 30}px`
                  }}
                >
                  <div className="p-3 text-center">
                    <div className="font-semibold text-gray-900">
                      {month.year}年{month.month}月
                    </div>
                  </div>
                  
                  {/* 日付グリッド */}
                  <div className="flex border-t border-gray-200">
                    {month.days.map((day, dayIndex) => (
                      <div 
                        key={day.toISOString()}
                        className="flex-1 text-center py-2 border-r border-gray-100 last:border-r-0"
                        style={{ minWidth: '30px' }}
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
          <div className="relative" style={{ minWidth: '800px', minHeight: `${ganttTasks.length * 72}px` }}>
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
                        left: `${leftPercent}%`,
                        width: `${100 / totalDays}%`
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

              return (
                <div
                  key={task.id}
                  className="absolute flex items-center"
                  style={{
                    top: `${index * 72 + 20}px`,
                    left: `${startPercent}%`,
                    width: `${Math.max(width, 5)}%`,
                    height: '32px'
                  }}
                >
                  {/* タスクバー本体 */}
                  <div 
                    className={`relative h-full rounded-lg shadow-sm border-2 transition-all duration-200 ${
                      isSelected ? 'border-gray-400 shadow-md' : 'border-transparent'
                    }`}
                    style={{ 
                      backgroundColor: task.color,
                      width: '100%'
                    }}
                    onClick={() => setSelectedTask(task.id === selectedTask ? null : task.id)}
                  >
                    {/* 進捗表示 */}
                    <div 
                      className="h-full bg-black bg-opacity-20 rounded-l-lg"
                      style={{ width: `${task.progress}%` }}
                    />
                    
                    {/* タスク名 */}
                    {width > 10 && (
                      <div className="absolute inset-0 flex items-center px-3">
                        <span className="text-white text-sm font-medium truncate">
                          {task.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* グリッド線 */}
            {ganttTasks.map((_, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 border-b border-gray-100"
                style={{ top: `${(index + 1) * 72}px` }}
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
    </div>
  )
}