-- 売上目標テーブルに定性目標カラムを追加
ALTER TABLE sales_targets
ADD COLUMN qualitative_goal TEXT;

-- 売上目標が0の場合でも保存できるように、売上目標を NULLable に変更
ALTER TABLE sales_targets
ALTER COLUMN target_amount DROP NOT NULL;

-- コメント追加
COMMENT ON COLUMN sales_targets.qualitative_goal IS '定性的な目標テキスト';
COMMENT ON COLUMN sales_targets.target_amount IS '売上目標金額（NULLの場合は未設定）';