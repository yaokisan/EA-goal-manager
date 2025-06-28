/**
 * Supabaseにモックデータを挿入するスクリプト
 * データベースが空の場合に初期データをセットアップするために使用
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// 環境変数を読み込み
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables')
  console.error('SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing')
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing')
  process.exit(1)
}

// Anon keyを使用してSupabaseクライアントを作成（注意：RLSポリシーが適用されます）
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const MOCK_USER_ID = 'mock-user-123'

// モックプロジェクトデータ
const mockProjects = [
  {
    user_id: MOCK_USER_ID,
    name: 'プロジェクトA',
    description: 'Webアプリケーション開発プロジェクト',
    status: 'active',
    color: '#667eea'
  },
  {
    user_id: MOCK_USER_ID,
    name: 'プロジェクトB',
    description: 'モバイルアプリケーション開発',
    status: 'active',
    color: '#ed8936'
  }
]

// モックタスクデータ（project_idは後で実際のUUIDに置き換え）
const mockTasks = [
  {
    user_id: MOCK_USER_ID,
    name: 'UI設計書の作成',
    start_date: '2024-04-25',
    end_date: '2024-04-30',
    status: 'completed',
    assignee: '田中太郎',
    completed_at: '2024-04-30T09:00:00Z'
  },
  {
    user_id: MOCK_USER_ID,
    name: 'データベース設計',
    start_date: '2024-05-01',
    end_date: '2024-05-05',
    status: 'pending',
    assignee: '佐藤花子',
    completed_at: null
  },
  {
    user_id: MOCK_USER_ID,
    name: 'テスト実装',
    start_date: '2024-05-10',
    end_date: '2024-05-15',
    status: 'pending',
    assignee: '田中太郎',
    completed_at: null
  },
  {
    user_id: MOCK_USER_ID,
    name: 'API仕様書作成',
    start_date: '2024-05-01',
    end_date: '2024-05-03',
    status: 'completed',
    assignee: '山田次郎',
    completed_at: '2024-05-03T15:30:00Z'
  },
  {
    user_id: MOCK_USER_ID,
    name: 'フロントエンド開発',
    start_date: '2024-05-05',
    end_date: '2024-05-20',
    status: 'pending',
    assignee: '鈴木三郎',
    completed_at: null
  }
]

async function seedData() {
  try {
    console.log('データベースのシードデータ挿入を開始します...')

    // 既存のデータを確認
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', MOCK_USER_ID)

    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', MOCK_USER_ID)

    if (existingProjects?.length > 0 || existingTasks?.length > 0) {
      console.log('既存のデータが見つかりました。シードデータの挿入をスキップします。')
      return
    }

    // プロジェクトデータを挿入
    console.log('プロジェクトデータを挿入中...')
    const { data: insertedProjects, error: projectError } = await supabase
      .from('projects')
      .insert(mockProjects)
      .select()

    if (projectError) {
      throw new Error(`プロジェクト挿入エラー: ${projectError.message}`)
    }

    // 挿入されたプロジェクトのIDを取得
    const projectA = insertedProjects[0]
    const projectB = insertedProjects[1]

    // タスクデータにproject_idを設定
    const tasksWithProjectIds = [
      { ...mockTasks[0], project_id: projectA.id },  // UI設計書の作成 → プロジェクトA
      { ...mockTasks[1], project_id: projectA.id },  // データベース設計 → プロジェクトA
      { ...mockTasks[2], project_id: projectA.id },  // テスト実装 → プロジェクトA
      { ...mockTasks[3], project_id: projectB.id },  // API仕様書作成 → プロジェクトB
      { ...mockTasks[4], project_id: projectB.id },  // フロントエンド開発 → プロジェクトB
    ]

    // タスクデータを挿入
    console.log('タスクデータを挿入中...')
    const { error: taskError } = await supabase
      .from('tasks')
      .insert(tasksWithProjectIds)

    if (taskError) {
      throw new Error(`タスク挿入エラー: ${taskError.message}`)
    }

    console.log('✅ シードデータの挿入が完了しました！')
    console.log(`- プロジェクト: ${mockProjects.length}件`)
    console.log(`- タスク: ${mockTasks.length}件`)

  } catch (error) {
    console.error('❌ シードデータの挿入に失敗しました:', error.message)
    process.exit(1)
  }
}

// スクリプト実行
seedData()