-- 開発環境用: RLSポリシーを一時的に調整
-- 認証システム実装前の暫定措置として、モックユーザーでのアクセスを許可

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- 開発用の緩いポリシーを作成（認証システム実装までの暫定措置）
-- プロジェクト用ポリシー
CREATE POLICY "Allow access for development" ON projects
  FOR ALL USING (true);

-- タスク用ポリシー  
CREATE POLICY "Allow access for development" ON tasks
  FOR ALL USING (true);

-- 売上目標用ポリシー
CREATE POLICY "Allow access for development" ON sales_targets
  FOR ALL USING (true);

-- フォーカスモード用ポリシー
CREATE POLICY "Allow access for development" ON focus_modes
  FOR ALL USING (true);

-- 注意: 本番環境にデプロイする前に、適切な認証ベースのRLSポリシーに置き換える必要があります