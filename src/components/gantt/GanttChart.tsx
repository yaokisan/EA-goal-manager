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
  width = 800, 
  height = 400 
}: GanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([])

  // タスクデータをガントチャート用に変換
  useEffect(() => {
    const processedTasks: GanttTask[] = tasks.map(task => {
      const project = projects.find(p => p.id === task.project_id)
      return {
        id: task.id,
        name: task.name,
        startDate: new Date(task.start_date),
        endDate: new Date(task.end_date),
        progress: task.status === 'completed' ? 100 : 50, // 仮の進捗率
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
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // 描画設定
    const margin = { top: 40, right: 40, bottom: 40, left: 200 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom
    const taskHeight = 24
    const taskSpacing = 8
    const taskRowHeight = taskHeight + taskSpacing

    // 日付範囲計算
    const allDates = ganttTasks.flatMap(task => [task.startDate, task.endDate])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // 少し余裕を持たせる
    minDate.setDate(minDate.getDate() - 1)
    maxDate.setDate(maxDate.getDate() + 1)
    
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

    // 日付をX座標に変換する関数
    const dateToX = (date: Date) => {
      const days = (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      return margin.left + (days / totalDays) * chartWidth
    }

    // 背景クリア
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // グリッド線描画
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1

    // 縦線（日付）
    for (let i = 0; i <= totalDays; i += Math.ceil(totalDays / 10)) {
      const date = new Date(minDate.getTime() + i * 24 * 60 * 60 * 1000)
      const x = dateToX(date)
      
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, height - margin.bottom)
      ctx.stroke()
      
      // 日付ラベル
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${date.getMonth() + 1}/${date.getDate()}`,
        x,
        height - margin.bottom + 20
      )
    }

    // 横線（タスク間）
    ganttTasks.forEach((_, index) => {
      const y = margin.top + index * taskRowHeight + taskHeight
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(width - margin.right, y)
      ctx.stroke()
    })

    // タスクバー描画
    ganttTasks.forEach((task, index) => {
      const y = margin.top + index * taskRowHeight
      const startX = dateToX(task.startDate)
      const endX = dateToX(task.endDate)
      const barWidth = endX - startX
      
      // タスク名ラベル
      ctx.fillStyle = '#374151'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(task.name, margin.left - 10, y + taskHeight / 2 + 4)
      
      // プロジェクト名（小さく）
      ctx.fillStyle = '#9ca3af'
      ctx.font = '11px sans-serif'
      ctx.fillText(task.projectName, margin.left - 10, y + taskHeight / 2 - 8)
      
      // タスクバー背景
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(startX, y + 4, barWidth, taskHeight - 8)
      
      // タスクバー（進捗）
      const progressWidth = (barWidth * task.progress) / 100
      ctx.fillStyle = task.color
      ctx.fillRect(startX, y + 4, progressWidth, taskHeight - 8)
      
      // ホバー効果
      if (hoveredTask === task.id) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.strokeRect(startX - 1, y + 3, barWidth + 2, taskHeight - 6)
      }
      
      // 進捗率テキスト
      if (barWidth > 40) {
        ctx.fillStyle = task.progress > 50 ? '#ffffff' : '#374151'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          `${task.progress}%`,
          startX + barWidth / 2,
          y + taskHeight / 2 + 3
        )
      }
    })

    // タイトル
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('ガントチャート', 20, 25)

  }, [ganttTasks, width, height, hoveredTask])

  // マウスイベントハンドリング
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const margin = { top: 40, left: 200 }
    const taskRowHeight = 32

    // どのタスクバーをホバーしているか判定
    const taskIndex = Math.floor((y - margin.top) / taskRowHeight)
    const task = ganttTasks[taskIndex]

    if (task && y >= margin.top + taskIndex * taskRowHeight + 4 && 
        y <= margin.top + taskIndex * taskRowHeight + 28) {
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
    if (hoveredTask) {
      console.log('Clicked task:', hoveredTask)
      // ここでタスク詳細表示やタスク編集画面への遷移などを実装
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
        </div>
      </div>
      
      {ganttTasks.length === 0 ? (
        <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-500">
          表示するタスクがありません
        </div>
      ) : (
        <div className="overflow-auto">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className="border border-gray-200 rounded"
          />
        </div>
      )}
    </div>
  )
}