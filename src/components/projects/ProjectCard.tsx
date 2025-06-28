/**
 * プロジェクトカードコンポーネント
 * 
 * 設計参照: UI-requirements.md § 6.1 プロジェクト一覧
 * 技術仕様: technical-requirements.md § 4.2 共通UIコンポーネント
 * 
 * 関連コンポーネント:
 * - ProjectEditor: プロジェクト編集ページ
 * - Card: 基本カードコンポーネント
 * 
 * 実装要件:
 * - カード形式でプロジェクト表示
 * - カードクリックで編集ページへ遷移
 * - ホバー時に枠線色変更 + 影追加
 * - プロジェクト進捗表示
 */

import Link from 'next/link'
import { Project } from '@/types'
import { getProjectTasks, getCompletedTasks } from '@/lib/mockData'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const allTasks = getProjectTasks(project.id)
  const completedTasks = getCompletedTasks(project.id)
  const progressPercentage = allTasks.length > 0 
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : 0

  return (
    <Link href={`/projects/${project.id}`} className="block">
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
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
          {project.description}
        </p>
        
        {/* タスク進捗 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">タスク進捗</span>
            <span className="font-medium">
              {completedTasks.length}/{allTasks.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">{progressPercentage}% 完了</span>
          </div>
        </div>
        
        {/* 更新日時 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            最終更新: {new Date(project.updated_at).toLocaleDateString('ja-JP')}
          </span>
        </div>
      </div>
    </Link>
  )
}