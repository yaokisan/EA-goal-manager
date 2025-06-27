/**
 * プロジェクト一覧ページコンポーネント
 * 
 * 設計参照: UI-requirements.md § 6.1 プロジェクト一覧
 * 技術仕様: technical-requirements.md § 5 状態管理・データフェッチング
 * 
 * 関連コンポーネント:
 * - ProjectCard: プロジェクトカード表示
 * - ProjectEditor: プロジェクト編集ページ
 * 
 * 実装要件:
 * - カード形式でプロジェクト表示
 * - カードクリックで編集ページへ遷移
 * - ホバー時に枠線色変更 + 影追加
 * - プロジェクト追加ボタン
 */

import Link from 'next/link'
import Button from '@/components/ui/Button'

// 仮のプロジェクトデータ
const mockProjects = [
  {
    id: '1',
    name: 'プロジェクトA',
    description: 'ECサイトリニューアルプロジェクト',
    status: 'active' as const,
    color: '#667eea',
    taskCount: 12,
    completedTaskCount: 8,
  },
  {
    id: '2',
    name: 'プロジェクトB',
    description: '新規サービス開発',
    status: 'active' as const,
    color: '#ed8936',
    taskCount: 8,
    completedTaskCount: 3,
  },
]

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロジェクト設定</h1>
          <p className="mt-1 text-sm text-gray-600">
            プロジェクトの管理と設定
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            + プロジェクト追加
          </Button>
        </Link>
      </div>
      
      {/* プロジェクトグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-primary-500 hover:shadow-md transition-all duration-200 cursor-pointer">
              {/* プロジェクトヘッダー */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-3 h-3 rounded-full mt-1"
                  style={{ backgroundColor: project.color }}
                />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  project.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {project.status === 'active' ? '継続中' : '停止'}
                </span>
              </div>
              
              {/* プロジェクト情報 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description}
              </p>
              
              {/* タスク進捗 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">タスク進捗</span>
                  <span className="font-medium">
                    {project.completedTaskCount}/{project.taskCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(project.completedTaskCount / project.taskCount) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}