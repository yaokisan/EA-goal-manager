-- タスクのassigneeを複数担当者の配列に変更
-- 既存の単一担当者データを配列形式に移行

-- 新しいassigneesカラムを追加（TEXT配列型）
ALTER TABLE tasks ADD COLUMN assignees TEXT[] DEFAULT '{}';

-- 既存のassigneeデータをassigneesに移行
UPDATE tasks 
SET assignees = CASE 
  WHEN assignee IS NOT NULL AND assignee != '' THEN ARRAY[assignee]
  ELSE '{}'
END;

-- 古いassigneeカラムを削除
ALTER TABLE tasks DROP COLUMN assignee;

-- インデックスの追加（配列検索の最適化）
CREATE INDEX idx_tasks_assignees ON tasks USING GIN(assignees);