-- staff_daily_resultsテーブルに売上備考と給与備考のカラムを追加
ALTER TABLE staff_daily_results 
ADD COLUMN IF NOT EXISTS sales_memo TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS salary_memo TEXT DEFAULT '';


