/**
 * プロジェクト新規作成ページコンポーネント
 * 
 * 設計参照: UI-requirements.md § 6.3 プロジェクト新規作成
 * 技術仕様: technical-requirements.md § 4.1 ページ構成
 * 
 * 関連コンポーネント:
 * - useProjects: プロジェクト管理フック
 * - Input: 入力コンポーネント
 * 
 * 実装要件:
 * - プロジェクト新規作成フォーム
 * - 編集ページと同じフォーム構成
 * - バリデーション機能
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjects } from '@/hooks/useProjects'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject, loading } = useProjects()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    color: '#667eea',
    target_start_month: '',
    target_end_month: '',
  })
  
  const [members, setMembers] = useState<string[]>([])
  const [newMember, setNewMember] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'プロジェクト名は必須です'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      // メンバー情報も含めて作成
      await createProject({
        ...formData,
        members
      })
      router.push('/projects')
    } catch (error) {
      console.error('プロジェクト作成エラー:', error)
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
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ページヘッダー */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新規プロジェクト作成</h1>
          <p className="mt-1 text-sm text-gray-600">
            新しいプロジェクトを作成します
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push('/projects')}
        >
          キャンセル
        </Button>
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
              error={errors.name}
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
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <span className="text-sm text-gray-600">{formData.color}</span>
              </div>
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
              placeholder="プロジェクトの概要を入力してください（任意）"
            />
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
            
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <Tag key={member} onRemove={() => removeMember(member)}>
                    {member}
                  </Tag>
                ))}
              </div>
            )}
            
            {members.length === 0 && (
              <p className="text-sm text-gray-500">
                メンバーが追加されていません。後から追加することも可能です。
              </p>
            )}
          </div>
        </div>
        
        {/* 作成ボタン */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/projects')}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '作成中...' : 'プロジェクト作成'}
          </Button>
        </div>
      </form>
    </div>
  )
}