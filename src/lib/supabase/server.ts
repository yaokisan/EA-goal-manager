/**
 * Supabase サーバー側の設定
 * 
 * 設計参照: technical-requirements.md § 2.2 バックエンド技術スタック
 * 技術仕様: technical-requirements.md § 5.1 React Server Components
 * 
 * 関連ファイル:
 * - client.ts: クライアント側のSupabaseクライアント
 * - middleware.ts: 認証ミドルウェア
 * 
 * 実装要件:
 * - サーバーコンポーネントでのSupabaseクライアント生成
 * - クッキーを使用したセッション管理
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Component内でのcookie設定エラーを無視
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server Component内でのcookie削除エラーを無視
          }
        },
      },
    }
  )
}