# Bar Manager

3店舗（TEPPEN・201・202）の売上・経費・給与管理を一元化するWebアプリケーション

## 技術スタック

- **フロントエンド**: React 18 + Vite
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **データベース**: Supabase
- **グラフ表示**: Recharts
- **日付処理**: date-fns

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. プロジェクトの「SQL Editor」で `supabase/schema.sql` を実行してテーブルを作成
3. プロジェクトの「Settings」→「API」から以下を取得：
   - Project URL
   - anon/public key

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下を設定：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 機能

### 日報ページ（実装済み）

- 売上入力（組数、人数、売上金額、クレジット決済、シーシャ台数）
- 給与計算（TEPPEN・201は売上の45%、202は手動入力）
- 経費入力（適用名のサジェスト機能付き）
- 所感入力
- 日報サマリー表示（売上、支出、収支額など）

### 今後の実装予定

- 月報ページ
- 年報ページ
- 個人成績ページ
- 従業員登録ページ

## データベーススキーマ

### stores
店舗情報（TEPPEN、201、202）

### daily_reports
日報データ（売上、給与、経費の合計など）

### expenses
経費データ（日報から登録）

### staffs
従業員情報

### staff_daily_results
従業員の日次実績

## 開発時の注意事項

- 数字入力欄は `inputmode="numeric"` を使用してスマートフォンで数字キーボードを表示
- 日付は当日を自動選択、過去日も編集可能
- 給与の末尾3桁は自動的に切り捨て
- 経費名は入力履歴からサジェスト表示

## ビルド

```bash
npm run build
```

## デプロイ

Vercelへのデプロイを推奨：

```bash
npm install -g vercel
vercel
```


