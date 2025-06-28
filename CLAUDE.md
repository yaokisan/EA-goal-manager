# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリでコードを操作する際のガイダンスを提供します。

## プロジェクト概要

Focus Goal は、プロジェクト管理、ガントチャート可視化、フォーカスモード機能、月別売上目標管理を統合したタスク管理アプリケーションです。PC・モバイル対応のレスポンシブWebアプリケーションとして設計されています。

## アーキテクチャ

**技術スタック:**
- フロントエンド: Next.js 14+ (App Router) + React 18+ + TypeScript 5+
- スタイリング: Tailwind CSS 3+
- バックエンド: Supabase (PostgreSQL + Auth + Realtime)
- ホスティング: Vercel（GitHub自動デプロイ）
- データベース: PostgreSQL（Row Level Security対応）

**主要なアーキテクチャ決定:**
- パフォーマンス重視でReact Server Componentsをデフォルト使用
- インタラクティブ機能のみClient Components（"use client"）使用
- パフォーマンス重視のCanvasベースガントチャート実装
- カスタムフックによるメモリ効率的な状態管理
- Supabase subscriptionsによるリアルタイム更新

## Supabaseプロジェクト情報

**⚠️ 重要: 以下の情報で統一すること**

- **プロジェクトURL**: `https://krsqullplxexjcuuhqfz.supabase.co`
- **プロジェクトID**: `krsqullplxexjcuuhqfz`
- **Google OAuth リダイレクトURL**: `https://krsqullplxexjcuuhqfz.supabase.co/auth/v1/callback`

## データベーススキーマ

アプリケーションは4つの主要テーブルを使用:
- `projects` - ユーザー所有のプロジェクト情報
- `tasks` - プロジェクト関連付きのタスク管理
- `sales_targets` - プロジェクト別月次売上目標
- `focus_modes` - ユーザー別フォーカスモード設定

全テーブルにマルチテナント対応の`user_id`外部キーとUUID主キーを使用。

## 開発コマンド

```bash
# 開発
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動

# コード品質
npm run lint         # ESLint実行
npm run type-check   # TypeScript型チェック

# データベース
npx supabase start   # ローカルSupabase起動
npx supabase db push # スキーマ変更をプッシュ

# Vercelデプロイ
vercel                # プレビューデプロイ
vercel --prod         # 本番デプロイ
vercel login          # Vercelにログイン
```

## デプロイフロー（必須）

**⚠️ 重要: GitHubにプッシュする前に必ず以下の手順を実行してください**

### 1. ローカルビルドテスト
```bash
# 1. 型チェック
npm run type-check

# 2. Lintチェック  
npm run lint

# 3. ビルドテスト
npm run build

# 4. ビルド成功後、起動テスト
npm run start
```

### 2. Vercel CLIでデプロイテスト
```bash
# 1. Vercelにログイン（初回のみ）
vercel login

# 2. プレビューデプロイでテスト
vercel

# 3. 本番環境でテスト（慎重に）
vercel --prod
```

**本番デプロイURL**: https://ea-goal-manager.vercel.app/

### 3. GitHubプッシュ
```bash
# 1. 変更をステージング
git add -A

# 2. コミット
git commit -m "feat: 機能説明

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. GitHubにプッシュ
git push
```

### 4. 自動デプロイ確認
- GitHub連携により自動デプロイが実行される
- Vercelダッシュボードでデプロイ状況を確認
- 本番URLで動作確認

**注意事項:**
- Vercel CLIでのテストデプロイ後は、必ずGitHubにプッシュして自動デプロイとの整合性を保つ
- エラーが発生した場合は、ローカルでの修正 → ビルドテスト → Vercelテスト → GitHubプッシュの順で対応

## 主要機能と実装ノート

**フォーカスモード:** 紫グラデーション背景、パルスアニメーション、進捗追跡を含む中心機能。タスクフィルタリングと統計表示と連携。

**ガントチャート:** 1日30pxスケールのCanvasベースレンダリング。大量データセット用の慎重な日付計算とパフォーマンス最適化が必要。

**タスク管理:** Notion風インライン編集（ブラー時自動保存）。複数選択操作とNotion形式一括コピーをサポート。

**リアルタイム更新:** 全てのタスク・プロジェクト変更でSupabaseリアルタイムサブスクリプションを発動し、セッション間でUI同期を維持。

**レスポンシブデザイン:** モバイルファーストアプローチ、特定ブレークポイント、モバイルデバイス向けタッチ最適化。

## ファイル構造

```
app/                 # Next.js App Routerページ
├── dashboard/       # タブとガントチャート付きメインダッシュボード
├── projects/        # プロジェクト管理ページ
└── archive/         # アーカイブタスク表示

components/          # 再利用可能Reactコンポーネント
├── ui/             # 基本UIコンポーネント（Button、Input等）
├── charts/         # ガントチャート関連コンポーネント
├── tasks/          # タスク管理コンポーネント
└── projects/       # プロジェクト管理コンポーネント

lib/                # ユーティリティと設定
├── supabase.ts     # Supabaseクライアント設定
├── database.types.ts # 生成TypeScript型
└── utils.ts        # ユーティリティ関数

hooks/              # データフェッチと状態管理用カスタムReactフック
types/              # TypeScript型定義
```

## 重要な実装詳細

**日付処理:** 全ての日付計算でタイムゾーン差を考慮し、アプリケーション全体で一貫した日付フォーマットを使用。

**パフォーマンス:** 特に多数の要素をレンダリングする可能性があるガントチャートコンポーネントで、React.memo、useMemo、useCallbackを戦略的に実装。

**セキュリティ:** 全データベース操作でRow Level Securityポリシーを尊重。アカウント間でのユーザーデータ露出を防止。

**UI一貫性:** 確立されたカラースキーム（紫グラデーション #667eea → #764ba2、プロジェクト固有色）に従い、一貫したスペーシングとタイポグラフィを維持。

**エラー境界:** データベース操作とユーザーインタラクション、特に複雑なガントチャートインタラクションで適切なエラーハンドリングを実装。

## コーディング規約

**設計ドキュメント参照:**
- 主要クラス・コンポーネントの冒頭に以下のコメントを必ず記載:
  - UI-requirements.md または technical-requirements.md への参照
  - 関連する他のクラス・コンポーネントのメモ
  - 該当する機能の要件番号（例: UI-requirements.md の 3.1.1 等）

**コメント例:**
```typescript
/**
 * ガントチャートコンポーネント
 * 
 * 設計参照: UI-requirements.md § 4 ガントチャート機能
 * 技術仕様: technical-requirements.md § 6 ガントチャート技術仕様
 * 
 * 関連コンポーネント:
 * - TaskList: タスクデータ連携
 * - ProjectTabs: フィルタリング連携
 * - FocusMode: 統計表示連携
 * 
 * 実装要件:
 * - 1日=30px固定幅での正確な日付配置
 * - Canvas APIによる高パフォーマンスレンダリング
 * - プロジェクト別色分け対応
 */
```

## 言語設定

**回答言語:**
- ユーザーへの回答は日本語で統一する
- コード内のコメントは基本的に日本語を使用
- エラーメッセージやUIテキストも日本語で記述

## 環境変数設定

**本番環境（Vercel）での必要な環境変数:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://krsqullplxexjcuuhqfz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Supabaseダッシュボードから取得]
```

**Google OAuth設定:**
- Client ID: Google Cloud Consoleから取得
- Client Secret: Google Cloud Consoleから取得  
- 承認済みリダイレクトURI: `https://krsqullplxexjcuuhqfz.supabase.co/auth/v1/callback`