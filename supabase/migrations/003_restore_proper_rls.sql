-- 適切なRLSポリシーに戻す（auth.uid()ベース）
-- Google認証実装後の最終設定

-- 開発用の緩いポリシーを削除
DROP POLICY IF EXISTS "Allow access for development" ON projects;
DROP POLICY IF EXISTS "Allow access for development" ON tasks;
DROP POLICY IF EXISTS "Allow access for development" ON sales_targets;
DROP POLICY IF EXISTS "Allow access for development" ON focus_modes;

-- 適切なauth.uid()ベースのRLSポリシーを再作成
-- プロジェクト用ポリシー
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- タスク用ポリシー
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 売上目標用ポリシー
CREATE POLICY "Users can view own sales targets" ON sales_targets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales targets" ON sales_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales targets" ON sales_targets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales targets" ON sales_targets
  FOR DELETE USING (auth.uid() = user_id);

-- フォーカスモード用ポリシー
CREATE POLICY "Users can view own focus modes" ON focus_modes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus modes" ON focus_modes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus modes" ON focus_modes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus modes" ON focus_modes
  FOR DELETE USING (auth.uid() = user_id);