/**
 * ボタンコンポーネント
 * 
 * 設計参照: UI-requirements.md § 9.2 視覚フィードバック
 * 技術仕様: technical-requirements.md § 4.2 共通UIコンポーネント
 * 
 * 関連コンポーネント:
 * - 全てのページで使用される基本UIコンポーネント
 * 
 * 実装要件:
 * - プライマリ/セカンダリバリアント対応
 * - ホバー効果（0.2〜0.3秒トランジション）
 * - 紫グラデーション適用（プライマリ）
 */

import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-gradient-primary text-white hover:shadow-lg',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  )
}