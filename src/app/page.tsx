/**
 * ログイン/ホームページコンポーネント
 * 
 * 設計参照: UI-requirements.md § 2.1 ログイン画面
 * 技術仕様: technical-requirements.md § 2.2 バックエンド技術スタック
 * 
 * 関連コンポーネント:
 * - Dashboard: ログイン後のメインページ
 * - Supabase Auth: 認証システム
 * 
 * 実装要件:
 * - 紫グラデーション背景（#667eea → #764ba2）
 * - メールアドレス/パスワード入力フォーム
 * - レスポンシブ対応
 */

'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function HomePage() {
  const router = useRouter()
  
  const handleDemoLogin = () => {
    // TODO: Supabase認証実装後、実際の認証処理に置き換える
    // 現在は開発用に直接ダッシュボードへ遷移
    router.push('/dashboard')
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleDemoLogin()
  }
  
  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Goal Focus</h1>
          <p className="text-gray-600">タスク管理アプリケーション</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your@example.com"
              defaultValue="demo@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
              defaultValue="password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full btn-primary"
          >
            ログイン
          </button>
        </form>
        
        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>
          
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleDemoLogin}
          >
            デモアカウントでログイン
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            ※ 認証機能は実装中です。デモボタンでダッシュボードに進めます。
          </p>
        </div>
      </div>
    </div>
  )
}