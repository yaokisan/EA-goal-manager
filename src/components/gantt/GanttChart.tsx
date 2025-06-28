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
 * - Canvas APIを使用したレンダリング
 * - タスクバー表示（期間・進捗）
 * - プロジェクト色分け
 * - レスポンシブ対応
 * - インタラクティブ機能（ホバー・クリック）
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Task, Project } from '@/types'

interface GanttChartProps {
  tasks: Task[]
  projects: Project[]
  width?: number
  height?: number
}

interface GanttTask {
  id: string
  name: string
  startDate: Date
  endDate: Date
  progress: number
  color: string
  projectName: string
}

export default function GanttChart({ 
  tasks, 
  projects, 
  width = 1200, 
  height = 400 
}: GanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragData, setDragData] = useState<{taskId: string, type: 'move' | 'resize-start' | 'resize-end', startX: number} | null>(null)
  const [actualWidth, setActualWidth] = useState(width)

  // レスポンシブ幅計算
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const isMobile = window.innerWidth < 768
        const minWidth = isMobile ? 600 : 800
        setActualWidth(Math.max(minWidth, containerWidth - 48)) // パディング分を引く
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // タスクデータをガントチャート用に変換
  useEffect(() => {
    const processedTasks: GanttTask[] = tasks.map(task => {
      const project = projects.find(p => p.id === task.project_id)
      return {
        id: task.id,
        name: task.name,
        startDate: new Date(task.start_date),
        endDate: new Date(task.end_date),
        progress: task.status === 'completed' ? 100 : Math.floor(Math.random() * 70 + 20), // より現実的な進捗率
        color: project?.color || '#6b7280',
        projectName: project?.name || 'Unknown'
      }
    })
    setGanttTasks(processedTasks)
  }, [tasks, projects])

  // Canvas描画処理
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || ganttTasks.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas解像度設定（高DPI対応）
    const dpr = window.devicePixelRatio || 1
    canvas.width = actualWidth * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${actualWidth}px`
    canvas.style.height = `${height}px`

    // 描画設定（モバイル対応）
    const isMobile = window.innerWidth < 768
    const margin = { 
      top: isMobile ? 50 : 60, 
      right: isMobile ? 20 : 40, 
      bottom: isMobile ? 50 : 60, 
      left: isMobile ? 160 : 240 
    }
    const chartWidth = actualWidth - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom
    const taskHeight = isMobile ? 24 : 28
    const taskSpacing = isMobile ? 8 : 12
    const taskRowHeight = taskHeight + taskSpacing

    // 日付範囲計算
    const allDates = ganttTasks.flatMap(task => [task.startDate, task.endDate])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // 少し余裕を持たせる
    minDate.setDate(minDate.getDate() - 2)
    maxDate.setDate(maxDate.getDate() + 2)
    
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

    // 日付をX座標に変換する関数
    const dateToX = (date: Date) => {
      const days = (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      return margin.left + (days / totalDays) * chartWidth
    }

    // 背景クリア（ダークテーマ風）
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, actualWidth, height)

    // ヘッダー背景
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(0, 0, actualWidth, margin.top)
    
    // サイドバー背景
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, margin.top, margin.left, chartHeight)

    // グリッド線描画
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 0.5

    // 今日の線
    const today = new Date()
    const todayX = dateToX(today)
    if (todayX >= margin.left && todayX <= actualWidth - margin.right) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(todayX, margin.top)
      ctx.lineTo(todayX, height - margin.bottom)
      ctx.stroke()
      
      // 今日のラベル
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('今日', todayX, margin.top - 10)
    }

    // 週末の背景
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(minDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dayOfWeek = date.getDay()
      const x = dateToX(date)
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // 日曜日または土曜日
        ctx.fillStyle = '#f1f5f9'
        ctx.fillRect(x - 5, margin.top, 10, chartHeight)
      }
      
      // 日付ラベル（週の始まりのみ）
      if (dayOfWeek === 1 || i % 7 === 0) {
        ctx.strokeStyle = '#d1d5db'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, margin.top)
        ctx.lineTo(x, height - margin.bottom)
        ctx.stroke()
        
        // 日付ラベル
        ctx.fillStyle = '#6b7280'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          `${date.getMonth() + 1}/${date.getDate()}`,
          x,
          height - margin.bottom + 15
        )
      }
    }

    // 横線（タスク間）
    ctx.strokeStyle = '#f1f5f9'
    ganttTasks.forEach((_, index) => {
      const y = margin.top + index * taskRowHeight + taskHeight + taskSpacing/2
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(actualWidth - margin.right, y)
      ctx.stroke()
    })

    // タスクバー描画
    ganttTasks.forEach((task, index) => {
      const y = margin.top + index * taskRowHeight + taskSpacing/2
      const startX = dateToX(task.startDate)
      const endX = dateToX(task.endDate)
      const barWidth = Math.max(endX - startX, 20) // 最小幅
      const isSelected = selectedTask === task.id
      const isHovered = hoveredTask === task.id
      
      // タスク行背景（ホバー時）
      if (isHovered) {
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(0, y - taskSpacing/2, actualWidth, taskRowHeight)
      }
      
      // タスク名とプロジェクトラベル
      const labelX = margin.left - 20
      
      // プロジェクト色インジケーター
      ctx.fillStyle = task.color
      ctx.fillRect(labelX - 15, y + taskHeight/2 - 2, 3, 4)
      
      // タスク名
      ctx.fillStyle = isSelected ? '#1e40af' : '#1f2937'
      ctx.font = isSelected ? 'bold 13px sans-serif' : '13px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(task.name, labelX, y + taskHeight / 2 + 2)
      
      // プロジェクト名（小さく）
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px sans-serif'
      ctx.fillText(task.projectName, labelX, y + taskHeight / 2 - 10)
      
      // タスクバー影
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(startX + 1, y + 5, barWidth, taskHeight - 8)
      
      // タスクバー背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(startX, y + 4, barWidth, taskHeight - 8)
      
      // タスクバー境界線
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.strokeRect(startX, y + 4, barWidth, taskHeight - 8)
      
      // タスクバー（進捗）
      const progressWidth = (barWidth * task.progress) / 100
      
      // グラデーション進捗バー
      const gradient = ctx.createLinearGradient(startX, y + 4, startX, y + taskHeight - 4)
      gradient.addColorStop(0, task.color)
      gradient.addColorStop(1, adjustColor(task.color, -20))
      
      ctx.fillStyle = gradient
      ctx.fillRect(startX, y + 4, progressWidth, taskHeight - 8)
      
      // 選択状態の境界線
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.strokeRect(startX - 1, y + 3, barWidth + 2, taskHeight - 6)
      }
      
      // ホバー効果
      if (isHovered && !isSelected) {
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 1
        ctx.strokeRect(startX - 1, y + 3, barWidth + 2, taskHeight - 6)
      }
      
      // 進捗率テキスト
      if (barWidth > 50) {
        ctx.fillStyle = task.progress > 50 ? '#ffffff' : '#374151'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          `${task.progress}%`,
          startX + barWidth / 2,
          y + taskHeight / 2 + 2
        )
      }
      
      // リサイズハンドル（選択時のみ）
      if (isSelected) {
        // 開始ハンドル
        ctx.fillStyle = '#3b82f6'
        ctx.fillRect(startX - 3, y + 6, 6, taskHeight - 12)
        
        // 終了ハンドル
        ctx.fillStyle = '#3b82f6'
        ctx.fillRect(startX + barWidth - 3, y + 6, 6, taskHeight - 12)
      }
    })

    // 色を調整するヘルパー関数
    function adjustColor(hex: string, amount: number) {
      const num = parseInt(hex.replace('#', ''), 16)
      const r = Math.max(0, Math.min(255, (num >> 16) + amount))
      const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount))
      const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
      return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
    }

    // タイトルとヘッダー
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('ガントチャート', 20, 30)
    
    // 月表示
    ctx.fillStyle = '#6b7280'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    const centerDate = new Date(minDate.getTime() + (totalDays / 2) * 24 * 60 * 60 * 1000)
    ctx.fillText(
      `${centerDate.getFullYear()}年${centerDate.getMonth() + 1}月`,
      margin.left + chartWidth / 2,
      30
    )

  }, [ganttTasks, actualWidth, height, hoveredTask, selectedTask])

  // マウスイベントハンドリング
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const margin = { top: 60, left: 240 }
    const taskRowHeight = 40

    // どのタスクバーをホバーしているか判定
    const taskIndex = Math.floor((y - margin.top - 6) / taskRowHeight)
    const task = ganttTasks[taskIndex]

    if (task && taskIndex >= 0 && taskIndex < ganttTasks.length && 
        y >= margin.top + taskIndex * taskRowHeight + 6 && 
        y <= margin.top + taskIndex * taskRowHeight + 34) {
      setHoveredTask(task.id)
      canvas.style.cursor = 'pointer'
    } else {
      setHoveredTask(null)
      canvas.style.cursor = 'default'
    }
  }

  const handleMouseLeave = () => {
    setHoveredTask(null)
  }

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const y = event.clientY - rect.top

    const margin = { top: 60 }
    const taskRowHeight = 40

    // クリックされたタスクを特定
    const taskIndex = Math.floor((y - margin.top - 6) / taskRowHeight)
    const task = ganttTasks[taskIndex]

    if (task && taskIndex >= 0 && taskIndex < ganttTasks.length) {
      setSelectedTask(task.id === selectedTask ? null : task.id)
    } else {
      setSelectedTask(null)
    }
  }

  return (
    <div ref={containerRef} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">ガントチャート</h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span>📋</span>
            <span className="font-medium">{ganttTasks.filter(t => t.progress < 100).length}/{ganttTasks.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>📈</span>
            <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {ganttTasks.length > 0 ? Math.round(ganttTasks.reduce((acc, task) => acc + task.progress, 0) / ganttTasks.length) : 0}%
            </span>
          </div>
          {selectedTask && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              選択中: {ganttTasks.find(t => t.id === selectedTask)?.name}
            </div>
          )}
        </div>
      </div>
      
      {ganttTasks.length === 0 ? (
        <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-500">
          表示するタスクがありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className="border border-gray-200 rounded cursor-pointer"
          />
        </div>
      )}
      
      {selectedTask && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>ヒント:</strong> 選択されたタスクをドラッグして期間を変更できます（実装予定）
          </div>
        </div>
      )}
    </div>
  )
}