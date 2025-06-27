/**
 * ナビゲーションコンポーネント
 * 
 * 設計参照: UI-requirements.md § 2.2 メインナビゲーション
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - DashboardLayout: ダッシュボードレイアウトで使用
 * - 各ページ: ダッシュボード、プロジェクト、アーカイブ
 * 
 * 実装要件:
 * - ヘッダー固定表示（スクロール時も常に表示）
 * - ナビゲーションボタン：ダッシュボード、プロジェクト設定、アーカイブ、ログアウト
 * - レスポンシブ対応（モバイルでは折り返し）
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Button from './Button'

export default function Navigation() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/dashboard', label: 'ダッシュボード', icon: '📊' },
    { href: '/projects', label: 'プロジェクト設定', icon: '⚙️' },
    { href: '/archive', label: 'アーカイブ', icon: '📦' },
  ]
  
  const isActive = (href: string) => pathname.startsWith(href)
  
  const handleLogout = () => {
    // TODO: Supabase認証実装後に実装
    console.log('ログアウト処理')
  }
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Goal Focus
              </span>
            </Link>
          </div>
          
          {/* ナビゲーションリンク */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${isActive(item.href)
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <span className="hidden sm:inline">{item.icon}</span>
                <span className="ml-1">{item.label}</span>
              </Link>
            ))}
            
            <div className="ml-2 md:ml-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
              >
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}