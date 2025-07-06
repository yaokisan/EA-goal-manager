/**
 * Jest設定ファイル
 * 
 * Next.js + TypeScript + React Testing Library用の設定
 * TDD環境をサポートするために必要な設定を含む
 */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.jsアプリのディレクトリを指定
  dir: './',
})

// Jestのカスタム設定
const customJestConfig = {
  // テスト環境の設定
  testEnvironment: 'jsdom',
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // テスト対象から除外するディレクトリ
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
    '<rootDir>/.vercel/'
  ],
  
  // モジュールパスのマッピング
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    // CSS/画像ファイルのモック
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 
      '<rootDir>/__mocks__/fileMock.js'
  },
  
  // カバレッジの設定
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/error.tsx'
  ],
  
  // カバレッジレポート形式
  coverageReporters: ['html', 'lcov', 'text', 'text-summary'],
  
  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Supabaseクライアントのモック
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|uuid|isows)/)' 
  ]
}

// Next.jsの設定とマージしてエクスポート
module.exports = createJestConfig(customJestConfig)