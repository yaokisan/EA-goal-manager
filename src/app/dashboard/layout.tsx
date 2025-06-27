/**
 * ダッシュボードレイアウトコンポーネント
 * 
 * 設計参照: UI-requirements.md § 2.2 メインナビゲーション
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - Navigation: ヘッダーナビゲーション
 * - 各ダッシュボード配下のページ
 * 
 * 実装要件:
 * - 認証済みユーザー向けのレイアウト
 * - ナビゲーション固定表示
 * - メインコンテンツのパディング調整
 */

import Navigation from '@/components/ui/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Supabase認証実装後、認証チェックを追加
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {/* ナビゲーションの高さ分のパディング */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}