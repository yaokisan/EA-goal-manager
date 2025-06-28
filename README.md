# Focus Goal - タスク管理アプリケーション

プロジェクト別タスク管理、ガントチャート可視化、フォーカスモード機能を備えたタスク管理アプリケーション。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Auth + Realtime)
- **ホスティング**: Vercel

## セットアップ

### 1. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、Supabaseの認証情報を設定してください。

```bash
cp .env.local.example .env.local
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://app.supabase.com) でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのSettings > API から以下の値を取得:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. データベースの初期化

Supabaseダッシュボードで `supabase/migrations/001_initial_schema.sql` の内容を実行してください。

### 4. 依存関係のインストール

```bash
npm install
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

## 主な機能

- **プロジェクト管理**: プロジェクトの作成・編集・削除
- **タスク管理**: Notion風のインライン編集、複数選択、一括操作
- **ガントチャート**: タスクの期間を視覚的に表示
- **フォーカスモード**: 特定の目標に集中するための機能
- **リアルタイム同期**: 複数ユーザー間でのリアルタイム更新

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm run start

# Lintチェック
npm run lint

# 型チェック
npm run type-check
```

## プロジェクト構造

```
src/
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
├── lib/              # ユーティリティ・設定
├── hooks/           # カスタムフック
└── types/           # TypeScript型定義
```

## ドキュメント

- [UI要件定義書](./UI-requirements.md)
- [技術要件定義書](./technical-requirements.md)
- [開発ガイド](./CLAUDE.md)