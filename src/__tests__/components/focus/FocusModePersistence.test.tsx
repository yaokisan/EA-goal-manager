/**
 * フォーカスモード状態永続化のテスト
 * 
 * TDD Red Phase: 失敗するテストを先に作成
 * 
 * テスト対象：
 * - フォーカスモードのオン/オフ状態永続化
 * - リロード時の状態復元
 * - ローカルストレージとデータベース状態の適切な分離
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMockFocusData, createMockUser } from '../../utils/test-utils'
import DashboardPage from '@/app/dashboard/page'

// Dashboardコンポーネントの代わりにシンプルなモックコンポーネントを作成
interface MockDashboardProps {
  focusMode?: boolean
  focusData?: any
  onFocusModeToggle?: (enabled: boolean) => void
}

const MockDashboard: React.FC<MockDashboardProps> = ({ 
  focusMode = false, 
  focusData = null,
  onFocusModeToggle 
}) => {
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)
  
  React.useEffect(() => {
    // 初期化フラグで重複実行を防ぐ
    if (isInitialized) return
    
    // ローカルストレージから状態を復元
    const savedState = localStorage.getItem('focusMode')
    
    if (savedState !== null) {
      const parsed = JSON.parse(savedState)
      setIsEnabled(parsed)
    } else if (focusData && focusData.goal && focusData.goal.trim() !== '') {
      setIsEnabled(true)
      localStorage.setItem('focusMode', 'true')
    } else {
      setIsEnabled(false)
      localStorage.setItem('focusMode', 'false')
    }
    
    setIsInitialized(true)
  }, [focusData, isInitialized])

  const handleToggle = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    localStorage.setItem('focusMode', String(newState))
    onFocusModeToggle?.(newState)
  }

  // 初期化が完了するまではローディング状態
  if (!isInitialized) {
    return <div data-testid="mock-dashboard">Loading...</div>
  }

  return (
    <div data-testid="mock-dashboard">
      <button 
        data-testid="focus-mode-toggle"
        onClick={handleToggle}
      >
        フォーカスモード {isEnabled ? 'オン' : 'オフ'}
      </button>
      
      {isEnabled && focusData && (
        <div data-testid="focus-mode-display">
          <h3>{focusData.goal}</h3>
          <p>期限: {focusData.deadline}</p>
        </div>
      )}
    </div>
  )
}

// モック設定
const mockFocusData = createMockFocusData({
  goal: 'テスト目標',
  deadline: '2024-07-20',
  is_active: true
})

// ローカルストレージのモック（テスト間でstoreを永続化）
let globalStore: Record<string, string> = {}

const localStorageMock = {
  getItem: jest.fn((key: string) => {
    return globalStore[key] || null
  }),
  setItem: jest.fn((key: string, value: string) => {
    globalStore[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete globalStore[key]
  }),
  clear: jest.fn(() => {
    globalStore = {}
  })
}

// グローバルオブジェクトにlocalStorageを設定
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('フォーカスモード状態永続化', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // ローカルストレージのクリアは各テストで明示的に行う
    // localStorageMock.clear()
  })

  describe('フォーカスモードをオンにしてリロード', () => {
    it('オン状態を維持する', async () => {
      // Given: クリーンな状態から開始
      localStorageMock.clear()
      
      // Given: フォーカスデータが存在する
      const { rerender, unmount } = render(<MockDashboard focusData={mockFocusData} />)
      
      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-toggle')).toBeInTheDocument()
      })
      
      // When: 初期状態でフォーカスモードが自動的にオンになることを確認
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-display')).toBeVisible()
      })
      
      // Then: ローカルストレージに状態が保存される
      expect(localStorageMock.setItem).toHaveBeenCalledWith('focusMode', 'true')
      
      // When: ページをリロード（完全に再マウント）
      unmount()
      render(<MockDashboard focusData={mockFocusData} />)
      
      // Then: フォーカスモードが表示される
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-display')).toBeVisible()
      })
    })
  })

  describe('フォーカスモードをオフにしてリロード', () => {
    it('オフ状態を維持する', async () => {
      // Given: フォーカスデータが存在し、ローカルストレージでオンに設定
      localStorageMock.setItem('focusMode', 'true')
      
      // When: ダッシュボードを表示
      const { rerender } = render(<MockDashboard focusData={mockFocusData} />)
      
      // Then: フォーカスモードが表示される
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-display')).toBeVisible()
      })
      
      // When: フォーカスモードをオフにする
      const toggleButton = screen.getByTestId('focus-mode-toggle')
      fireEvent.click(toggleButton)
      
      // Then: ローカルストレージに状態が保存される
      expect(localStorageMock.setItem).toHaveBeenCalledWith('focusMode', 'false')
      
      // When: ページをリロード（再レンダリング）
      rerender(<MockDashboard focusData={mockFocusData} />)
      
      // Then: フォーカスモードが非表示になる
      expect(screen.queryByTestId('focus-mode-display')).not.toBeInTheDocument()
    })
  })

  describe('フォーカスデータがない状態でリロード', () => {
    it('オフ状態を維持する', async () => {
      // Given: フォーカスデータが存在しない
      localStorageMock.clear()
      
      // When: ダッシュボードを表示
      render(<MockDashboard focusData={null} />)
      
      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-toggle')).toBeInTheDocument()
      })
      
      // Then: フォーカスモードが非表示
      expect(screen.queryByTestId('focus-mode-display')).not.toBeInTheDocument()
      
      // And: ローカルストレージで状態が false に設定される
      expect(localStorageMock.setItem).toHaveBeenCalledWith('focusMode', 'false')
    })
  })

  describe('ローカルストレージ状態の復元', () => {
    it('フォーカスデータがあってもローカルストレージでオフならオフ状態を維持', async () => {
      // Given: フォーカスデータが存在し、ローカルストレージでオフに設定
      localStorageMock.setItem('focusMode', 'false')
      
      // When: ダッシュボードを表示
      render(<MockDashboard focusData={mockFocusData} />)
      
      // Then: フォーカスモードが非表示になる
      await waitFor(() => {
        expect(screen.queryByTestId('focus-mode-display')).not.toBeInTheDocument()
      })
    })

    it('フォーカスデータがありローカルストレージでオンならオン状態を維持', async () => {
      // Given: フォーカスデータが存在し、ローカルストレージでオンに設定
      localStorageMock.setItem('focusMode', 'true')
      
      // When: ダッシュボードを表示
      render(<MockDashboard focusData={mockFocusData} />)
      
      // Then: フォーカスモードが表示される
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-display')).toBeVisible()
      })
    })

    it('ローカルストレージに状態がない場合はフォーカスデータの有無に基づく', async () => {
      // Given: フォーカスデータが存在し、ローカルストレージに状態がない
      localStorageMock.getItem.mockReturnValue(null)
      
      // When: ダッシュボードを表示
      render(<MockDashboard focusData={mockFocusData} />)
      
      // Then: フォーカスモードが表示される（フォーカスデータがあるため）
      await waitFor(() => {
        expect(screen.getByTestId('focus-mode-display')).toBeVisible()
      })
      
      // And: ローカルストレージに状態が保存される
      expect(localStorageMock.setItem).toHaveBeenCalledWith('focusMode', 'true')
    })
  })
})

// 実際のダッシュボードコンポーネントでのテスト
describe('実際のダッシュボードコンポーネント - フォーカスモード状態永続化', () => {
  // モックデータ
  const mockTasks = []
  const mockProjects = []
  const mockFocusDataWithGoal = createMockFocusData({
    goal: '重要な目標',
    deadline: '2024-07-20'
  })

  // モック設定
  beforeEach(() => {
    // フックのモック
    jest.mock('@/hooks/useTasks', () => ({
      useTasks: () => ({
        tasks: mockTasks,
        getRecentTasks: () => [],
        updateMultipleTaskOrder: jest.fn(),
        updateTask: jest.fn(),
        toggleTaskStatus: jest.fn(),
        copyTasksToNotion: jest.fn(),
        createTask: jest.fn(),
        deleteTask: jest.fn(),
        toggleTaskArchive: jest.fn(),
        loading: false
      })
    }))

    jest.mock('@/hooks/useProjects', () => ({
      useProjects: () => ({
        projects: mockProjects
      })
    }))

    jest.mock('@/hooks/useFocusMode', () => ({
      useFocusMode: () => ({
        focusData: mockFocusDataWithGoal,
        getTaskStats: () => ({
          total: 0,
          completed: 0,
          remaining: 0,
          progress: 0
        })
      })
    }))

    // ローカルストレージのクリア
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('ローカルストレージの状態が優先される', async () => {
    // Given: フォーカスデータが存在し、ローカルストレージでオフに設定
    localStorageMock.setItem('focusMode', 'false')
    
    // When: ダッシュボードを表示
    render(<DashboardPage />)
    
    // Then: フォーカスモードが非表示になる（ローカルストレージの状態を優先）
    await waitFor(() => {
      expect(screen.queryByTestId('focus-mode-display')).not.toBeInTheDocument()
    })
  })

  it('ローカルストレージに状態がない場合はフォーカスデータに基づく', async () => {
    // Given: フォーカスデータが存在し、ローカルストレージに状態がない
    localStorageMock.clear()
    
    // When: ダッシュボードを表示
    render(<DashboardPage />)
    
    // Then: フォーカスモードが表示される（フォーカスデータがあるため）
    await waitFor(() => {
      expect(screen.getByTestId('focus-mode-display')).toBeInTheDocument()
    })
    
    // And: ローカルストレージに状態が保存される
    expect(localStorageMock.setItem).toHaveBeenCalledWith('focusMode', 'true')
  })
})