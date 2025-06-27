/**
 * アーカイブレイアウトコンポーネント
 * 
 * 設計参照: UI-requirements.md § 7 アーカイブ機能
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - Navigation: ヘッダーナビゲーション
 * - アーカイブページ
 * 
 * 実装要件:
 * - 認証済みユーザー向けのレイアウト
 * - ダッシュボードレイアウトと同じ構造
 */

import Navigation from '@/components/ui/Navigation'

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}