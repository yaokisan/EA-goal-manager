/**
 * タスクカードコンポーネント
 * 
 * 設計参照: UI-requirements.md § 5.1 タスク表示
 * 技術仕様: technical-requirements.md § 4.2 共通UIコンポーネント
 * 
 * 関連コンポーネント:
 * - TaskList: タスクリスト表示
 * - Tag: プロジェクト名タグ
 * 
 * 実装要件:
 * - カード形式（高さ55px）
 * - チェックボックス、タスク名、プロジェクト名、期限、担当者、コピーボタン
 * - Notion風インライン編集
 * - 完了タスクは薄い表示 + 取り消し線
 */

'use client'

import { useState } from 'react'
import { Task, Project } from '@/types'
import Tag from '@/components/ui/Tag'

interface TaskCardProps {
  task: Task
  project?: Project
  isEditing?: boolean
  isSelected?: boolean
  showCheckbox?: boolean
  onEdit?: () => void
  onSave?: (data: Partial<Task>) => void
  onCancel?: () => void
  onToggleStatus?: () => void
  onSelect?: () => void
  onCopy?: () => void
}

export default function TaskCard({
  task,
  project,
  isEditing = false,
  isSelected = false,
  showCheckbox = true,
  onEdit,
  onSave,
  onCancel,
  onToggleStatus,
  onSelect,
  onCopy,
}: TaskCardProps) {
  const [editData, setEditData] = useState({
    name: task.name,
    assignee: task.assignee || '',
    start_date: task.start_date,
    end_date: task.end_date,
  })

  const handleSave = () => {
    if (onSave && editData.name.trim()) {
      onSave(editData)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel?.()
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    const end = new Date(endDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    return `${start}〜${end}`
  }

  const getDaysUntilDeadline = (endDate: string) => {
    const today = new Date()
    const deadline = new Date(endDate)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyColor = (endDate: string) => {
    const days = getDaysUntilDeadline(endDate)
    if (days <= 2) return 'text-red-600'
    if (days <= 4) return 'text-orange-600'
    return 'text-gray-600'
  }

  const cardClass = `
    border border-gray-200 rounded-lg p-3 transition-all duration-200
    ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white hover:shadow-sm'}
    ${isEditing ? 'ring-2 ring-blue-500 shadow-md' : ''}
    ${task.status === 'completed' ? 'opacity-60' : ''}
  `

  if (isEditing) {
    return (
      <div className={cardClass}>
        <div className="space-y-3">
          {/* タスク名編集 */}
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full font-medium bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            placeholder="タスク名を入力"
            autoFocus
          />
          
          {/* メタ情報編集 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <input
              type="text"
              value={editData.assignee}
              onChange={(e) => setEditData({ ...editData, assignee: e.target.value })}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="担当者"
            />
            <input
              type="date"
              value={editData.start_date}
              onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <input
              type="date"
              value={editData.end_date}
              onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            Enterで保存、Escでキャンセル
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cardClass} onClick={onSelect}>
      <div className="flex items-start space-x-3">
        {/* チェックボックス */}
        {showCheckbox && (
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={(e) => {
              e.stopPropagation()
              onToggleStatus?.()
            }}
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        )}
        
        {/* タスク内容 */}
        <div className="flex-1 min-w-0">
          <h3 
            className={`font-medium ${task.status === 'completed' ? 'line-through' : ''} cursor-pointer`}
            onDoubleClick={onEdit}
          >
            {task.name}
          </h3>
          
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            {/* プロジェクトタグ */}
            {project && (
              <Tag color={project.color} size="sm">
                {project.name}
              </Tag>
            )}
            
            {/* 期限 */}
            <span className={`flex items-center ${getUrgencyColor(task.end_date)}`}>
              📅 {formatDateRange(task.start_date, task.end_date)}
            </span>
            
            {/* 担当者 */}
            {task.assignee && (
              <span className="text-gray-600">
                👤 {task.assignee}
              </span>
            )}
            
            {/* 期限までの日数（未完了タスクのみ） */}
            {task.status === 'pending' && (
              <span className={`text-xs ${getUrgencyColor(task.end_date)}`}>
                あと{getDaysUntilDeadline(task.end_date)}日
              </span>
            )}
          </div>
        </div>
        
        {/* コピーボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCopy?.()
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Notion形式でコピー"
        >
          📋
        </button>
      </div>
    </div>
  )
}