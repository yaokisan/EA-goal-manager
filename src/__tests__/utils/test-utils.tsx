/**
 * テストユーティリティ
 * 
 * React Testing Libraryのカスタムレンダー関数と
 * テスト用のヘルパー関数を提供
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
// import { AuthProvider } from '@/providers/AuthProvider'

// テスト用のAuthProviderのモック
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="mock-auth-provider">
      {children}
    </div>
  )
}

// カスタムレンダー関数
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // プロバイダーをカスタマイズする場合のオプション
  withAuth?: boolean
  initialAuthState?: {
    user: any
    loading: boolean
  }
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { withAuth = true, ...renderOptions } = options

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    if (withAuth) {
      return (
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      )
    }
    return <>{children}</>
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions })
}

// テストデータファクトリー
export const createMockTask = (overrides = {}) => ({
  id: 'test-task-1',
  name: 'テストタスク',
  project_id: 'test-project-1',
  assignees: ['テストユーザー'],
  start_date: '2024-01-01',
  end_date: '2024-01-07',
  status: 'pending' as const,
  completed_at: null,
  is_archived: false,
  archived_at: null,
  user_id: 'test-user-1',
  order_index: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: 'test-project-1',
  name: 'テストプロジェクト',
  description: 'テスト用のプロジェクトです',
  status: 'active' as const,
  color: '#667eea',
  user_id: 'test-user-1',
  members: ['テストユーザー'],
  target_start_month: '2024-01',
  target_end_month: '2024-12',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockSalesTarget = (overrides = {}) => ({
  id: 'test-target-1',
  project_id: 'test-project-1',
  year_month: '2024-01',
  target_amount: 1000000,
  qualitative_goal: 'テスト目標',
  user_id: 'test-user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockFocusData = (overrides = {}) => ({
  id: 'test-focus-1',
  goal: 'テスト目標',
  deadline: '2024-07-20',
  project_id: null,
  is_active: true,
  user_id: 'test-user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// カスタムマッチャー
export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

// 非同期処理のヘルパー
export const waitForLoadingToFinish = async () => {
  const { findByTestId } = customRender(<div data-testid="loading">Loading...</div>)
  try {
    await findByTestId('loading', {}, { timeout: 100 })
  } catch {
    // ローディングが表示されない場合は正常
  }
}

// イベント発火のヘルパー
export const createMockEvent = (type: string, eventInit = {}) => {
  return new Event(type, { bubbles: true, cancelable: true, ...eventInit })
}

// すべてを再エクスポート
export * from '@testing-library/react'
export { customRender as render }