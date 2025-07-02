-- タスクテーブルにアーカイブフラグを追加
ALTER TABLE tasks
ADD COLUMN is_archived BOOLEAN DEFAULT false,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- アーカイブインデックスを追加（パフォーマンス向上のため）
CREATE INDEX idx_tasks_is_archived ON tasks(is_archived);
CREATE INDEX idx_tasks_archived_at ON tasks(archived_at);

-- コメント追加
COMMENT ON COLUMN tasks.is_archived IS 'タスクがアーカイブされているかどうか';
COMMENT ON COLUMN tasks.archived_at IS 'タスクがアーカイブされた日時';