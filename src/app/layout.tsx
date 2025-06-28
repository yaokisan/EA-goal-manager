/**
 * ルートレイアウトコンポーネント
 * 
 * 設計参照: UI-requirements.md § 2.2 メインナビゲーション
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - Navigation: ヘッダーナビゲーション
 * - 各ページコンポーネント: ダッシュボード、プロジェクト、アーカイブ
 * 
 * 実装要件:
 * - レスポンシブ対応（PC/モバイル）
 * - 紫グラデーションテーマの適用
 * - Supabase認証との統合準備
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Focus Goal - タスク管理アプリケーション',
  description: 'プロジェクト別タスク管理、ガントチャート、フォーカスモード機能を備えたタスク管理アプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}