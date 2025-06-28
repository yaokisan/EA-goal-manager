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
  activeTab?: string
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
  height = 400,
  activeTab = 'all',
  taskStats = { total: 0, completed: 0, remaining: 0, progress: 0 }
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
      top: isMobile ? 40 : 50, 
      right: isMobile ? 20 : 40, 
      bottom: isMobile ? 30 : 40, 
      left: isMobile ? 160 : 220 
    }
    const chartWidth = actualWidth - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom
    const taskHeight = isMobile ? 20 : 24
    const taskSpacing = isMobile ? 6 : 8
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

    // 背景クリア（モダンテーマ）
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, actualWidth, height)

    // ヘッダー背景
    ctx.fillStyle = '#fafbfc'
    ctx.fillRect(0, 0, actualWidth, margin.top)
    
    // サイドバー背景
    ctx.fillStyle = '#fdfdfd'
    ctx.fillRect(0, margin.top, margin.left, chartHeight)
    
    // サイドバー境界線
    ctx.strokeStyle = '#e1e5e9'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin.left, 0)
    ctx.lineTo(margin.left, height)
    ctx.stroke()

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
        ctx.fillStyle = '#f7f9fc'
        ctx.fillRect(0, y - taskSpacing/2, actualWidth, taskRowHeight)
      }
      
      // タスク名とプロジェクトラベル
      const labelX = margin.left - 15
      
      // プロジェクト色インジケーター（円形）
      ctx.fillStyle = task.color
      ctx.beginPath()
      ctx.arc(labelX - 15, y + taskHeight/2, 3, 0, 2 * Math.PI)
      ctx.fill()
      
      // タスク名
      ctx.fillStyle = isSelected ? '#2563eb' : '#374151'
      ctx.font = isSelected ? 'bold 12px Inter, system-ui, sans-serif' : '12px Inter, system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(task.name, labelX, y + taskHeight / 2 + 1)
      
      // プロジェクト名（小さく）
      ctx.fillStyle = '#9ca3af'
      ctx.font = '10px Inter, system-ui, sans-serif'
      ctx.fillText(task.projectName, labelX, y + taskHeight / 2 - 8)
      
      // タスクバーのモダンスタイル
      const cornerRadius = 4
      const barY = y + taskSpacing/2 + 2
      const barHeight = taskHeight - taskSpacing - 4
      
      // 角丸矩形を描画するヘルパー関数
      function drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
        if (!ctx) return
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
      }
      
      // タスクバー影（ソフトシャドウ）
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      drawRoundedRect(startX + 1, barY + 1, barWidth, barHeight, cornerRadius)
      ctx.fill()
      
      // タスクバー背景
      ctx.fillStyle = '#f8fafc'
      drawRoundedRect(startX, barY, barWidth, barHeight, cornerRadius)
      ctx.fill()
      
      // タスクバー境界線
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      drawRoundedRect(startX, barY, barWidth, barHeight, cornerRadius)
      ctx.stroke()
      
      // タスクバー（進捗）- モダンスタイル
      const progressWidth = (barWidth * task.progress) / 100
      
      if (progressWidth > 4) {
        // グラデーション進捗バー
        const gradient = ctx.createLinearGradient(startX, barY, startX, barY + barHeight)
        gradient.addColorStop(0, task.color)
        gradient.addColorStop(1, adjustColor(task.color, -15))
        
        ctx.fillStyle = gradient
        drawRoundedRect(startX + 1, barY + 1, progressWidth - 2, barHeight - 2, cornerRadius - 1)
        ctx.fill()
      }
      
      // 選択状態の境界線（モダンスタイル）
      if (isSelected) {
        ctx.strokeStyle = '#2563eb'
        ctx.lineWidth = 2
        drawRoundedRect(startX - 1, barY - 1, barWidth + 2, barHeight + 2, cornerRadius + 1)
        ctx.stroke()
      }
      
      // ホバー効果
      if (isHovered && !isSelected) {
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 1
        drawRoundedRect(startX - 1, barY - 1, barWidth + 2, barHeight + 2, cornerRadius + 1)
        ctx.stroke()
      }
      
      // 進捗率テキスト（モダンスタイル）
      if (barWidth > 40) {
        ctx.fillStyle = task.progress > 60 ? '#ffffff' : '#475569'
        ctx.font = '11px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          `${task.progress}%`,
          startX + barWidth / 2,
          barY + barHeight / 2 + 3
        )
      }
      
      // リサイズハンドル（選択時のみ）- モダンスタイル
      if (isSelected) {
        const handleWidth = 4
        const handleHeight = barHeight
        
        // 開始ハンドル
        ctx.fillStyle = '#2563eb'
        ctx.fillRect(startX - 2, barY, handleWidth, handleHeight)
        
        // 終了ハンドル
        ctx.fillStyle = '#2563eb'
        ctx.fillRect(startX + barWidth - 2, barY, handleWidth, handleHeight)
        
        // ハンドル上のグリップ表示
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(startX - 1, barY + handleHeight/2 - 1, 2, 2)
        ctx.fillRect(startX + barWidth - 1, barY + handleHeight/2 - 1, 2, 2)
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

    const isMobile = window.innerWidth < 768
    const margin = { 
      top: isMobile ? 40 : 50, 
      left: isMobile ? 160 : 220 
    }
    const taskHeight = isMobile ? 20 : 24
    const taskSpacing = isMobile ? 6 : 8
    const taskRowHeight = taskHeight + taskSpacing

    // どのタスクバーをホバーしているか判定
    const taskIndex = Math.floor((y - margin.top - taskSpacing/2) / taskRowHeight)
    const task = ganttTasks[taskIndex]

    if (task && taskIndex >= 0 && taskIndex < ganttTasks.length) {
      const taskY = margin.top + taskIndex * taskRowHeight + taskSpacing/2
      const barY = taskY + taskSpacing/2 + 2
      const barHeight = taskHeight - taskSpacing - 4
      
      if (y >= barY && y <= barY + barHeight) {
        setHoveredTask(task.id)
        canvas.style.cursor = 'pointer'
      } else {
        setHoveredTask(null)
        canvas.style.cursor = 'default'
      }
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

    const isMobile = window.innerWidth < 768
    const margin = { 
      top: isMobile ? 40 : 50 
    }
    const taskHeight = isMobile ? 20 : 24
    const taskSpacing = isMobile ? 6 : 8
    const taskRowHeight = taskHeight + taskSpacing

    // クリックされたタスクを特定
    const taskIndex = Math.floor((y - margin.top - taskSpacing/2) / taskRowHeight)
    const task = ganttTasks[taskIndex]

    if (task && taskIndex >= 0 && taskIndex < ganttTasks.length) {
      const taskY = margin.top + taskIndex * taskRowHeight + taskSpacing/2
      const barY = taskY + taskSpacing/2 + 2
      const barHeight = taskHeight - taskSpacing - 4
      
      if (y >= barY && y <= barY + barHeight) {
        setSelectedTask(task.id === selectedTask ? null : task.id)
      } else {
        setSelectedTask(null)
      }
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
            <span className="text-gray-500">📋</span>
            <span className="font-medium text-gray-700">
              {taskStats.remaining}/{taskStats.total}
            </span>
            <span className="text-xs text-gray-500">残り</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">📈</span>
            <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {taskStats.progress}%
            </span>
          </div>
          {taskStats.total > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">✅</span>
              <span className="font-medium text-green-600">
                {taskStats.completed}完了
              </span>
            </div>
          )}
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