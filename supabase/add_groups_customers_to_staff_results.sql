-- staff_daily_resultsテーブルに組数と人数のカラムを追加
ALTER TABLE staff_daily_results 
ADD COLUMN IF NOT EXISTS groups INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS customers INTEGER DEFAULT 0;


