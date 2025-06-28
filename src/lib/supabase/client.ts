/**
 * Supabase クライアント側の設定
 * 
 * 設計参照: technical-requirements.md § 2.2 バックエンド技術スタック
 * 技術仕様: technical-requirements.md § 5.2 カスタムフック設計
 * 
 * 関連ファイル:
 * - server.ts: サーバー側のSupabaseクライアント
 * - middleware.ts: 認証ミドルウェア
 * 
 * 実装要件:
 * - ブラウザ環境でのSupabaseクライアント生成
 * - シングルトンパターンでインスタンス管理
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}