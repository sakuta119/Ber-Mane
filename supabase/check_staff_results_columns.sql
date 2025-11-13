-- staff_daily_resultsテーブルのカラムを確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'staff_daily_results'
ORDER BY ordinal_position;

-- 既存データの確認（groupsとcustomersカラムが存在する場合）
SELECT id, staff_id, groups, customers, sales_amount
FROM staff_daily_results
LIMIT 5;


