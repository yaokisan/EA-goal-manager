/**
 * フォーカスモードコンポーネント
 * 
 * 設計参照: UI-requirements.md § 6 フォーカスモード機能
 * 技術仕様: technical-requirements.md § 4.4 フォーカスモード実装
 * 
 * 関連コンポーネント:
 * - Dashboard: ダッシュボードページ
 * - ProjectTabs: プロジェクトタブ
 * - useFocusMode: フォーカスモード管理フック
 * 
 * 実装要件:
 * - フォーカス目標の設定・編集
 * - 期限カウントダウン
 * - 進捗表示
 * - グラデーション背景
 * - モーダル編集画面
 */

'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useFocusMode, FocusData } from '@/hooks/useFocusMode'

interface FocusModeProps {
  isVisible: boolean
  onClose?: () => void
}

export default function FocusMode({ isVisible, onClose }: FocusModeProps) {
  const { 
    focusData, 
    loading, 
    daysRemaining, 
    urgencyLevel, 
    updateFocusData
  } = useFocusMode()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Omit<FocusData, 'id' | 'created_at' | 'updated_at'>>({
    title: focusData.title,
    deadline: focusData.deadline,
    description: focusData.description
  })

  if (!isVisible) return null

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'overdue': return 'from-gray-600 to-gray-800'
      case 'critical': return 'from-gray-500 to-gray-700'
      case 'urgent': return 'from-blue-600 to-indigo-700'
      case 'warning': return 'from-blue-500 to-blue-700'
      default: return 'from-blue-500 to-purple-600'
    }
  }

  const getUrgencyText = () => {
    if (daysRemaining < 0) return `期限を${Math.abs(daysRemaining)}日過ぎています`
    if (daysRemaining === 0) return '期限は今日です'
    if (daysRemaining === 1) return '期限は明日です'
    return `あと${daysRemaining}日`
  }

  const shouldAnimate = urgencyLevel === 'critical' || urgencyLevel === 'urgent'

  const handleSave = async () => {
    try {
      await updateFocusData(editData)
      setIsEditing(false)
    } catch (error) {
      console.error('フォーカス目標の更新に失敗:', error)
    }
  }

  const handleCancel = () => {
    setEditData({
      title: focusData.title,
      deadline: focusData.deadline,
      description: focusData.description
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">フォーカス目標を編集</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標タイトル
              </label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="フォーカス目標を入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期限
              </label>
              <input
                type="date"
                value={editData.deadline}
                onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="目標の詳細説明"
              />
            </div>
            
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={handleCancel} disabled={loading}>
              キャンセル
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-lg">🎯</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{focusData.title}</h3>
            <p className="text-sm text-gray-600">
              期限: {new Date(focusData.deadline).toLocaleDateString('ja-JP')} 
              <span className="ml-2 text-blue-600 font-medium">{getUrgencyText()}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            編集
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  )
}