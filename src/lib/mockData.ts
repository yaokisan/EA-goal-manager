/**
 * モックデータ
 * 
 * 設計参照: UI-requirements.md 全体のデータ構造
 * 技術仕様: technical-requirements.md § 3.1 テーブル構造
 * 
 * 関連ファイル:
 * - types/index.ts: 型定義
 * 
 * 実装要件:
 * - 認証機能実装前の開発用データ
 * - 実際のSupabaseデータ構造に合わせた形式
 * - UI要件に沿ったサンプルデータ
 */

import { Project, Task, SalesTarget, FocusMode } from '@/types'

// 固定ユーザーID（認証実装前の仮ID）
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'

// モックプロジェクトデータ
export const mockProjects: Project[] = [
  {
    id: 'project-a',
    name: 'プロジェクトA',
    description: 'ECサイトリニューアルプロジェクト。UIの改善とパフォーマンス向上を目指す。',
    status: 'active',
    color: '#667eea',
    user_id: MOCK_USER_ID,
    members: ['山田太郎', '佐藤次郎', '高橋健太'],
    target_start_month: '2024-04',
    target_end_month: '2024-06',
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-15T00:00:00Z',
  },
  {
    id: 'project-b',
    name: 'プロジェクトB',
    description: '新規サービス開発。モバイルアプリとWeb版の同時リリース。',
    status: 'active',
    color: '#ed8936',
    user_id: MOCK_USER_ID,
    members: ['鈴木花子', '田中美咲', '渡辺聡'],
    target_start_month: '2024-03',
    target_end_month: '2024-05',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-04-10T00:00:00Z',
  },
  {
    id: 'project-c',
    name: 'プロジェクトC',
    description: '内部ツール改善プロジェクト',
    status: 'inactive',
    color: '#48bb78',
    user_id: MOCK_USER_ID,
    members: [],
    target_start_month: '2024-02',
    target_end_month: '2024-03',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
]

// モックタスクデータ
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    name: 'ログイン機能実装',
    project_id: 'project-a',
    assignees: ['山田太郎'],
    start_date: '2024-04-25',
    end_date: '2024-04-30',
    status: 'completed',
    completed_at: '2024-04-29T10:00:00Z',
    user_id: MOCK_USER_ID,
    order_index: 1,
    created_at: '2024-04-20T00:00:00Z',
    updated_at: '2024-04-29T10:00:00Z',
  },
  {
    id: 'task-2',
    name: 'データベース設計',
    project_id: 'project-b',
    assignees: ['鈴木花子'],
    start_date: '2024-04-20',
    end_date: '2024-04-27',
    status: 'completed',
    completed_at: '2024-04-26T16:30:00Z',
    user_id: MOCK_USER_ID,
    order_index: 2,
    created_at: '2024-04-18T00:00:00Z',
    updated_at: '2024-04-26T16:30:00Z',
  },
  {
    id: 'task-3',
    name: 'UI/UXデザイン作成',
    project_id: 'project-a',
    assignees: ['佐藤次郎'],
    start_date: '2024-04-28',
    end_date: '2024-05-05',
    status: 'pending',
    completed_at: null,
    user_id: MOCK_USER_ID,
    order_index: 3,
    created_at: '2024-04-25T00:00:00Z',
    updated_at: '2024-04-25T00:00:00Z',
  },
  {
    id: 'task-4',
    name: 'API開発',
    project_id: 'project-b',
    assignees: ['田中美咲'],
    start_date: '2024-05-01',
    end_date: '2024-05-10',
    status: 'pending',
    completed_at: null,
    user_id: MOCK_USER_ID,
    order_index: 4,
    created_at: '2024-04-28T00:00:00Z',
    updated_at: '2024-04-28T00:00:00Z',
  },
  {
    id: 'task-5',
    name: 'セキュリティ監査',
    project_id: 'project-a',
    assignees: ['高橋健太'],
    start_date: '2024-05-03',
    end_date: '2024-05-07',
    status: 'pending',
    completed_at: null,
    user_id: MOCK_USER_ID,
    order_index: 5,
    created_at: '2024-04-30T00:00:00Z',
    updated_at: '2024-04-30T00:00:00Z',
  },
  {
    id: 'task-6',
    name: 'テスト実装',
    project_id: 'project-b',
    assignees: ['渡辺聡'],
    start_date: '2024-05-08',
    end_date: '2024-05-15',
    status: 'pending',
    completed_at: null,
    user_id: MOCK_USER_ID,
    order_index: 6,
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2024-05-01T00:00:00Z',
  },
  {
    id: 'task-7',
    name: '複数担当者テストタスク',
    project_id: 'project-a',
    assignees: ['山田太郎', '佐藤次郎', '高橋健太'],
    start_date: '2024-05-10',
    end_date: '2024-05-20',
    status: 'pending',
    completed_at: null,
    user_id: MOCK_USER_ID,
    order_index: 7,
    created_at: '2024-05-08T00:00:00Z',
    updated_at: '2024-05-08T00:00:00Z',
  },
]

// モック売上目標データ
export const mockSalesTargets: SalesTarget[] = [
  {
    id: 'target-1',
    project_id: 'project-a',
    year_month: '2024-04',
    target_amount: 1000000,
    user_id: MOCK_USER_ID,
    created_at: '2024-03-25T00:00:00Z',
    updated_at: '2024-03-25T00:00:00Z',
  },
  {
    id: 'target-2',
    project_id: 'project-a',
    year_month: '2024-05',
    target_amount: 1200000,
    user_id: MOCK_USER_ID,
    created_at: '2024-03-25T00:00:00Z',
    updated_at: '2024-03-25T00:00:00Z',
  },
  {
    id: 'target-3',
    project_id: 'project-a',
    year_month: '2024-06',
    target_amount: 1500000,
    user_id: MOCK_USER_ID,
    created_at: '2024-03-25T00:00:00Z',
    updated_at: '2024-03-25T00:00:00Z',
  },
  {
    id: 'target-4',
    project_id: 'project-b',
    year_month: '2024-04',
    target_amount: 800000,
    user_id: MOCK_USER_ID,
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
  },
  {
    id: 'target-5',
    project_id: 'project-b',
    year_month: '2024-05',
    target_amount: 900000,
    user_id: MOCK_USER_ID,
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
  },
]

// モックフォーカスモードデータ
export const mockFocusMode: FocusMode = {
  id: 'focus-1',
  user_id: MOCK_USER_ID,
  project_id: 'project-a',
  deadline: '2024-05-15',
  goal: '新機能リリースまでにすべてのバグを修正する',
  is_active: true,
  created_at: '2024-04-30T00:00:00Z',
  updated_at: '2024-04-30T00:00:00Z',
}

// ヘルパー関数
export function getProjectTasks(projectId: string): Task[] {
  return mockTasks.filter(task => task.project_id === projectId)
}

export function getCompletedTasks(projectId?: string): Task[] {
  const tasks = projectId ? getProjectTasks(projectId) : mockTasks
  return tasks.filter(task => task.status === 'completed')
}

export function getPendingTasks(projectId?: string): Task[] {
  const tasks = projectId ? getProjectTasks(projectId) : mockTasks
  return tasks.filter(task => task.status === 'pending')
}

export function getRecentTasks(): Task[] {
  const oneWeekFromNow = new Date()
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
  
  return mockTasks.filter(task => {
    const endDate = new Date(task.end_date)
    return endDate <= oneWeekFromNow && task.status === 'pending'
  })
}

export function getProjectSalesTargets(projectId: string): SalesTarget[] {
  return mockSalesTargets.filter(target => target.project_id === projectId)
}