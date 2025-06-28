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
import ProjectCard from '@/components/projects/ProjectCard'
import { useProjects } from '@/hooks/useProjects'

'use client'

export default function ProjectsPage() {
  const { projects, loading, error } = useProjects()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

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
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* 空状態 */}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            まだプロジェクトがありません
          </div>
          <Link href="/projects/new">
            <Button>
              最初のプロジェクトを作成
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}