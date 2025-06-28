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
    updateFocusData,
    updateProgress 
  } = useFocusMode()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Omit<FocusData, 'id' | 'created_at' | 'updated_at'>>(focusData)

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
      description: focusData.description,
      progress: focusData.progress
    })
    setIsEditing(false)
  }

  const handleProgressChange = async (newProgress: number) => {
    try {
      await updateProgress(newProgress)
    } catch (error) {
      console.error('進捗の更新に失敗:', error)
    }
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                進捗率
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editData.progress}
                  onChange={(e) => setEditData({ ...editData, progress: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-700 w-12">
                  {editData.progress}%
                </span>
              </div>
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
    <div className={`bg-gradient-to-r ${getUrgencyColor()} rounded-lg p-4 text-white ${shouldAnimate ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="text-xs opacity-90">フォーカス期限</div>
              <div className="font-bold text-base">
                {new Date(focusData.deadline).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="text-xs font-medium opacity-90">
                {getUrgencyText()}
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-1">{focusData.title}</h3>
          <p className="text-white/90 text-sm leading-relaxed line-clamp-2">
            {focusData.description}
          </p>
        </div>
        
        <div className="flex flex-row space-x-2 ml-4">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="text-white/80 hover:text-white text-xs px-2 py-1 rounded border border-white/30 hover:border-white/50 transition-colors disabled:opacity-50"
          >
            編集
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xs px-2 py-1 rounded border border-white/30 hover:border-white/50 transition-colors"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
      
      {/* 進捗インジケーター */}
      <div className="mt-3 pt-3 border-t border-white/20">
        <div className="flex items-center justify-between text-xs mb-2">
          <span>進捗状況</span>
          <div className="flex items-center space-x-2">
            <span>{focusData.progress}%</span>
            {focusData.progress === 100 && <span>🎉</span>}
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${focusData.progress}%` }}
          ></div>
        </div>
        
        {/* クイック進捗更新ボタン */}
        <div className="flex justify-center space-x-1 mt-2">
          {[25, 50, 75, 100].map(progress => (
            <button
              key={progress}
              onClick={() => handleProgressChange(progress)}
              disabled={loading || focusData.progress === progress}
              className={`text-xs px-1.5 py-0.5 rounded border border-white/30 transition-colors
                ${focusData.progress === progress 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                } disabled:opacity-50`}
            >
              {progress}%
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}