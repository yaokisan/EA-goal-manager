/**
 * タグコンポーネント
 * 
 * 設計参照: UI-requirements.md § 5.1 タスク表示（プロジェクト名タグ）
 * 技術仕様: technical-requirements.md § 4.2 共通UIコンポーネント
 * 
 * 関連コンポーネント:
 * - TaskList: プロジェクト名表示
 * - ProjectEditor: メンバータグ表示
 * - Archive: アーカイブ日付タグ
 * 
 * 実装要件:
 * - 背景色カスタマイズ可能
 * - テキスト色自動調整
 * - 削除ボタンオプション
 */

import { ReactNode } from 'react'

interface TagProps {
  children: ReactNode
  color?: string
  variant?: 'default' | 'dark' | 'light'
  size?: 'sm' | 'md'
  onRemove?: () => void
  className?: string
}

export default function Tag({
  children,
  color,
  variant = 'default',
  size = 'sm',
  onRemove,
  className = '',
}: TagProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }
  
  const variantClasses = {
    default: color ? '' : 'bg-gray-100 text-gray-700',
    dark: 'bg-gray-900 text-white',
    light: 'bg-gray-50 text-gray-900',
  }
  
  const customColorStyle = color ? {
    backgroundColor: color,
    color: '#fff',
  } : {}
  
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      style={customColorStyle}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 -mr-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
        >
          <span className="text-current">×</span>
        </button>
      )}
    </span>
  )
}