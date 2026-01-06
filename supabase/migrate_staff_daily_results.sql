-- staff_daily_resultsテーブルに不足しているカラムを追加
-- このマイグレーションは既存のデータベースに対して実行してください

ALTER TABLE staff_daily_results 
ADD COLUMN IF NOT EXISTS groups INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS customers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_memo TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS salary_memo TEXT DEFAULT '';

