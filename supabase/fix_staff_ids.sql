-- 現在の状況を確認
-- SELECT * FROM staffs WHERE id IN (2, 6);
-- SELECT * FROM staff_daily_results WHERE staff_id IN (2, 6);

-- まず、staff_daily_resultsテーブルのstaff_id = 6をstaff_id = 2に更新
UPDATE staff_daily_results SET staff_id = 2 WHERE staff_id = 6;

-- 次に、staffsテーブルのID 6を2に変更
-- 注意: ID 2が既に存在する場合は、先にID 2のデータを削除または統合してください
-- ID 2が存在する場合は、以下のコマンドを実行してください:
-- DELETE FROM staffs WHERE id = 2;
UPDATE staffs SET id = 2 WHERE id = 6;

-- ID 3～5の従業員データを削除（ID 6は既に2に変更されているので除外）
DELETE FROM staffs WHERE id IN (3, 4, 5);

-- シーケンスをリセット（次のIDが3から始まるように）
SELECT setval('staffs_id_seq', (SELECT MAX(id) FROM staffs));

