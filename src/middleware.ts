/**
 * Next.jsミドルウェア
 * 
 * 設計参照: UI-requirements.md § 2.1 ログイン画面
 * 技術仕様: technical-requirements.md § 2.2 バックエンド技術スタック
 * 
 * 関連ファイル:
 * - lib/supabase/middleware.ts: Supabase認証ミドルウェア
 * 
 * 実装要件:
 * - 認証が必要なルートの保護
 * - 未認証ユーザーのリダイレクト
 * - セッションの自動更新
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコンファイル)
     * - 画像、SVG、フォントファイル
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}