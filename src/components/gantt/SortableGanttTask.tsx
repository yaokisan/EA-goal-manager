/**
 * ソート可能ガントタスクコンポーネント
 * 
 * 設計参照: UI-requirements.md § 4 ガントチャート機能
 * 技術仕様: technical-requirements.md § 4.3 ガントチャート実装
 * 
 * 関連コンポーネント:
 * - GanttChart: ガントチャート表示
 * - SortableTaskCard: タスクリスト用ソート可能コンポーネント
 * 
 * 実装要件:
 * - @dnd-kit/sortableを使用したドラッグ&ドロップ
 * - ガントチャート左側タスクリスト専用
 * - ドラッグハンドル表示
 */

'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface GanttTask {
  id: string
  name: string
  assignees: string[]
  startDate: Date
  endDate: Date
  color: string
  projectName: string
  avatar: string
  project: any
}

interface SortableGanttTaskProps {
  task: GanttTask
  isSelected: boolean
  onSelect: () => void
  getAvatarColor: (name: string) => string
  getAvatarInitials: (name: string) => string
}

export default function SortableGanttTask({
  task,
  isSelected,
  onSelect,
  getAvatarColor,
  getAvatarInitials
}: SortableGanttTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group hover:bg-white transition-colors cursor-pointer ${
        isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
      } ${isDragging ? 'z-50' : ''}`}
      onClick={onSelect}
    >
      {/* ドラッグハンドル */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        title="ドラッグして並び替え"
        onClick={(e) => e.stopPropagation()}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="text-gray-400 hover:text-gray-600"
        >
          <path d="M3 6a1 1 0 110-2 1 1 0 010 2zM3 8a1 1 0 110-2 1 1 0 010 2zM4 11a1 1 0 11-2 0 1 1 0 012 0zM7 6a1 1 0 110-2 1 1 0 010 2zM7 8a1 1 0 110-2 1 1 0 010 2zM8 11a1 1 0 11-2 0 1 1 0 012 0zM11 6a1 1 0 110-2 1 1 0 010 2zM11 8a1 1 0 110-2 1 1 0 010 2zM12 11a1 1 0 11-2 0 1 1 0 012 0z"/>
        </svg>
      </div>
      
      {/* タスク本体 */}
      <div 
        className="pl-6"
        style={{ height: '48px' }} // 進捗バーの高さ24px + 余白24px
      >
        <div className="flex items-center space-x-3 h-full px-4">
          {/* アバター */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(task.avatar) }}
          >
            {getAvatarInitials(task.avatar)}
          </div>
          
          {/* タスク情報 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate text-sm">{task.name}</h4>
            <p className="text-xs text-gray-500">
              {task.assignees && task.assignees.length > 0 ? task.assignees.join(', ') : '未割当'} • {Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24))}日間
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}