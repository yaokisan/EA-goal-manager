-- リアルタイム機能を有効化するマイグレーション

-- tasksテーブルでリアルタイム機能を有効化
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- projectsテーブルでリアルタイム機能を有効化
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- sales_targetsテーブルでリアルタイム機能を有効化（将来的に使用）
ALTER TABLE sales_targets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE sales_targets;

-- focus_modesテーブルでリアルタイム機能を有効化（将来的に使用）
ALTER TABLE focus_modes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE focus_modes;