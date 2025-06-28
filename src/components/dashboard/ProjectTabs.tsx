/**
 * プロジェクトタブコンポーネント
 * 
 * 設計参照: UI-requirements.md § 3.1 プロジェクトタブ
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - Dashboard: ダッシュボードページ
 * - useTasks: タスク管理フック
 * - useProjects: プロジェクト管理フック
 * 
 * 実装要件:
 * - 直近1週間タブ（赤背景）
 * - すべてタブ
 * - 個別プロジェクトタブ
 * - フォーカスモードトグル
 * - プロジェクト選択時のKPI表示
 */

'use client'

import { useState } from 'react'
import { Project } from '@/types'
import { useProjects } from '@/hooks/useProjects'

interface ProjectTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  focusMode: boolean
  onFocusModeToggle: () => void
}

export default function ProjectTabs({
  activeTab,
  onTabChange,
  focusMode,
  onFocusModeToggle
}: ProjectTabsProps) {
  const { projects } = useProjects()

  const tabs = [
    { id: 'recent', label: '📅 直近1週間', isSpecial: true },
    { id: 'all', label: 'すべて', isSpecial: false },
    ...projects.map(project => ({
      id: project.id,
      label: project.name,
      isSpecial: false,
      color: project.color
    }))
  ]

  const getTabStyle = (tab: any) => {
    const isActive = activeTab === tab.id
    
    if (tab.isSpecial && tab.id === 'recent') {
      return isActive
        ? 'px-6 py-3 text-sm font-medium text-white bg-red-500 border-b-2 border-red-500'
        : 'px-6 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-b-2 border-transparent'
    }
    
    return isActive
      ? 'px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-500'
      : 'px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
  }

  const selectedProject = projects.find(p => p.id === activeTab)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={getTabStyle(tab)}
            >
              {tab.label}
            </button>
          ))}
          
          {/* フォーカスモードトグル */}
          <div className="ml-auto flex items-center px-4">
            <label className="flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-700">フォーカスモード</span>
              <input
                type="checkbox"
                checked={focusMode}
                onChange={onFocusModeToggle}
                className="sr-only"
              />
              <div className="relative">
                <div className={`block w-10 h-6 rounded-full ${focusMode ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${focusMode ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </div>
            </label>
          </div>
        </nav>
      </div>
      
      {/* プロジェクトKPI表示 */}
      {selectedProject && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">{selectedProject.name}</h3>
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: selectedProject.color }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{selectedProject.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded p-3">
              <div className="text-gray-600">ステータス</div>
              <div className="font-semibold capitalize">{selectedProject.status}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="text-gray-600">今月目標</div>
              <div className="font-semibold">¥1,000,000</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="text-gray-600">来月目標</div>
              <div className="font-semibold">¥1,200,000</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 直近1週間タブの説明 */}
      {activeTab === 'recent' && (
        <div className="p-4 bg-red-50 border-b border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-red-700">
            <span>⚠️</span>
            <span>1週間以内に期限が迫っているタスクを表示中</span>
          </div>
        </div>
      )}
      
      {/* すべてタブの説明 */}
      {activeTab === 'all' && (
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <div className="flex space-x-8 text-sm">
            <div>
              <span className="text-gray-600">今月目標：</span>
              <span className="font-semibold">¥1,000,000</span>
            </div>
            <div>
              <span className="text-gray-600">来月目標：</span>
              <span className="font-semibold">¥1,200,000</span>
            </div>
            <div>
              <span className="text-gray-600">再来月目標：</span>
              <span className="font-semibold">¥1,500,000</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}