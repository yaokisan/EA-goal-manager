-- プロジェクトテーブルに目標期間フィールドを追加

ALTER TABLE projects 
ADD COLUMN target_start_month VARCHAR(7), -- "2025-06" 形式
ADD COLUMN target_end_month VARCHAR(7);   -- "2025-12" 形式

-- インデックスを追加（期間検索の最適化）
CREATE INDEX idx_projects_target_period ON projects(target_start_month, target_end_month);