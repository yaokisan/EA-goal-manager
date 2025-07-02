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

import { useState, useRef, useEffect, useCallback } from 'react'
import { Task, Project } from '@/types'
import Tag from '@/components/ui/Tag'

interface TaskCardProps {
  task: Task
  project?: Project
  availableMembers?: string[]
  isEditing?: boolean
  isSelected?: boolean
  showCheckbox?: boolean
  onEdit?: () => void
  onSave?: (data: Partial<Task>) => void
  onCancel?: () => void
  onToggleStatus?: () => void
  onSelect?: () => void
  onCopy?: () => void
  onDelete?: () => void
  onArchive?: () => void
  showArchiveButton?: boolean
}

export default function TaskCard({
  task,
  project,
  availableMembers = [],
  isEditing = false,
  isSelected = false,
  showCheckbox = true,
  onEdit,
  onSave,
  onCancel,
  onToggleStatus,
  onSelect,
  onCopy,
  onDelete,
  onArchive,
  showArchiveButton = true,
}: TaskCardProps) {
  const editFormRef = useRef<HTMLDivElement>(null)
  const [editData, setEditData] = useState({
    name: task.name,
    assignees: task.assignees || [],
    start_date: task.start_date,
    end_date: task.end_date,
  })

  const handleSave = useCallback(() => {
    if (onSave && editData.name.trim()) {
      onSave(editData)
    }
  }, [onSave, editData])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel?.()
    }
  }

  // 外側クリックで保存（担当者・日付入力部分は除外）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && editFormRef.current && !editFormRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement
        
        // 担当者やカレンダー部分のクリックは除外
        if (
          (target as HTMLInputElement).type === 'checkbox' || 
          (target as HTMLInputElement).type === 'date' || 
          (target as HTMLInputElement).type === 'text' ||
          target.closest('input[type="checkbox"]') ||
          target.closest('input[type="date"]') ||
          target.closest('input[type="text"]') ||
          target.closest('label') ||
          target.closest('.assignee-selector') ||
          target.closest('.date-selector')
        ) {
          return
        }
        
        handleSave()
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isEditing, handleSave])

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
      <div ref={editFormRef} className={cardClass}>
        <div className="flex items-start space-x-3">
          {/* タスク内容（編集モード） */}
          <div className="flex-1 min-w-0">
            {/* タスク名編集 */}
            <h3 className="mb-1">
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full font-medium bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                placeholder="タスク名を入力"
                autoFocus
              />
            </h3>
            
            {/* メタ情報編集（非編集時と同じレイアウト） */}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              {/* プロジェクトタグ（編集不可） */}
              {project && (
                <Tag color={project.color} size="sm">
                  {project.name}
                </Tag>
              )}
              
              {/* 期間編集 */}
              <div className="flex items-center space-x-1">
                <span>📅</span>
                <input
                  type="date"
                  value={editData.start_date}
                  onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none outline-none text-sm date-selector"
                />
                <span>〜</span>
                <input
                  type="date"
                  value={editData.end_date}
                  onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none outline-none text-sm date-selector"
                />
              </div>
              
              {/* 担当者編集 */}
              <div className="flex items-start space-x-1 assignee-selector">
                <span className="mt-0.5">👤</span>
                {availableMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {availableMembers.map((member) => (
                      <label key={member} className="flex items-center space-x-1 text-xs bg-gray-50 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={editData.assignees.includes(member)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditData({ 
                                ...editData, 
                                assignees: [...editData.assignees, member] 
                              })
                            } else {
                              setEditData({ 
                                ...editData, 
                                assignees: editData.assignees.filter(a => a !== member) 
                              })
                            }
                          }}
                          className="w-3 h-3"
                        />
                        <span>{member}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editData.assignees.join(', ')}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      assignees: e.target.value.split(',').map(a => a.trim()).filter(a => a) 
                    })}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border border-gray-300 rounded px-1 text-sm"
                    placeholder="担当者"
                  />
                )}
              </div>
            </div>
            
            <div className="mt-1 text-xs text-gray-500">
              Enterで保存、Escでキャンセル
            </div>
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
            onClick={onEdit}
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
            {task.assignees && task.assignees.length > 0 && (
              <span className="text-gray-600">
                👤 {task.assignees.join(', ')}
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
        
        {/* アクションボタン */}
        <div className="flex items-center space-x-1">
          {/* コピーボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCopy?.()
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Notion形式でコピー"
          >
            📋
          </button>
          
          {/* アーカイブボタン */}
          {showArchiveButton && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors p-1"
              title={task.is_archived ? "アーカイブを解除" : "アーカイブ"}
            >
              {task.is_archived ? "📤" : "📥"}
            </button>
          )}
          
          {/* 削除ボタン */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('このタスクを削除しますか？')) {
                  onDelete()
                }
              }}
              className="text-gray-400 hover:text-red-600 transition-colors p-1"
              title="タスクを削除"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}