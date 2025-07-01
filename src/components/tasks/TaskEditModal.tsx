/**
 * タスク編集モーダルコンポーネント
 * 
 * 設計参照: UI-requirements.md § 5 タスクリスト機能
 * 技術仕様: technical-requirements.md § 4.2 共通UIコンポーネント
 * 
 * 関連コンポーネント:
 * - Modal: モーダル基盤コンポーネント
 * - TaskCard: インライン編集の参考実装
 * - GanttChart: 呼び出し元
 * 
 * 実装要件:
 * - タスク名、期間、担当者の編集
 * - プロジェクト情報の表示（編集不可）
 * - 保存・キャンセル機能
 */

'use client'

import { useState, useEffect } from 'react'
import { Task, Project } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'

interface TaskEditModalProps {
  isOpen: boolean
  task: Task | null
  project?: Project
  availableMembers?: string[]
  onClose: () => void
  onSave: (taskId: string, data: Partial<Task>) => Promise<void>
}

export default function TaskEditModal({
  isOpen,
  task,
  project,
  availableMembers = [],
  onClose,
  onSave
}: TaskEditModalProps) {
  const [editData, setEditData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    assignees: [] as string[]
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // タスクが変更されたら編集データを初期化
  useEffect(() => {
    console.log('TaskEditModal - isOpen:', isOpen, 'task:', task)
    if (task) {
      setEditData({
        name: task.name,
        start_date: task.start_date,
        end_date: task.end_date,
        assignees: task.assignees || []
      })
      setError(null)
    }
  }, [task, isOpen])

  const handleSave = async () => {
    if (!task) return
    
    // バリデーション
    if (!editData.name.trim()) {
      setError('タスク名を入力してください')
      return
    }
    
    if (new Date(editData.start_date) > new Date(editData.end_date)) {
      setError('終了日は開始日より後に設定してください')
      return
    }

    setSaving(true)
    setError(null)
    
    try {
      await onSave(task.id, editData)
      onClose()
    } catch (err) {
      setError('保存に失敗しました')
      console.error('タスク保存エラー:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  const handleAssigneeToggle = (member: string) => {
    setEditData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(member)
        ? prev.assignees.filter(a => a !== member)
        : [...prev.assignees, member]
    }))
  }

  if (!task) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="タスクを編集"
      size="md"
    >
      <div className="p-6 space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* プロジェクト情報（編集不可） */}
        {project && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト
            </label>
            <div className="flex items-center">
              <Tag color={project.color} size="sm">
                {project.name}
              </Tag>
            </div>
          </div>
        )}

        {/* タスク名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タスク名
          </label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="タスク名を入力"
          />
        </div>

        {/* 期間 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始日
            </label>
            <input
              type="date"
              value={editData.start_date}
              onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了日
            </label>
            <input
              type="date"
              value={editData.end_date}
              onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 担当者 */}
        {availableMembers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              担当者
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {availableMembers.map((member) => (
                <label
                  key={member}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={editData.assignees.includes(member)}
                    onChange={() => handleAssigneeToggle(member)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{member}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}