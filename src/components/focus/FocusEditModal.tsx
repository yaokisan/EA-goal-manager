/**
 * フォーカスモード編集モーダルコンポーネント
 * 
 * 設計参照: UI-requirements.md § 6 フォーカスモード機能
 * 技術仕様: technical-requirements.md § 4.4 フォーカスモード実装
 * 
 * 関連コンポーネント:
 * - FocusMode: フォーカスモード表示
 * - useFocusMode: フォーカスモード管理フック
 * 
 * 実装要件:
 * - 新規フォーカス目標作成
 * - 既存フォーカス目標編集
 * - モーダル形式で表示
 */

'use client'

import { useState, useEffect } from 'react'
import { useFocusMode, FocusData } from '@/hooks/useFocusMode'

interface FocusEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export default function FocusEditModal({ isOpen, onClose, onSave }: FocusEditModalProps) {
  const { 
    focusData, 
    loading, 
    createFocusData,
    updateFocusData
  } = useFocusMode()
  
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
    } else {
      // 新規作成の場合はデフォルト値
      const twoWeeksFromNow = new Date()
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
      setEditData({
        goal: '',
        deadline: twoWeeksFromNow.toISOString().split('T')[0]
      })
    }
  }, [focusData])

  const handleSave = async () => {
    try {
      // 空入力チェック
      if (!editData.goal || editData.goal.trim() === '') {
        // 空入力の場合はキャンセル扱い
        onClose()
        return
      }

      const saveData = {
        goal: editData.goal,
        deadline: editData.deadline
      }
      
      if (!focusData) {
        // 新規作成の場合
        await createFocusData(saveData)
      } else {
        // 更新の場合
        await updateFocusData(saveData)
      }
      
      onSave?.() // 保存成功のコールバック
      onClose()
    } catch (error) {
      console.error('フォーカス目標の保存に失敗:', error)
    }
  }

  const handleCancel = () => {
    setEditData({
      goal: focusData?.goal || '',
      deadline: focusData?.deadline || ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {focusData ? 'フォーカス目標を編集' : 'フォーカス目標を設定'}
        </h2>
        
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
              autoFocus
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
            className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg disabled:opacity-50"
          >
            キャンセル
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}