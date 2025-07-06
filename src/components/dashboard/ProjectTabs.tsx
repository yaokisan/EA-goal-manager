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
 * - 個別プロジェクトタブ（ドラッグ&ドロップで並び替え可能）
 * - フォーカスモードトグル
 * - プロジェクト選択時のKPI表示
 */

'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types'
import { useProjects } from '@/hooks/useProjects'
import { useSalesTargets } from '@/hooks/useSalesTargets'
import { useProjectTabOrder } from '@/hooks/useProjectTabOrder'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable'
import {
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ProjectTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  focusMode: boolean
  onFocusModeToggle: () => void
  selectedAssignee?: string
  onAssigneeChange?: (assignee: string | undefined) => void
}

interface TabItem {
  id: string
  label: string
  isSpecial: boolean
  color?: string
}

// ドラッグ可能なタブコンポーネント
function SortableTab({ tab, isActive, getTabStyle, onTabChange }: {
  tab: TabItem
  isActive: boolean
  getTabStyle: (tab: TabItem) => string
  onTabChange: (tabId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: tab.id,
    disabled: tab.isSpecial // 特別なタブ（直近1週間、すべて）はドラッグ無効
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTabChange(tab.id)}
      className={`${getTabStyle(tab)} whitespace-nowrap flex-shrink-0 ${!tab.isSpecial ? 'cursor-move' : ''}`}
    >
      {tab.label}
    </button>
  )
}

export default function ProjectTabs({
  activeTab: activeTabId,
  onTabChange,
  focusMode,
  onFocusModeToggle,
  selectedAssignee,
  onAssigneeChange
}: ProjectTabsProps) {
  const { projects } = useProjects()
  const { fetchSalesTargets, getProjectSalesTargets } = useSalesTargets()
  const { projectOrder: savedProjectOrder, saveProjectTabOrder, loading: orderLoading } = useProjectTabOrder()
  const [localProjectOrder, setLocalProjectOrder] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  // データベースから取得した順序をローカル状態に同期
  useEffect(() => {
    if (savedProjectOrder.length > 0) {
      setLocalProjectOrder(savedProjectOrder)
    }
  }, [savedProjectOrder])

  // プロジェクトの順序を初期化（データベースから取得した順序がない場合のみ）
  useEffect(() => {
    if (projects.length > 0 && savedProjectOrder.length === 0 && !orderLoading) {
      // データベースに順序が保存されていない場合、デフォルトの順序で保存
      const defaultOrder = projects.map(p => p.id)
      setLocalProjectOrder(defaultOrder)
      saveProjectTabOrder(defaultOrder)
    }
  }, [projects, savedProjectOrder.length, orderLoading, saveProjectTabOrder])

  // ドラッグ&ドロップセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 順序に基づいてプロジェクトタブを並び替え
  const orderedProjects = localProjectOrder
    .map(id => projects.find(p => p.id === id))
    .filter(Boolean) as Project[]

  const tabs: TabItem[] = [
    { id: 'recent', label: '📅 直近1週間', isSpecial: true },
    { id: 'all', label: 'すべて', isSpecial: true },
    ...orderedProjects.map(project => ({
      id: project.id,
      label: project.name,
      isSpecial: false,
      color: project.color
    }))
  ]

  const getTabStyle = (tab: TabItem) => {
    const isActive = activeTabId === tab.id
    
    if (tab.isSpecial && tab.id === 'recent') {
      return isActive
        ? 'px-6 py-3 text-sm font-medium text-white bg-red-500 border-b-2 border-red-500'
        : 'px-6 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-b-2 border-transparent'
    }
    
    return isActive
      ? 'px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-500'
      : 'px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
  }

  const selectedProject = projects.find(p => p.id === activeTabId)
  
  // 全プロジェクトのメンバーを取得（重複を除く）
  const getAllMembers = () => {
    const allMembers = new Set<string>()
    projects.forEach(project => {
      project.members?.forEach(member => allMembers.add(member))
    })
    return Array.from(allMembers).sort()
  }
  
  // ドラッグ開始ハンドラー
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // ドラッグ終了ハンドラー
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex(tab => tab.id === active.id)
      const newIndex = tabs.findIndex(tab => tab.id === over.id)
      
      // 特別なタブ（直近1週間、すべて）の位置は変更しない
      const activeTab = tabs[oldIndex]
      const overTab = tabs[newIndex]
      
      if (!activeTab.isSpecial && !overTab.isSpecial) {
        const projectIds = orderedProjects.map(p => p.id)
        const oldProjectIndex = projectIds.indexOf(active.id as string)
        const newProjectIndex = projectIds.indexOf(over.id as string)
        
        if (oldProjectIndex !== -1 && newProjectIndex !== -1) {
          const newOrder = arrayMove(projectIds, oldProjectIndex, newProjectIndex)
          const previousOrder = [...localProjectOrder] // ロールバック用に保存
          
          // 即座にローカル状態を更新（シームレスなUX）
          setLocalProjectOrder(newOrder)
          
          // 非同期でデータベースに保存
          try {
            await saveProjectTabOrder(newOrder)
          } catch (error) {
            // 保存が失敗した場合はローカル状態をロールバック
            console.error('❌ プロジェクトタブ順序保存エラー:', error)
            setLocalProjectOrder(previousOrder)
          }
        }
      }
    }
    
    setActiveId(null)
  }
  
  // 現在の月から3ヶ月分の月を取得
  const getNext3Months = () => {
    const months = []
    const today = new Date()
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = `${date.getMonth() + 1}月目標`
      months.push({ yearMonth, label })
    }
    
    return months
  }
  
  // プロジェクトの売上目標を取得
  useEffect(() => {
    if (selectedProject) {
      fetchSalesTargets(selectedProject.id)
    }
  }, [selectedProject, fetchSalesTargets])
  
  // 売上目標データを取得
  const getSalesTargetForMonth = (projectId: string, yearMonth: string) => {
    const targets = getProjectSalesTargets(projectId)
    const target = targets.find(t => t.year_month === yearMonth)
    return target || null
  }

  // ドラッグ中のタブを取得
  const activeTab = activeId ? tabs.find(tab => tab.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row">
            <nav className="flex -mb-px overflow-x-auto">
              <SortableContext
                items={tabs.map(tab => tab.id)}
                strategy={horizontalListSortingStrategy}
              >
                {tabs.map(tab => (
                  <SortableTab
                    key={tab.id}
                    tab={tab}
                    isActive={activeTabId === tab.id}
                    getTabStyle={getTabStyle}
                    onTabChange={onTabChange}
                  />
                ))}
              </SortableContext>
            </nav>
          
          {/* フィルタとフォーカスモードトグル */}
          <div className="flex items-center justify-center sm:justify-end px-4 py-2 sm:py-0 border-t sm:border-t-0 border-gray-200 sm:border-none space-x-4">
            {/* 担当者フィルタ */}
            {onAssigneeChange && (
              <div className="flex items-center">
                <label htmlFor="assignee-filter" className="mr-2 text-sm text-gray-700">
                  担当者:
                </label>
                <select
                  id="assignee-filter"
                  value={selectedAssignee || ''}
                  onChange={(e) => onAssigneeChange(e.target.value || undefined)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  {getAllMembers().map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* フォーカスモードトグル */}
            <label className="flex items-center cursor-pointer" data-testid="focus-mode-toggle">
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
        </div>
      </div>
      
      {/* プロジェクトKPI表示 */}
      {selectedProject && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <h3 className="font-medium text-gray-900 mb-2 sm:mb-0">{selectedProject.name}</h3>
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedProject.color }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{selectedProject.description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {getNext3Months().map((month) => {
              const target = getSalesTargetForMonth(selectedProject.id, month.yearMonth)
              const hasAmount = target && target.target_amount !== null && target.target_amount !== undefined
              const hasQualitative = target && target.qualitative_goal && target.qualitative_goal.trim() !== ''
              
              return (
                <div key={month.yearMonth} className="bg-white rounded p-3">
                  <div className="text-gray-600 mb-1">{month.label}</div>
                  
                  {/* 売上目標 */}
                  {hasAmount && (
                    <div className="font-semibold">
                      ¥{target.target_amount!.toLocaleString()}
                    </div>
                  )}
                  
                  {/* 定性目標 */}
                  {hasQualitative && (
                    <div className="text-sm text-gray-700 mt-1">
                      {target.qualitative_goal}
                    </div>
                  )}
                  
                  {/* 未設定の場合 */}
                  {!hasAmount && !hasQualitative && (
                    <div className="text-gray-400">
                      未設定
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* 直近1週間タブの説明 */}
      {activeTabId === 'recent' && (
        <div className="p-4 bg-red-50 border-b border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-red-700">
            <span>⚠️</span>
            <span>1週間以内に期限が迫っているタスクを表示中</span>
          </div>
        </div>
      )}
      
      {/* すべてタブの説明 */}
      </div>
      
      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeId && (() => {
          const draggedTab = tabs.find(tab => tab.id === activeId)
          return draggedTab ? (
            <div className={`${getTabStyle(draggedTab)} whitespace-nowrap opacity-80`}>
              {draggedTab.label}
            </div>
          ) : null
        })()}
      </DragOverlay>
    </DndContext>
  )
}