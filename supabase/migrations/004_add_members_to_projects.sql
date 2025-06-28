-- プロジェクトテーブルにメンバー管理機能を追加

-- メンバー情報をJSONB配列として保存するカラムを追加
ALTER TABLE projects 
ADD COLUMN members JSONB DEFAULT '[]'::jsonb;

-- メンバー検索用のGINインデックスを追加
CREATE INDEX idx_projects_members ON projects USING gin(members);

-- 既存のプロジェクトに空の配列を設定（必要に応じて）
UPDATE projects SET members = '[]'::jsonb WHERE members IS NULL;