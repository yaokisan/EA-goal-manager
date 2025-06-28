/**
 * Supabase認証ミドルウェア
 * 
 * 設計参照: technical-requirements.md § 2.2 バックエンド技術スタック
 * 技術仕様: technical-requirements.md § 9 セキュリティ考慮事項
 * 
 * 関連ファイル:
 * - client.ts: クライアント側のSupabaseクライアント
 * - server.ts: サーバー側のSupabaseクライアント
 * - middleware.ts (Next.js): アプリケーションミドルウェア
 * 
 * 実装要件:
 * - セッションの更新と維持
 * - 認証状態の確認
 * - 保護されたルートへのアクセス制御
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}