-- 組数と人数を小数点対応に変更するマイグレーション
-- このSQLをSupabaseのSQLエディタで実行してください

-- daily_reportsテーブルの組数と人数をNUMERIC型に変更
ALTER TABLE daily_reports 
ALTER COLUMN total_groups TYPE NUMERIC(10, 2) USING total_groups::NUMERIC(10, 2),
ALTER COLUMN total_customers TYPE NUMERIC(10, 2) USING total_customers::NUMERIC(10, 2);

-- staff_daily_resultsテーブルの組数と人数をNUMERIC型に変更
ALTER TABLE staff_daily_results 
ALTER COLUMN groups TYPE NUMERIC(10, 2) USING groups::NUMERIC(10, 2),
ALTER COLUMN customers TYPE NUMERIC(10, 2) USING customers::NUMERIC(10, 2);


