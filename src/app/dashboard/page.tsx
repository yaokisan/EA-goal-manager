/**
 * ダッシュボードページコンポーネント
 * 
 * 設計参照: UI-requirements.md § 3 ダッシュボード機能
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - ProjectTabs: プロジェクトタブ
 * - FocusMode: フォーカスモード
 * - GanttChart: ガントチャート
 * - TaskList: タスクリスト
 * 
 * 実装要件:
 * - プロジェクトタブ切り替え
 * - フォーカスモード表示/非表示
 * - ガントチャートとタスクリストの並列表示
 */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-600">
          プロジェクトとタスクを管理
        </p>
      </div>
      
      {/* プロジェクトタブ（仮実装） */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button className="px-6 py-3 text-sm font-medium text-white bg-red-500 border-b-2 border-red-500">
              📅 直近1週間
            </button>
            <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent">
              すべて
            </button>
            <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent">
              プロジェクトA
            </button>
            <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent">
              プロジェクトB
            </button>
            <div className="ml-auto flex items-center px-4">
              <label className="flex items-center cursor-pointer">
                <span className="mr-2 text-sm text-gray-700">フォーカスモード</span>
                <input type="checkbox" className="sr-only" />
                <div className="relative">
                  <div className="block bg-gray-300 w-10 h-6 rounded-full"></div>
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                </div>
              </label>
            </div>
          </nav>
        </div>
        
        {/* プロジェクトKPI（仮実装） */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex space-x-8 text-sm">
            <div>
              <span className="text-gray-600">今月目標：</span>
              <span className="font-semibold">¥1,000,000</span>
            </div>
            <div>
              <span className="text-gray-600">来月目標：</span>
              <span className="font-semibold">¥1,200,000</span>
            </div>
            <div>
              <span className="text-gray-600">再来月目標：</span>
              <span className="font-semibold">¥1,500,000</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* フォーカスモード表示エリア（仮実装） */}
      <div className="bg-gradient-primary rounded-lg p-6 text-white animate-pulse">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold">フォーカス期限：2024年5月15日</span>
            </div>
            <p className="text-lg">新機能リリースまでにすべてのバグを修正する</p>
          </div>
          <button className="text-white/80 hover:text-white">
            編集
          </button>
        </div>
      </div>
      
      {/* ガントチャートとタスクリスト */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ガントチャート（仮実装） */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">ガントチャート</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <span>📋</span>
                <span className="font-medium">8/12</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📈</span>
                <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">67%</span>
              </div>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-500">
            ガントチャート実装予定
          </div>
        </div>
        
        {/* タスクリスト（仮実装） */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">タスクリスト</h2>
            <div className="flex space-x-2">
              <button className="text-sm text-gray-600 hover:text-gray-900">
                複数選択
              </button>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                + タスク追加
              </button>
            </div>
          </div>
          
          {/* タスクカード例 */}
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-3" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">ログイン機能実装</h3>
                  <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">プロジェクトA</span>
                    <span>📅 4/25〜4/30</span>
                    <span>👤 山田太郎</span>
                  </div>
                </div>
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  📋
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-3" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">データベース設計</h3>
                  <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">プロジェクトB</span>
                    <span>📅 4/20〜4/27</span>
                    <span>👤 鈴木花子</span>
                  </div>
                </div>
                <button className="ml-2 text-gray-400 hover:text-gray-600">
                  📋
                </button>
              </div>
            </div>
          </div>
          
          {/* Doneセクション */}
          <div className="mt-6">
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
              <span className="transform rotate-90">▶</span>
              <span>Done (3)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}