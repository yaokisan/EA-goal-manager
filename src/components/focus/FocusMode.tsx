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

import { useState, useEffect } from 'react'
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
    debugSupabase
  } = useFocusMode()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<FocusData>>({
    goal: '',
    deadline: ''
  })

  // focusDataが変更されたらeditDataを更新
  useEffect(() => {
    if (focusData) {
      setEditData({
        goal: focusData.goal || '',
        deadline: focusData.deadline || ''
      })
    }
  }, [focusData])

  if (!isVisible) return null
  
  if (loading && !focusData) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3">フォーカスモードを読み込み中...</span>
        </div>
      </div>
    )
  }
  
  if (!focusData || !focusData.goal || focusData.goal.trim() === '') return null

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
      console.log('=== フォーカスモード保存開始 ===')
      console.log('保存データ:', editData)
      
      // データベース構造に合わせて、goal と deadline のみ送信
      const saveData = {
        goal: editData.goal,
        deadline: editData.deadline
      }
      console.log('実際に送信するデータ:', saveData)
      
      await updateFocusData(saveData)
      setIsEditing(false)
      
      console.log('=== フォーカスモード保存完了 ===')
    } catch (error) {
      console.error('フォーカス目標の更新に失敗:', error)
    }
  }

  // デバッグ用ボタンのハンドラー
  const handleDebug = async () => {
    await debugSupabase()
  }

  const handleCancel = () => {
    setEditData({
      goal: focusData?.goal || '',
      deadline: focusData?.deadline || ''
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
                value={editData.goal}
                onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
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
            
            
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              onClick={handleCancel} 
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg"
            >
              キャンセル
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 shadow-sm text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🎯</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{focusData?.goal}</h3>
            <p className="text-sm text-blue-100 mt-1">
              期限: {focusData?.deadline ? new Date(focusData.deadline).toLocaleDateString('ja-JP') : '未設定'} 
              <span className="ml-2 text-white font-medium">({getUrgencyText()})</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="text-white hover:text-blue-100 text-sm px-3 py-1 rounded border border-white border-opacity-30 hover:border-opacity-50 transition-colors disabled:opacity-50"
          >
            編集
          </button>
        </div>
      </div>
    </div>
  )
}