/**
 * ソート可能タスクカードコンポーネント
 * 
 * 設計参照: UI-requirements.md § 5 タスクリスト機能
 * 技術仕様: technical-requirements.md § 5.3 ドラッグ&ドロップ機能
 * 
 * 関連コンポーネント:
 * - TaskCard: 基本タスクカード
 * - TaskList: タスク一覧表示
 * 
 * 実装要件:
 * - @dnd-kit/sortableを使用したドラッグ&ドロップ
 * - 既存のTaskCard機能をすべて継承
 * - ドラッグハンドル表示
 */

'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'
import { Task, Project } from '@/types'

interface SortableTaskCardProps {
  task: Task
  project?: Project
  availableMembers: string[]
  isEditing?: boolean
  isSelected?: boolean
  onEdit?: () => void
  onSave?: (data: Partial<Task>) => void
  onCancel?: () => void
  onToggleStatus?: () => void
  onSelect?: () => void
  onCopy?: () => void
  isMultiSelectMode?: boolean
}

export default function SortableTaskCard(props: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: props.task.id,
    disabled: props.isEditing || props.isMultiSelectMode // 編集中や複数選択モード時はドラッグ無効
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      {/* ドラッグハンドル */}
      {!props.isEditing && !props.isMultiSelectMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          title="ドラッグして並び替え"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="text-gray-400 hover:text-gray-600"
          >
            <path d="M3 6a1 1 0 110-2 1 1 0 010 2zM3 8a1 1 0 110-2 1 1 0 010 2zM4 11a1 1 0 11-2 0 1 1 0 012 0zM7 6a1 1 0 110-2 1 1 0 010 2zM7 8a1 1 0 110-2 1 1 0 010 2zM8 11a1 1 0 11-2 0 1 1 0 012 0zM11 6a1 1 0 110-2 1 1 0 010 2zM11 8a1 1 0 110-2 1 1 0 010 2zM12 11a1 1 0 11-2 0 1 1 0 012 0z"/>
          </svg>
        </div>
      )}
      
      {/* タスクカード本体 */}
      <div className={`${!props.isEditing && !props.isMultiSelectMode ? 'pl-6' : ''}`}>
        <TaskCard {...props} />
      </div>
    </div>
  )
}