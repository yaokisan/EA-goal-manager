-- Focus Modesテーブルのスキーマ修正
-- project_id制約を修正し、NULLを許可

-- 既存の外部キー制約を削除
ALTER TABLE focus_modes DROP CONSTRAINT IF EXISTS focus_modes_project_id_fkey;

-- project_idをNULL許可で外部キー制約を再追加
ALTER TABLE focus_modes 
ADD CONSTRAINT focus_modes_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- デフォルト値でサンプルデータを挿入
INSERT INTO focus_modes (user_id, goal, deadline, project_id, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid as user_id,
  '新機能リリースまでにすべてのバグを修正する' as goal,
  (CURRENT_DATE + INTERVAL '14 days')::date as deadline,
  NULL as project_id,
  true as is_active
WHERE NOT EXISTS (
  SELECT 1 FROM focus_modes 
  WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
    AND is_active = true
);