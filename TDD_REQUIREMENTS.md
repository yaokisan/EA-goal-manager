# TDD開発要件定義書

このドキュメントは、4つの修正点をTDDで実装するための詳細な要件定義とテストケースを記載しています。

## 修正項目一覧

### 1. フォーカスモード状態永続化問題の修正

**問題**：フォーカスモードをオンからオフに切り替えてもリロードするとまたオンになってしまう

**根本原因**：
- データベースの`focusData`存在によりフォーカスモードが強制的にオン
- ローカルストレージの状態が無視される
- UI状態とデータベース状態の管理が不適切

**要件**：
1. フォーカスモードのオン/オフ状態はユーザーの明示的な操作でのみ変更
2. リロード時はローカルストレージの状態を優先して復元
3. `focusData`が存在してもユーザーがオフにした場合は非表示を維持

**テストケース**：

```typescript
describe('フォーカスモード状態永続化', () => {
  test('フォーカスモードをオンにしてリロード → オン状態を維持', async () => {
    // Given: フォーカスデータが存在し、フォーカスモードがオン
    const mockFocusData = createMockFocusData()
    render(<Dashboard />)
    
    // When: フォーカスモードをオンにする
    fireEvent.click(screen.getByTestId('focus-mode-toggle'))
    
    // Then: ローカルストレージに状態が保存される
    expect(localStorage.getItem('focusMode')).toBe('true')
    
    // When: ページをリロード
    reloadPage()
    
    // Then: フォーカスモードがオン状態で表示される
    expect(screen.getByTestId('focus-mode-display')).toBeVisible()
  })

  test('フォーカスモードをオフにしてリロード → オフ状態を維持', async () => {
    // Given: フォーカスデータが存在し、フォーカスモードがオン
    const mockFocusData = createMockFocusData()
    render(<Dashboard />)
    
    // When: フォーカスモードをオフにする
    fireEvent.click(screen.getByTestId('focus-mode-toggle'))
    
    // Then: ローカルストレージに状態が保存される
    expect(localStorage.getItem('focusMode')).toBe('false')
    
    // When: ページをリロード
    reloadPage()
    
    // Then: フォーカスモードが非表示になる
    expect(screen.queryByTestId('focus-mode-display')).not.toBeInTheDocument()
  })

  test('フォーカスデータがない状態でリロード → オフ状態を維持', async () => {
    // Given: フォーカスデータが存在しない
    mockSupabase.from('focus_modes').select().eq().single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    
    // When: ページを読み込み
    render(<Dashboard />)
    
    // Then: フォーカスモードが非表示
    expect(screen.queryByTestId('focus-mode-display')).not.toBeInTheDocument()
    expect(localStorage.getItem('focusMode')).toBe('false')
  })
})
```

---

### 2. タイムライン表示範囲拡張

**問題**：現在は左スクロールで1週間前までしか遡れない状態になっている

**現状**：
- 「すべて」タブや個別プロジェクトタブで、今日のマーカーがスタートから1週間後の位置に表示
- 表示開始日は本日より1週間前（これは正しい）
- 左スクロール時の最小表示日付が「今日-7日」で制限されている

**要件**：
1. 左にスクロールして1ヶ月前まで遡れるようにする
2. 今日のマーカーの相対位置は適切に調整する
3. 既存の期間選択機能（1ヶ月、2ヶ月、3ヶ月）との整合性を保つ

**テストケース**：

```typescript
describe('タイムライン表示範囲拡張', () => {
  test('初期表示で1週間前から開始し、今日のマーカーが適切な位置に表示される', () => {
    // Given: 今日が2024-07-06
    const today = new Date('2024-07-06')
    jest.useFakeTimers().setSystemTime(today)
    
    // When: 「すべて」タブを選択（1ヶ月表示）
    render(<GanttChart activeTab="all" selectedMonths="1" tasks={mockTasks} />)
    
    // Then: 表示範囲が1週間前から開始
    const expectedStartDate = new Date('2024-06-29')
    expect(screen.getByTestId('gantt-timeline-start')).toHaveTextContent('6/29')
    
    // And: 今日のマーカーが期間内の適切な位置に表示
    const todayMarker = screen.getByTestId('today-marker')
    expect(todayMarker).toBeInTheDocument()
  })

  test('左スクロールで1ヶ月前まで遡れる', () => {
    const today = new Date('2024-07-06')
    jest.useFakeTimers().setSystemTime(today)
    
    // Given: ガントチャートが表示されている
    render(<GanttChart activeTab="all" selectedMonths="1" tasks={mockTasks} />)
    
    // When: 左に最大スクロール
    const ganttContainer = screen.getByTestId('gantt-scroll-container')
    fireEvent.scroll(ganttContainer, { target: { scrollLeft: 0 } })
    
    // Then: 1ヶ月前の日付まで表示される
    const oneMonthAgo = new Date('2024-06-06')
    const visibleDates = screen.getAllByTestId(/^date-cell-/)
    const oneMonthAgoCell = visibleDates.find(cell => 
      cell.getAttribute('data-testid') === 'date-cell-2024-06-06'
    )
    expect(oneMonthAgoCell).toBeInTheDocument()
  })

  test('スクロール可能範囲が1ヶ月前から期間終了まで拡張される', () => {
    const today = new Date('2024-07-06')
    jest.useFakeTimers().setSystemTime(today)
    
    // Given: 2ヶ月表示で表示
    render(<GanttChart activeTab="all" selectedMonths="2" tasks={mockTasks} />)
    
    // When: スクロール範囲を確認
    const ganttContainer = screen.getByTestId('gantt-scroll-container')
    const scrollableWidth = ganttContainer.scrollWidth
    const visibleWidth = ganttContainer.clientWidth
    
    // Then: 約3ヶ月分（1ヶ月前 + 2ヶ月）のスクロール範囲が確保される
    const expectedDays = 30 + 60 // 1ヶ月前 + 2ヶ月選択
    const expectedWidth = expectedDays * 30 // 1日30px
    expect(scrollableWidth).toBeGreaterThanOrEqual(expectedWidth)
  })

  test('今日のマーカー位置が期間に応じて適切に調整される', () => {
    const today = new Date('2024-07-06')
    jest.useFakeTimers().setSystemTime(today)
    
    // 各期間でのマーカー位置をテスト
    const periods = ['1', '2', '3']
    
    periods.forEach(period => {
      const { rerender } = render(<GanttChart activeTab="all" selectedMonths={period} tasks={mockTasks} />)
      
      const todayMarker = screen.getByTestId('today-marker')
      const markerPosition = parseInt(getComputedStyle(todayMarker).left)
      
      // 今日のマーカーが期間開始から約30日後（1ヶ月後）の位置にあることを確認
      const expectedPosition = 30 * 30 // 30日 × 30px
      expect(markerPosition).toBeCloseTo(expectedPosition, -1) // ±10px程度の誤差許容
      
      rerender(<></>)
    })
  })

  test('期間選択変更時でもスクロール範囲が適切に更新される', () => {
    const today = new Date('2024-07-06')
    jest.useFakeTimers().setSystemTime(today)
    
    // Given: 1ヶ月表示から開始
    const { rerender } = render(<GanttChart activeTab="all" selectedMonths="1" tasks={mockTasks} />)
    
    // When: 3ヶ月表示に変更
    rerender(<GanttChart activeTab="all" selectedMonths="3" tasks={mockTasks} />)
    
    // Then: スクロール範囲が拡張される
    const ganttContainer = screen.getByTestId('gantt-scroll-container')
    const expectedDays = 30 + 90 // 1ヶ月前 + 3ヶ月選択
    const expectedWidth = expectedDays * 30
    expect(ganttContainer.scrollWidth).toBeGreaterThanOrEqual(expectedWidth)
  })
})
```

---

### 3. 進捗バー終了点位置の修正

**問題**：期間切り替え時に進捗バーの終了点位置が期間に比例して変化

**根本原因**：
- パーセンテージベースの位置計算と固定ピクセル幅の不整合
- `dateToPercent`関数での総日数による割り算

**要件**：
1. 進捗バーの位置・幅計算を1日30px固定基準に統一
2. 期間切り替え時も進捗バーが正確な位置に表示
3. 日付グリッドと進捗バーの位置が完全に一致

**テストケース**：

```typescript
describe('進捗バー位置計算', () => {
  test('期間切り替え時でも同じタスクの進捗バー位置が一定', () => {
    const task = createMockTask({
      start_date: '2024-07-01',
      end_date: '2024-07-03'
    })
    
    // 1ヶ月表示での位置を記録
    const { rerender } = render(<GanttChart activeTab="all" selectedMonths="1" tasks={[task]} />)
    const progressBar1Month = screen.getByTestId(`task-bar-${task.id}`)
    const position1Month = getComputedStyle(progressBar1Month).left
    const width1Month = getComputedStyle(progressBar1Month).width
    
    // 2ヶ月表示で再レンダリング
    rerender(<GanttChart activeTab="all" selectedMonths="2" tasks={[task]} />)
    const progressBar2Month = screen.getByTestId(`task-bar-${task.id}`)
    const position2Month = getComputedStyle(progressBar2Month).left
    const width2Month = getComputedStyle(progressBar2Month).width
    
    // 3ヶ月表示で再レンダリング
    rerender(<GanttChart activeTab="all" selectedMonths="3" tasks={[task]} />)
    const progressBar3Month = screen.getByTestId(`task-bar-${task.id}`)
    const position3Month = getComputedStyle(progressBar3Month).left
    const width3Month = getComputedStyle(progressBar3Month).width
    
    // すべての期間で位置と幅が同一であることを確認
    expect(position1Month).toBe(position2Month)
    expect(position2Month).toBe(position3Month)
    expect(width1Month).toBe(width2Month)
    expect(width2Month).toBe(width3Month)
  })

  test('1日30px固定幅で進捗バーが描画される', () => {
    const task = createMockTask({
      start_date: '2024-07-01',
      end_date: '2024-07-04' // 3日間
    })
    
    render(<GanttChart activeTab="all" tasks={[task]} />)
    const progressBar = screen.getByTestId(`task-bar-${task.id}`)
    
    // 3日間 × 30px = 90px の幅であることを確認
    expect(progressBar).toHaveStyle({ width: '90px' })
  })

  test('日付グリッドと進捗バーの位置が正確に一致', () => {
    const task = createMockTask({
      start_date: '2024-07-02',
      end_date: '2024-07-04'
    })
    
    render(<GanttChart activeTab="all" tasks={[task]} />)
    
    // 7月2日のグリッド位置を取得
    const dateCell = screen.getByTestId('date-cell-2024-07-02')
    const cellPosition = getComputedStyle(dateCell).left
    
    // 進捗バーの開始位置を取得
    const progressBar = screen.getByTestId(`task-bar-${task.id}`)
    const barPosition = getComputedStyle(progressBar).left
    
    // 位置が一致することを確認（セル中央配置のため15pxオフセット）
    expect(parseInt(barPosition)).toBe(parseInt(cellPosition) + 15)
  })
})
```

---

### 4. タブレイアウト改善

**問題**：タブとコントロール要素が別行に配置され、横スクロール時のレイアウトが不適切

**要件**：
1. タブとコントロール要素（担当者フィルタ、フォーカスモード）を同一行に配置
2. コントロール要素を右端に固定
3. タブ数増加時の横スクロール機能を維持

**テストケース**：

```typescript
describe('タブレイアウト改善', () => {
  test('タブとコントロール要素が同一行に配置される', () => {
    const projects = Array.from({ length: 3 }, (_, i) => createMockProject({ id: `project-${i}` }))
    
    render(<ProjectTabs projects={projects} />)
    
    const tabContainer = screen.getByTestId('tab-container')
    const controlContainer = screen.getByTestId('control-container')
    
    // 同じ親要素内に配置されることを確認
    expect(tabContainer.parentElement).toBe(controlContainer.parentElement)
    
    // Flexboxで横並びに配置されることを確認
    const parentElement = tabContainer.parentElement
    expect(parentElement).toHaveClass('flex')
    expect(parentElement).toHaveClass('items-center')
  })

  test('コントロール要素が右端に固定される', () => {
    render(<ProjectTabs projects={mockProjects} />)
    
    const controlContainer = screen.getByTestId('control-container')
    
    // 右端固定のクラスが適用されることを確認
    expect(controlContainer).toHaveClass('flex-shrink-0')
    expect(controlContainer).toHaveClass('ml-4')
  })

  test('タブ数が多い場合に横スクロールが機能する', () => {
    // 多数のプロジェクトを作成
    const manyProjects = Array.from({ length: 10 }, (_, i) => 
      createMockProject({ id: `project-${i}`, name: `長いプロジェクト名${i}` })
    )
    
    render(<ProjectTabs projects={manyProjects} />)
    
    const tabNavigation = screen.getByTestId('tab-navigation')
    
    // 横スクロールが有効になることを確認
    expect(tabNavigation).toHaveClass('overflow-x-auto')
    expect(tabNavigation).toHaveClass('flex-1')
    expect(tabNavigation).toHaveClass('min-w-0')
    
    // スクロール可能であることを確認
    expect(tabNavigation.scrollWidth).toBeGreaterThan(tabNavigation.clientWidth)
  })

  test('モバイル表示でもレイアウトが維持される', () => {
    // モバイルサイズにビューポートを設定
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    
    render(<ProjectTabs projects={mockProjects} />)
    
    const tabContainer = screen.getByTestId('tab-container')
    const controlContainer = screen.getByTestId('control-container')
    
    // モバイルでも横並びレイアウトを維持
    const parentElement = tabContainer.parentElement
    expect(parentElement).toHaveClass('flex')
    expect(parentElement).not.toHaveClass('flex-col')
  })

  test('ドラッグ&ドロップ機能が横スクロール時も動作する', async () => {
    const projects = Array.from({ length: 5 }, (_, i) => createMockProject({ id: `project-${i}` }))
    
    render(<ProjectTabs projects={projects} />)
    
    const firstTab = screen.getByTestId('tab-project-0')
    const secondTab = screen.getByTestId('tab-project-1')
    
    // ドラッグ&ドロップ操作
    await user.pointer([
      { keys: '[MouseLeft>]', target: firstTab },
      { target: secondTab },
      { keys: '[/MouseLeft]' }
    ])
    
    // タブの順序が変更されることを確認
    const reorderedTabs = screen.getAllByTestId(/^tab-project-/)
    expect(reorderedTabs[0]).toHaveAttribute('data-testid', 'tab-project-1')
    expect(reorderedTabs[1]).toHaveAttribute('data-testid', 'tab-project-0')
  })
})
```

## テスト実装の優先順位

1. **High Priority** - フォーカスモード状態永続化（ユーザー体験に直接影響）
2. **High Priority** - 進捗バー終了点位置（データ表示の正確性）
3. **Medium Priority** - タイムライン表示範囲（機能的整合性）
4. **Medium Priority** - タブレイアウト改善（UI/UX改善）

## TDD実装のアプローチ

各修正項目について以下の手順で実装：

1. **Red** - テストを先に作成して失敗させる
2. **Green** - 最小限のコードでテストを通す
3. **Refactor** - コードの品質を向上させる

これらの要件定義に基づいて、各機能を順次TDDで実装していきます。