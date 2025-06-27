/**
 * カードコンポーネント
 * 
 * 設計参照: UI-requirements.md § 5.1 タスク表示（カード形式）
 * 技術仕様: technical-requirements.md § 4.2 共通UIコンポーネント
 * 
 * 関連コンポーネント:
 * - TaskList: タスクカード表示
 * - ProjectCard: プロジェクトカード表示
 * 
 * 実装要件:
 * - 白背景、角丸、影付き
 * - ホバー時の影強調
 * - パディング調整可能
 */

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
}: CardProps) {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200'
  const hoverClasses = hover ? 'hover:shadow-md hover:border-primary-500 transition-all duration-200 cursor-pointer' : ''
  
  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}