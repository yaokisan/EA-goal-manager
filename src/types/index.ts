/**
 * アプリケーション共通型定義
 * 
 * 設計参照: UI-requirements.md 全体のデータ構造
 * 技術仕様: technical-requirements.md § 3.2 TypeScript型定義
 * 
 * 関連ファイル:
 * - database.types.ts: Supabase生成型
 * - 全コンポーネント: 型安全性確保
 * 
 * 実装要件:
 * - Supabaseデータベーススキーマとの整合性
 * - フロントエンド特有の拡張型定義
 */

// プロジェクト関連型
export interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'inactive'
  color: string
  user_id: string
  members: string[] // メンバー名の配列
  target_start_month?: string // 目標期間開始月 "2025-06"
  target_end_month?: string // 目標期間終了月 "2025-12"
  created_at: string
  updated_at: string
  // フロントエンド拡張
  tasks?: Task[]
  salesTargets?: SalesTarget[]
}

// タスク関連型
export interface Task {
  id: string
  name: string
  project_id: string
  assignee: string | null
  start_date: string
  end_date: string
  status: 'pending' | 'completed'
  completed_at: string | null
  user_id: string
  created_at: string
  updated_at: string
  // フロントエンド拡張
  project?: Project
}

// 売上目標型
export interface SalesTarget {
  id: string
  project_id: string
  year_month: string // "2024-01"
  target_amount: number
  user_id: string
  created_at: string
  updated_at: string
}

// フォーカスモード型
export interface FocusMode {
  id: string
  user_id: string
  project_id: string | null
  deadline: string | null
  goal: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // フロントエンド拡張
  project?: Project
}

// UI状態管理型
export interface UIState {
  activeTab: string
  selectedTasks: string[]
  isMultiSelectMode: boolean
  currentView: 'dashboard' | 'projects' | 'archive'
}

// フォーカス統計型
export interface FocusStats {
  completedTasks: number
  totalTasks: number
  progressPercentage: number
}

// ガントチャート関連型
export interface GanttTask {
  id: string
  name: string
  startDate: Date
  endDate: Date
  projectColor: string
  status: 'pending' | 'completed'
  position: {
    x: number
    width: number
  }
}

// プロジェクト色定義
export const PROJECT_COLORS = {
  A: '#667eea',
  B: '#ed8936',
  C: '#48bb78',
  D: '#9f7aea',
  E: '#38b2ac',
} as const

// タブ定義
export type TabType = 'recent' | 'all' | string // string は プロジェクトID