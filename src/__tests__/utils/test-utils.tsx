import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/providers/AuthProvider'

// Mock Supabase client for tests
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        data: null,
        error: null,
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      }),
    }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
      unsubscribe: jest.fn(),
    }),
  },
}))

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Common test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: 'test-project-id',
  title: 'Test Project',
  description: 'Test Description',
  color: '#667eea',
  user_id: 'test-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  members: [],
  target_period: null,
  ...overrides,
})

export const createMockTask = (overrides = {}) => ({
  id: 'test-task-id',
  title: 'Test Task',
  description: 'Test Description',
  status: 'pending' as const,
  priority: 'medium' as const,
  start_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  project_id: 'test-project-id',
  user_id: 'test-user-id',
  assignee: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  archive: false,
  order_index: 0,
  ...overrides,
})

export const createMockFocusMode = (overrides = {}) => ({
  id: 'test-focus-mode-id',
  user_id: 'test-user-id',
  title: 'Test Focus Mode',
  description: 'Test Description',
  target_hours: 8,
  is_active: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockSalesTarget = (overrides = {}) => ({
  id: 'test-sales-target-id',
  project_id: 'test-project-id',
  user_id: 'test-user-id',
  target_amount: 100000,
  current_amount: 50000,
  target_month: new Date().toISOString().split('T')[0].slice(0, 7),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Test helpers for async operations
export const waitFor = (callback: () => void, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const check = () => {
      try {
        callback()
        resolve(true)
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error)
        } else {
          setTimeout(check, 10)
        }
      }
    }
    check()
  })
}

// Mock implementations for common hooks
export const mockUseAuth = {
  user: createMockUser(),
  loading: false,
  error: null,
  signOut: jest.fn(),
}

export const mockUseProjects = {
  projects: [createMockProject()],
  loading: false,
  error: null,
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  refreshProjects: jest.fn(),
}

export const mockUseTasks = {
  tasks: [createMockTask()],
  loading: false,
  error: null,
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  refreshTasks: jest.fn(),
}

export const mockUseFocusMode = {
  focusMode: createMockFocusMode(),
  loading: false,
  error: null,
  createFocusMode: jest.fn(),
  updateFocusMode: jest.fn(),
  deleteFocusMode: jest.fn(),
  refreshFocusMode: jest.fn(),
}