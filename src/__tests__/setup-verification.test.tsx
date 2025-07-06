import { render, screen } from '@testing-library/react'
import { createMockUser, createMockProject } from './utils/test-utils'

// Jest + React Testing Library セットアップ検証テスト
describe('Jest + React Testing Library セットアップ検証', () => {
  test('基本的なレンダリングが動作する', () => {
    const TestComponent = () => <div data-testid="test">テストコンポーネント</div>
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('test')).toBeInTheDocument()
    expect(screen.getByText('テストコンポーネント')).toBeInTheDocument()
  })

  test('モックデータ生成関数が動作する', () => {
    const mockUser = createMockUser({ email: 'custom@example.com' })
    const mockProject = createMockProject({ title: 'カスタムプロジェクト' })
    
    expect(mockUser).toHaveProperty('id')
    expect(mockUser).toHaveProperty('email', 'custom@example.com')
    expect(mockProject).toHaveProperty('title', 'カスタムプロジェクト')
  })

  test('Jest環境変数が正しく設定されている', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  test('TypeScript型チェックが動作する', () => {
    interface TestInterface {
      id: string
      name: string
    }
    
    const testData: TestInterface = {
      id: 'test-id',
      name: 'テストネーム'
    }
    
    expect(testData.id).toBe('test-id')
    expect(testData.name).toBe('テストネーム')
  })
})