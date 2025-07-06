/**
 * テストユーティリティ
 * 
 * React Testing Libraryのカスタムレンダリング関数
 * プロバイダーやモックコンテキストをセットアップ
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// テスト用のプロバイダーを設定
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  )
}

// カスタムレンダリング関数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// React Testing Libraryのすべてのエクスポートを再エクスポート
export * from '@testing-library/react'

// カスタムレンダリング関数をデフォルトエクスポート
export { customRender as render }