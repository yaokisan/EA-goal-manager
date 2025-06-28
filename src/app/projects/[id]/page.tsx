/**
 * プロジェクト編集ページコンポーネント
 * 
 * 設計参照: UI-requirements.md § 6.2 プロジェクト編集ページ
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - ProjectEditor: プロジェクト編集フォーム
 * - useProjects: プロジェクト管理フック
 * 
 * 実装要件:
 * - プロジェクト基本情報編集
 * - 月別売上目標設定
 * - メンバー管理
 * - ステータス切り替え
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { Project } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import { getProjectSalesTargets } from '@/lib/mockData'

export default function ProjectEditPage() {
  const params = useParams()
  const router = useRouter()
  const { getProject, updateProject, deleteProject, loading } = useProjects()
  
  const projectId = params.id as string
  const project = getProject(projectId)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    color: '#667eea',
  })
  
  const [members, setMembers] = useState<string[]>([])
  const [newMember, setNewMember] = useState('')
  const [salesTargets, setSalesTargets] = useState<{ [key: string]: number }>({})
  
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        color: project.color,
      })
      
      // モックデータから売上目標を取得
      const targets = getProjectSalesTargets(projectId)
      const targetMap: { [key: string]: number } = {}
      targets.forEach(target => {
        targetMap[target.year_month] = target.target_amount
      })
      setSalesTargets(targetMap)
      
      // モックメンバーデータ
      setMembers(['山田太郎', '鈴木花子', '佐藤次郎'])
    }
  }, [project, projectId])
  
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">プロジェクトが見つかりません</div>
      </div>
    )
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProject(projectId, formData)
      router.push('/projects')
    } catch (error) {
      console.error('プロジェクト更新エラー:', error)
    }
  }
  
  const handleDelete = async () => {
    if (window.confirm('このプロジェクトを削除しますか？関連するタスクもすべて削除されます。')) {
      try {
        await deleteProject(projectId)
        router.push('/projects')
      } catch (error) {
        console.error('プロジェクト削除エラー:', error)
      }
    }
  }
  
  const addMember = () => {
    if (newMember.trim() && !members.includes(newMember.trim())) {
      setMembers([...members, newMember.trim()])
      setNewMember('')
    }
  }
  
  const removeMember = (member: string) => {
    setMembers(members.filter(m => m !== member))
  }
  
  // 直近3ヶ月の年月を生成
  const getRecentMonths = () => {
    const months = []
    const now = new Date()
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.push({
        key: yearMonth,
        label: `${date.getFullYear()}年${date.getMonth() + 1}月`
      })
    }
    return months
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ページヘッダー */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロジェクト編集</h1>
          <p className="mt-1 text-sm text-gray-600">
            プロジェクトの設定を変更できます
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => router.push('/projects')}
          >
            キャンセル
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            削除
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="プロジェクト名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">継続中</option>
                <option value="inactive">停止</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト色
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト概要
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="プロジェクトの概要を入力してください"
            />
          </div>
        </div>
        
        {/* 月別売上目標 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">月別売上目標</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getRecentMonths().map((month) => (
              <div key={month.key} className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {month.label}
                </label>
                <input
                  type="number"
                  value={salesTargets[month.key] || ''}
                  onChange={(e) => setSalesTargets({
                    ...salesTargets,
                    [month.key]: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* メンバー管理 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">メンバー管理</h2>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="メンバー名を入力"
              />
              <Button type="button" onClick={addMember}>
                追加
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <Tag key={member} onRemove={() => removeMember(member)}>
                  {member}
                </Tag>
              ))}
            </div>
          </div>
        </div>
        
        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </div>
  )
}