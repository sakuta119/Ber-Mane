-- 既存のテーブルを削除（依存関係の逆順で削除）
DROP TABLE IF EXISTS staff_daily_results CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS staffs CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- 店舗テーブルの作成
CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 店舗データの初期投入
INSERT INTO stores (id, name) VALUES
  ('TEPPEN', 'TEPPEN'),
  ('201', '201'),
  ('202', '202')
ON CONFLICT (id) DO NOTHING;

-- 従業員テーブルの作成
CREATE TABLE staffs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  store_ids TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  position TEXT,
  hourly_wage INTEGER,
  employment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 日報テーブルの作成
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(id),
  total_sales_amount INTEGER DEFAULT 0,
  credit_amount INTEGER DEFAULT 0,
  total_groups INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  total_shisha INTEGER DEFAULT 0,
  total_salary_amount INTEGER DEFAULT 0,
  total_expense_amount INTEGER DEFAULT 0,
  memo TEXT,
  opinion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, store_id)
);

-- 従業員日次実績テーブルの作成
CREATE TABLE staff_daily_results (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staffs(id),
  store_id TEXT NOT NULL REFERENCES stores(id),
  date DATE NOT NULL,
  sales_amount INTEGER DEFAULT 0,
  credit_amount INTEGER DEFAULT 0,
  shisha_count INTEGER DEFAULT 0,
  base_salary INTEGER DEFAULT 0,
  champagne_deduction INTEGER DEFAULT 0,
  paid_salary INTEGER DEFAULT 0,
  fraction_cut INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, store_id, date)
);

-- 経費テーブルの作成
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 月次固定費テーブルの作成
CREATE TABLE monthly_fixed_expenses (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(id),
  rent INTEGER DEFAULT 0,
  karaoke INTEGER DEFAULT 0,
  wifi INTEGER DEFAULT 0,
  oshibori INTEGER DEFAULT 0,
  pest_control INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month, store_id)
);

-- 月次追加経費テーブルの作成
CREATE TABLE monthly_manual_expenses (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 月次スタッフメモテーブルの作成
CREATE TABLE IF NOT EXISTS monthly_staff_memos (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  store_id TEXT NOT NULL,
  staff_id INTEGER NOT NULL REFERENCES staffs(id),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month, store_id, staff_id)
);

-- 月次所感テーブルの作成
CREATE TABLE IF NOT EXISTS monthly_opinions (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  store_id TEXT NOT NULL,
  opinion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month, store_id)
);

-- 年次固定費テーブルの作成
CREATE TABLE IF NOT EXISTS yearly_fixed_expenses (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(id),
  rent INTEGER DEFAULT 0,
  karaoke INTEGER DEFAULT 0,
  wifi INTEGER DEFAULT 0,
  oshibori INTEGER DEFAULT 0,
  pest_control INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, store_id)
);

-- 年次追加経費テーブルの作成
CREATE TABLE IF NOT EXISTS yearly_manual_expenses (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 年次スタッフメモテーブルの作成
CREATE TABLE IF NOT EXISTS yearly_staff_memos (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  store_id TEXT NOT NULL,
  staff_id INTEGER NOT NULL REFERENCES staffs(id),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, store_id, staff_id)
);

-- 年次所感テーブルの作成
CREATE TABLE IF NOT EXISTS yearly_opinions (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  store_id TEXT NOT NULL,
  opinion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, store_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_store_id ON daily_reports(store_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_store_id ON expenses(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_daily_results_date ON staff_daily_results(date);
CREATE INDEX IF NOT EXISTS idx_staff_daily_results_staff_id ON staff_daily_results(staff_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fixed_expenses_period ON monthly_fixed_expenses(year, month, store_id);
CREATE INDEX IF NOT EXISTS idx_monthly_manual_expenses_period ON monthly_manual_expenses(year, month, store_id);
CREATE INDEX IF NOT EXISTS idx_monthly_staff_memos_period ON monthly_staff_memos(year, month, store_id);
CREATE INDEX IF NOT EXISTS idx_monthly_opinions_period ON monthly_opinions(year, month, store_id);
CREATE INDEX IF NOT EXISTS idx_yearly_fixed_expenses_period ON yearly_fixed_expenses(year, store_id);
CREATE INDEX IF NOT EXISTS idx_yearly_manual_expenses_period ON yearly_manual_expenses(year, store_id);
CREATE INDEX IF NOT EXISTS idx_yearly_staff_memos_period ON yearly_staff_memos(year, store_id);
CREATE INDEX IF NOT EXISTS idx_yearly_opinions_period ON yearly_opinions(year, store_id);

-- RLS (Row Level Security) の有効化
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_daily_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_manual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_staff_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_manual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_staff_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_opinions ENABLE ROW LEVEL SECURITY;

-- 全テーブルに対して全ユーザーが読み書き可能なポリシー（開発用）
-- 本番環境では適切な認証ポリシーを設定してください
-- 既存のポリシーを削除してから作成
DROP POLICY IF EXISTS "Allow all operations on stores" ON stores;
CREATE POLICY "Allow all operations on stores" ON stores
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on staffs" ON staffs;
CREATE POLICY "Allow all operations on staffs" ON staffs
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on daily_reports" ON daily_reports;
CREATE POLICY "Allow all operations on daily_reports" ON daily_reports
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on staff_daily_results" ON staff_daily_results;
CREATE POLICY "Allow all operations on staff_daily_results" ON staff_daily_results
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on expenses" ON expenses;
CREATE POLICY "Allow all operations on expenses" ON expenses
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on monthly_fixed_expenses" ON monthly_fixed_expenses;
CREATE POLICY "Allow all operations on monthly_fixed_expenses" ON monthly_fixed_expenses
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on monthly_manual_expenses" ON monthly_manual_expenses;
CREATE POLICY "Allow all operations on monthly_manual_expenses" ON monthly_manual_expenses
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on monthly_staff_memos" ON monthly_staff_memos;
CREATE POLICY "Allow all operations on monthly_staff_memos" ON monthly_staff_memos
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on monthly_opinions" ON monthly_opinions;
CREATE POLICY "Allow all operations on monthly_opinions" ON monthly_opinions
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on yearly_fixed_expenses" ON yearly_fixed_expenses;
CREATE POLICY "Allow all operations on yearly_fixed_expenses" ON yearly_fixed_expenses
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on yearly_manual_expenses" ON yearly_manual_expenses;
CREATE POLICY "Allow all operations on yearly_manual_expenses" ON yearly_manual_expenses
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on yearly_staff_memos" ON yearly_staff_memos;
CREATE POLICY "Allow all operations on yearly_staff_memos" ON yearly_staff_memos
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on yearly_opinions" ON yearly_opinions;
CREATE POLICY "Allow all operations on yearly_opinions" ON yearly_opinions
  FOR ALL USING (true) WITH CHECK (true);

