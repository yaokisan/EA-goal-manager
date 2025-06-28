-- Supabase初期スキーマ
-- 設計参照: technical-requirements.md § 3.1 テーブル構造

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- プロジェクトテーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  color VARCHAR(7) DEFAULT '#667eea',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- タスクテーブル
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 売上目標テーブル
CREATE TABLE sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  target_amount INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, year_month)
);

-- フォーカスモードテーブル
CREATE TABLE focus_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  deadline DATE,
  goal TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_sales_targets_project_id ON sales_targets(project_id);
CREATE INDEX idx_focus_modes_user_id ON focus_modes(user_id);

-- RLS (Row Level Security) の有効化
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_modes ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
-- プロジェクト: ユーザーは自分のプロジェクトのみアクセス可能
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- タスク: ユーザーは自分のタスクのみアクセス可能
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 売上目標: ユーザーは自分の売上目標のみアクセス可能
CREATE POLICY "Users can view own sales targets" ON sales_targets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales targets" ON sales_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales targets" ON sales_targets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales targets" ON sales_targets
  FOR DELETE USING (auth.uid() = user_id);

-- フォーカスモード: ユーザーは自分の設定のみアクセス可能
CREATE POLICY "Users can view own focus modes" ON focus_modes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus modes" ON focus_modes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus modes" ON focus_modes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus modes" ON focus_modes
  FOR DELETE USING (auth.uid() = user_id);

-- 更新時刻自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sales_targets_updated_at BEFORE UPDATE ON sales_targets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_focus_modes_updated_at BEFORE UPDATE ON focus_modes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();