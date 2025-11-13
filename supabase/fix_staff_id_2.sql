-- ID 6の従業員をID 2に修正するSQL
-- 注意: このSQLを実行する前に、ID 2が既に存在するか確認してください

-- 1. 現在の状況を確認（コメントを外して実行）
-- SELECT * FROM staffs WHERE id IN (2, 6);
-- SELECT * FROM staff_daily_results WHERE staff_id IN (2, 6);

-- 2. ID 2が既に存在する場合は、先に削除（必要に応じてコメントを外す）
-- DELETE FROM staffs WHERE id = 2;

-- 3. staff_daily_resultsテーブルのstaff_id = 6をstaff_id = 2に更新
UPDATE staff_daily_results SET staff_id = 2 WHERE staff_id = 6;

-- 4. staffsテーブルのID 6を2に変更
UPDATE staffs SET id = 2 WHERE id = 6;

-- 5. 確認（コメントを外して実行）
-- SELECT * FROM staffs WHERE id = 2;
-- SELECT * FROM staff_daily_results WHERE staff_id = 2;


