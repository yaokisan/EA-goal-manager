/**
 * Button コンポーネントのテスト
 * 
 * TDDの例として基本的なUIコンポーネントのテストを実装
 * React Testing Library を使用したユーザー中心のテスト
 */

import { render, screen, fireEvent } from '../../utils/test-utils'

// シンプルなButtonコンポーネント（テスト用）
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = '',
}) => {
  const baseClasses = 'font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  }
  
  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  }
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`.trim()
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  )
}

describe('Button Component', () => {
  describe('基本的なレンダリング', () => {
    it('子要素を表示する', () => {
      render(<Button>クリックしてください</Button>)
      expect(screen.getByText('クリックしてください')).toBeInTheDocument()
    })
    
    it('ボタン要素として表示される', () => {
      render(<Button>テストボタン</Button>)
      expect(screen.getByRole('button', { name: 'テストボタン' })).toBeInTheDocument()
    })
  })
  
  describe('クリックイベント', () => {
    it('クリック時にonClickが呼ばれる', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>クリック</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
    
    it('無効化されている場合はクリックイベントが発火しない', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick} disabled>無効化されたボタン</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })
  
  describe('プロパティ', () => {
    it('disabled状態が正しく反映される', () => {
      render(<Button disabled>無効化されたボタン</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
    
    it('variantに応じてクラスが適用される', () => {
      const { rerender } = render(<Button variant="primary">プライマリ</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600')
      
      rerender(<Button variant="danger">デンジャー</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-red-600')
    })
    
    it('sizeに応じてクラスが適用される', () => {
      const { rerender } = render(<Button size="small">小</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-2', 'py-1', 'text-sm')
      
      rerender(<Button size="large">大</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg')
    })
    
    it('カスタムクラスが適用される', () => {
      render(<Button className="custom-class">カスタム</Button>)
      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })
  })
  
  describe('アクセシビリティ', () => {
    it('フォーカスリングが設定されている', () => {
      render(<Button>フォーカステスト</Button>)
      expect(screen.getByRole('button')).toHaveClass('focus:ring-2')
    })
    
    it('キーボードでアクセス可能', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>キーボードテスト</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
      
      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyUp(button, { key: 'Enter' })
      
      // エンターキーでもクリックイベントが発火することを確認
      expect(handleClick).toHaveBeenCalled()
    })
  })
})