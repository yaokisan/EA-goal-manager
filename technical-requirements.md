# Focus Goal アプリケーション技術要件定義書

## 1. システム概要

### 1.1 アーキテクチャ
- **フロントエンド**: Next.js 14+ (App Router)
- **バックエンド**: Supabase (PostgreSQL + Auth + Realtime)
- **ホスティング**: Vercel
- **CI/CD**: GitHub Actions (Vercel自動デプロイ)
- **データベース**: PostgreSQL (Supabase)

### 1.2 ブラウザサポート
- **対象ブラウザ**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **モバイル**: iOS Safari 14+, Android Chrome 90+

## 2. 技術仕様

### 2.1 フロントエンド技術スタック
```
- Next.js 14+ (App Router)
- React 18+ (Server Components)
- TypeScript 5+
- Tailwind CSS 3+
- Supabase Client
```

### 2.2 バックエンド技術スタック
```
- Supabase (Backend as a Service)
- PostgreSQL (データベース)
- Row Level Security (RLS)
- Realtime Subscriptions
- Supabase Auth (認証)
```

### 2.3 開発・デプロイ環境
```
- Vercel (ホスティング・CI/CD)
- GitHub (ソースコード管理)
- GitHub Actions (自動デプロイ)
- Vercel Analytics (パフォーマンス監視)
```

## 3. データベース設計（Supabase/PostgreSQL）

### 3.1 テーブル構造

#### projects テーブル
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  color VARCHAR(7) DEFAULT '#667eea',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### tasks テーブル
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### sales_targets テーブル
```sql
CREATE TABLE sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL, -- "2024-01"
  target_amount INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, year_month)
);
```

#### focus_modes テーブル
```sql
CREATE TABLE focus_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  deadline DATE,
  goal TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Next.js コンポーネント設計

### 4.1 ページ構成（App Router）
```
app/
├── layout.tsx (ルートレイアウト)
├── page.tsx (ログイン/ホーム)
├── dashboard/
│   ├── layout.tsx (認証レイアウト)
│   ├── page.tsx (ダッシュボード)
│   └── components/
│       ├── ProjectTabs.tsx
│       ├── FocusMode.tsx
│       ├── GanttChart.tsx
│       └── TaskList.tsx
├── projects/
│   ├── page.tsx (プロジェクト一覧)
│   ├── [id]/
│   │   └── page.tsx (プロジェクト編集)
│   └── components/
│       ├── ProjectCard.tsx
│       └── ProjectEditor.tsx
└── archive/
    └── page.tsx (アーカイブ)
```

### 4.2 共通UIコンポーネント
```typescript
components/ui/
├── Button.tsx
├── Input.tsx
├── Select.tsx
├── DatePicker.tsx
├── Card.tsx
├── Tag.tsx
├── Modal.tsx
├── Toast.tsx
└── Loading.tsx
```

## 5. 状態管理・データフェッチング

### 5.1 React Server Components + Client Components
```typescript
// Server Components (デフォルト)
- データフェッチング
- 初期レンダリング
- SEO最適化

// Client Components ("use client")
- インタラクティブ機能
- 状態管理（useState, useReducer）
- イベントハンドリング
```

### 5.2 カスタムフック設計
```typescript
// データフェッチング
const useProjects = () => { /* Supabase query */ }
const useTasks = (projectId?: string) => { /* Supabase query */ }
const useFocusMode = () => { /* フォーカスモード管理 */ }

// UI状態管理
const useMultiSelect = () => { /* 複数選択状態 */ }
const useGanttChart = () => { /* ガントチャート状態 */ }
```

### 5.3 Supabase Realtime
```typescript
// リアルタイム更新
const useRealtimeTasks = () => {
  useEffect(() => {
    const subscription = supabase
      .channel('tasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        handleTaskChange
      )
      .subscribe()
    return () => subscription.unsubscribe()
  }, [])
}
```

## 6. ガントチャート技術仕様

### 6.1 React実装方式
```typescript
// Canvas + React Hook
const GanttChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { tasks, projects } = useTasks()
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    renderGanttChart(ctx, tasks, projects)
  }, [tasks, projects])
  
  return <canvas ref={canvasRef} className="w-full h-full" />
}
```

### 6.2 日付計算ユーティリティ
```typescript
const PIXELS_PER_DAY = 30

export const calculatePosition = (date: Date, startDate: Date): number => {
  const diffTime = date.getTime() - startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays * PIXELS_PER_DAY
}

export const getDateRange = (tasks: Task[]) => {
  const dates = tasks.flatMap(task => [task.start_date, task.end_date])
  return {
    start: new Date(Math.min(...dates.map(d => d.getTime()))),
    end: new Date(Math.max(...dates.map(d => d.getTime())))
  }
}
```

### 6.3 パフォーマンス最適化
```typescript
// React最適化
- React.memo（不要な再レンダリング防止）
- useMemo（重い計算のメモ化）
- useCallback（イベントハンドラーの最適化）
- Intersection Observer（仮想スクロール）
```

## 7. レスポンシブデザイン

### 7.1 ブレークポイント
```css
:root {
  --mobile: 480px;
  --tablet: 768px;
  --desktop: 1024px;
  --wide: 1200px;
}
```

### 7.2 レイアウト戦略
- **Mobile First**: モバイルベースの設計
- **Progressive Enhancement**: 段階的機能向上
- **Touch Optimization**: タッチデバイス最適化

## 8. パフォーマンス要件

### 8.1 読み込み時間
- **初回読み込み**: 2秒以内
- **画面遷移**: 100ms以内
- **タスク操作**: 50ms以内

### 8.2 最適化手法
```
- CSS/JS Minification
- Image Optimization
- Lazy Loading
- Event Delegation
- Memory Leak Prevention
```

## 9. セキュリティ考慮事項

### 9.1 XSS対策
```javascript
// HTMLエスケープ関数
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
```

### 9.2 入力検証
```javascript
// バリデーション関数
const validateTask = (task) => {
  return {
    name: task.name?.trim() || '',
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate)
  };
};
```

## 10. 開発環境・ツール

### 10.1 Next.js開発環境
```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

### 10.2 開発ツール構成
```
- Next.js Dev Server（HMR付き）
- TypeScript（型チェック）
- ESLint + Prettier（コード品質）
- Tailwind CSS（スタイリング）
- Supabase CLI（DB管理）
```

### 10.3 CI/CD（Vercel + GitHub）
```yaml
# .github/workflows/ci.yml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

## 11. ファイル構成（Next.js App Router）

```
focus-goal/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── components/
│   ├── projects/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   └── components/
│   ├── archive/
│   │   └── page.tsx
│   └── api/
├── components/
│   ├── ui/
│   ├── charts/
│   ├── tasks/
│   └── projects/
├── lib/
│   ├── supabase.ts
│   ├── database.types.ts
│   └── utils.ts
├── hooks/
├── types/
├── public/
├── docs/
├── package.json
├── tailwind.config.js
├── next.config.js
└── .env.local
```

## 12. 実装優先順位

### フェーズ1: プロジェクト基盤構築
1. Next.js + TypeScript + Tailwind CSS セットアップ
2. Supabase プロジェクト作成・DB設計
3. 認証システム実装（Supabase Auth）
4. 基本レイアウト・ナビゲーション

### フェーズ2: 核心機能実装
5. プロジェクト管理（CRUD操作）
6. タスク管理（CRUD操作）
7. タスクリスト表示・編集（Notion風UX）
8. プロジェクトタブ・フィルタリング

### フェーズ3: 高度な機能
9. ガントチャート実装（Canvas + React）
10. フォーカスモード機能
11. 直近1週間タブ・期限管理
12. 複数選択・一括操作

### フェーズ4: UX向上・最適化
13. リアルタイム更新（Supabase Realtime）
14. レスポンシブ対応
15. アニメーション・視覚効果
16. パフォーマンス最適化

### フェーズ5: 本番対応
17. エラーハンドリング・バリデーション
18. テスト実装
19. Vercel デプロイ設定
20. 監視・ログ設定