# 入力項目のデータフロー検証

日報で入力される項目が月報・年報・個人成績で正しく反映されるか検証した結果です。

## 1. 日報で入力される項目と保存先

| 項目 | 保存先 | 備考 |
|------|--------|------|
| 組数 (groups) | staff_daily_results.groups, daily_reports.total_groups | 全スタッフ合計で daily_reports に |
| 人数 (customers) | staff_daily_results.customers, daily_reports.total_customers | 同上 |
| 売上金額 (salesAmount) | staff_daily_results.sales_amount, daily_reports.total_sales_amount | 同上 |
| 内クレカ決済 (creditAmount) | staff_daily_results.credit_amount, daily_reports.credit_amount | 同上 |
| シーシャ販売数 (shishaCount) | staff_daily_results.shisha_count, daily_reports.total_shisha | 同上 |
| 給与額 (baseSalary) | staff_daily_results.base_salary, daily_reports.total_salary_amount | 同上 |
| シャンパン天引額 | staff_daily_results.champagne_deduction | 日別内訳で表示、集計には base_salary を使用 |
| 経費 (name, amount, note) | expenses テーブル | 日付×店舗ごと |
| 所感 (opinion) | daily_reports.opinion | 日付×店舗で1件 |
| 備考 (memo) | staff_daily_results.sales_memo, salary_memo, daily_reports.memo | スタッフごと。daily_reports.memo は最終保存スタッフ分 |

## 2. 月報・年報での参照元

| 項目 | データソース | 備考 |
|------|--------------|------|
| 売上・組数・人数・シーシャ・給与・クレカ | **staff_daily_results** (resolvedReports で優先) | daily_reports はフォールバック。staff が正とする |
| 経費 | **expenses** テーブル (expenseTotalsByReport) | daily_reports.total_expense_amount は使わない |
| 所感 | daily_reports.opinion | 日別内訳の「所感」列 |
| 収支 | 売上 - (経費 + 給与) | 上記の値から計算 |

## 3. 項目別の整合性

### ✅ 組数・人数・売上・クレカ・シーシャ・給与
- **日報**: staff_daily_results に保存、daily_reports に合計を保存
- **月報・年報**: resolvedReports で staff_daily_results の集計 (dailyStaffSummaries) を優先
- **個人成績**: staff_daily_results を直接参照
- **整合性**: あり（同一ソース staff_daily_results）

### ✅ 経費
- **日報**: expenses テーブルに保存
- **月報・年報**: expenses テーブル → expenseTotalsByReport で集計。daily_reports は参照しない
- **整合性**: あり（expenses テーブルが唯一のソース）
- **補完**: 経費のみの日（daily_reports なし）も mergeReportsWithStaffSummaries で synthetic として追加済み

### ✅ 所感 (opinion)
- **日報**: daily_reports.opinion に保存
- **月報・年報**: report.opinion として日別内訳に表示
- **整合性**: あり（daily_reports 経由）

### ✅ シャンパン天引・差引支給額
- **日報**: staff_daily_results に保存
- **月報・年報**: 日別内訳で dayStaffSummary.champagne_deduction, paid_salary を表示
- **整合性**: あり（staff_daily_results 経由）

### ⚠️ 備考 (memo)
- **日報の備考**: staff_daily_results.sales_memo, salary_memo（スタッフごと）
- **月報・年報のスタッフメモ**: monthly_staff_memos, yearly_staff_memos（別テーブル、別入力）
- **仕様**: 日報のスタッフ備考と月報・年報のスタッフメモは**別物**。日報の備考は日報のスタッフ実績テーブルで表示。月報のスタッフメモは月報ページで入力。

## 4. 日付×店舗の補完ロジック

月報・年報で「その日には daily_reports がない」場合の補完:

1. **スタッフ実績あり**: dailyStaffSummaries から synthetic を追加（売上・給与など）
2. **経費のみ**: expenseTotalsByReport から synthetic を追加（経費のみの日）
3. **所感のみ**: daily_reports に記録されるため、filteredReports に含まれる

## 5. 固定費・月次追加経費

- **月報で入力**: monthly_fixed_expenses, monthly_manual_expenses
- **年報で表示**: 同上を年度で集計
- **日報とは別**: 日報の経費（expenses）とは別の経費項目

## 6. 結論

日報で入力した数値・経費・所感は、すべて月報・年報で一貫したソースから参照され、整合しています。経費のみの日も synthetic によりサマリー・カレンダーに反映されます。
