import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 環境変数の確認（エラーをthrowせず、警告のみ表示）
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase environment variables')
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'undefined')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'undefined')
  console.error('⚠️ .envファイルをプロジェクトルートに作成し、以下を設定してください:')
  console.error('   VITE_SUPABASE_URL=your_supabase_url')
  console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  console.error('⚠️ 設定後、開発サーバーを再起動してください')
}

// Supabaseクライアントの作成（環境変数が設定されていない場合はダミークライアント）
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

