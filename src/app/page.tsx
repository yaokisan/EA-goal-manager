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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Goal Focus</h1>
          <p className="text-gray-600">タスク管理アプリケーション</p>
        </div>
        
        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your@example.com"
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
            />
          </div>
          
          <button
            type="submit"
            className="w-full btn-primary"
          >
            ログイン
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            デモ用アカウントでログイン可能
          </p>
        </div>
      </div>
    </div>
  )
}