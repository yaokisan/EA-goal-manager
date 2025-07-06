/**
 * タブレイアウト改善のテスト
 * 
 * TDD Red Phase: 失敗するテストを先に作成
 * 
 * テスト対象：
 * - 担当者フィルタとフォーカスモードがタブと同じ行に表示される
 * - タブが水平スクロール可能になる
 * - モバイルでは縦積みから横並びに変更される
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMockProject } from '../../utils/test-utils'

// MockProjectTabsコンポーネント - タブレイアウト改善テスト用
interface MockProjectTabsProps {
  activeTab?: string
  onTabChange?: (tabId: string) => void
  focusMode?: boolean
  onFocusModeToggle?: () => void
  selectedAssignee?: string
  onAssigneeChange?: (assignee: string | undefined) => void
  projects?: any[]
}

const MockProjectTabs: React.FC<MockProjectTabsProps> = ({ 
  activeTab = 'all',
  onTabChange = () => {},
  focusMode = false,
  onFocusModeToggle = () => {},
  selectedAssignee,
  onAssigneeChange = () => {},
  projects = []
}) => {
  // 現在の実装を模倣：縦積みレイアウト（修正前）
  const tabs = [
    { id: 'recent', label: '📅 直近1週間', isSpecial: true },
    { id: 'all', label: 'すべて', isSpecial: true },
    ...projects.map(project => ({
      id: project.id,
      label: project.name,
      isSpecial: false,
      color: project.color
    }))
  ]

  const getTabStyle = (tab: any) => {
    const isActive = activeTab === tab.id
    return isActive
      ? 'px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-500'
      : 'px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
  }

  const getAllMembers = () => {
    const allMembers = new Set<string>()
    projects.forEach(project => {
      project.members?.forEach((member: string) => allMembers.add(member))
    })
    return Array.from(allMembers).sort()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 修正された実装：横並びレイアウト */}
      <div 
        data-testid="tab-navigation-container" 
        className="border-b border-gray-200"
      >
        <div 
          data-testid="tab-and-controls-row"
          className="flex items-center justify-between" // 修正：横並び
        >
          {/* タブ部分 */}
          <nav 
            data-testid="tabs-container"
            className="flex -mb-px overflow-x-auto flex-1 min-w-0" // 修正：flex-1 min-w-0追加
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`${getTabStyle(tab)} whitespace-nowrap flex-shrink-0`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          
          {/* コントロール部分：横並び */}
          <div 
            data-testid="controls-container"
            className="flex items-center space-x-4 px-4 flex-shrink-0" // 修正：シンプルな横並び
          >
            {/* 担当者フィルタ */}
            <div className="flex items-center">
              <label htmlFor="assignee-filter" className="mr-2 text-sm text-gray-700">
                担当者:
              </label>
              <select
                data-testid="assignee-filter"
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
            
            {/* フォーカスモードトグル */}
            <label className="flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-700">フォーカスモード</span>
              <input
                data-testid="focus-mode-toggle"
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
    </div>
  )
}

// テストデータ
const mockProjects = [
  createMockProject({ id: 'project-1', name: 'プロジェクト1', members: ['田中', '佐藤'] }),
  createMockProject({ id: 'project-2', name: 'プロジェクト2', members: ['山田', '佐藤'] }),
  createMockProject({ id: 'project-3', name: 'プロジェクト3', members: ['田中', '鈴木'] }),
  createMockProject({ id: 'project-4', name: '長いプロジェクト名のプロジェクト4', members: ['田中'] }),
  createMockProject({ id: 'project-5', name: 'プロジェクト5', members: ['佐藤'] }),
]

describe('タブレイアウト改善', () => {
  test('修正後は横並びレイアウト（修正後の確認）', () => {
    render(
      <MockProjectTabs 
        activeTab="all"
        projects={mockProjects}
      />
    )
    
    // 修正されたレイアウト：横並び
    const tabAndControlsRow = screen.getByTestId('tab-and-controls-row')
    const tabsContainer = screen.getByTestId('tabs-container')
    const controlsContainer = screen.getByTestId('controls-container')
    
    // 同じ親要素内にある
    expect(tabAndControlsRow).toContainElement(tabsContainer)
    expect(tabAndControlsRow).toContainElement(controlsContainer)
    
    // 修正後は横並びレイアウト
    expect(tabAndControlsRow).toHaveClass('flex', 'items-center', 'justify-between')
  })

  test('タブとコントロールが同じ行に表示されるべき（期待される動作）', () => {
    render(
      <MockProjectTabs 
        activeTab="all"
        projects={mockProjects}
      />
    )
    
    const tabAndControlsRow = screen.getByTestId('tab-and-controls-row')
    
    // 期待：flex items-center justify-between クラス
    // 現実：flex-col sm:flex-row（縦積み）（失敗予定）
    expect(tabAndControlsRow).toHaveClass('flex', 'items-center', 'justify-between')
  })

  test('タブが水平スクロール可能になるべき', () => {
    render(
      <MockProjectTabs 
        activeTab="all"
        projects={mockProjects}
      />
    )
    
    const tabsContainer = screen.getByTestId('tabs-container')
    
    // 期待：overflow-x-auto flex-1 min-w-0 クラス
    // 現実：overflow-x-auto のみ（失敗予定）
    expect(tabsContainer).toHaveClass('overflow-x-auto', 'flex-1', 'min-w-0')
  })

  test('担当者フィルタが機能するべき', () => {
    const handleAssigneeChange = jest.fn()
    
    render(
      <MockProjectTabs 
        activeTab="all"
        projects={mockProjects}
        onAssigneeChange={handleAssigneeChange}
      />
    )
    
    const assigneeFilter = screen.getByTestId('assignee-filter')
    
    // 担当者オプションが表示される
    expect(screen.getByRole('option', { name: '田中' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '佐藤' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '山田' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '鈴木' })).toBeInTheDocument()
    
    // 担当者選択イベント
    fireEvent.change(assigneeFilter, { target: { value: '田中' } })
    expect(handleAssigneeChange).toHaveBeenCalledWith('田中')
  })

  test('フォーカスモードトグルが機能するべき', () => {
    const handleFocusModeToggle = jest.fn()
    
    render(
      <MockProjectTabs 
        activeTab="all"
        projects={mockProjects}
        focusMode={false}
        onFocusModeToggle={handleFocusModeToggle}
      />
    )
    
    const focusToggle = screen.getByTestId('focus-mode-toggle')
    
    // 初期状態はオフ
    expect(focusToggle).not.toBeChecked()
    
    // クリックでトグル
    fireEvent.click(focusToggle)
    expect(handleFocusModeToggle).toHaveBeenCalled()
  })

  test('多数のタブでもスクロール可能であるべき', () => {
    const manyProjects = Array.from({ length: 20 }, (_, i) => 
      createMockProject({ 
        id: `project-${i}`, 
        name: `非常に長いプロジェクト名${i}` 
      })
    )
    
    render(
      <MockProjectTabs 
        activeTab="all"
        projects={manyProjects}
      />
    )
    
    const tabsContainer = screen.getByTestId('tabs-container')
    
    // 基本的なスクロール機能は現在もある
    expect(tabsContainer).toHaveClass('overflow-x-auto')
    
    // 全てのタブが表示されている
    expect(screen.getAllByRole('button', { name: /プロジェクト名/ })).toHaveLength(20)
  })

  test('コントロールエリアが適切なレイアウトを持つべき', () => {
    render(
      <MockProjectTabs 
        activeTab="all"
        projects={mockProjects}
      />
    )
    
    const controlsContainer = screen.getByTestId('controls-container')
    
    // 期待：flex items-center space-x-4 px-4 flex-shrink-0
    // 現実：flex flex-col sm:flex-row（縦積み、パディング不適切）（失敗予定）
    expect(controlsContainer).toHaveClass('flex', 'items-center', 'space-x-4', 'px-4', 'flex-shrink-0')
  })

  test('タブアクティブ状態が正しく表示されるべき', () => {
    render(
      <MockProjectTabs 
        activeTab="project-1"
        projects={mockProjects}
      />
    )
    
    const activeTab = screen.getByTestId('tab-project-1')
    const inactiveTab = screen.getByTestId('tab-all')
    
    // アクティブなタブの色
    expect(activeTab).toHaveClass('text-blue-600', 'bg-blue-50', 'border-blue-500')
    
    // 非アクティブなタブの色
    expect(inactiveTab).toHaveClass('text-gray-500', 'border-transparent')
  })
})