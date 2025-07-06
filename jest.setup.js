/**
 * Jest セットアップファイル
 * 
 * すべてのテストファイルの実行前に実行される設定
 * Testing Libraryの設定とカスタムマッチャーを追加
 */

// React Testing LibraryのjestDomマッチャーを追加
import '@testing-library/jest-dom'

// Next.js Image componentのモック
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Next.js Router のモック
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Next.js Navigation のモック (App Router用)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))

// Supabaseクライアントのモック
// jest.mock('./src/lib/supabase', () => ({
//   createClient: jest.fn(() => ({
//     auth: {
//       getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
//       signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
//       signOut: jest.fn().mockResolvedValue({ error: null }),
//       onAuthStateChange: jest.fn(),
//     },
//     from: jest.fn(() => ({
//       select: jest.fn().mockReturnThis(),
//       insert: jest.fn().mockReturnThis(),
//       update: jest.fn().mockReturnThis(),
//       delete: jest.fn().mockReturnThis(),
//       eq: jest.fn().mockReturnThis(),
//       order: jest.fn().mockReturnThis(),
//       single: jest.fn().mockResolvedValue({ data: null, error: null }),
//     })),
//     channel: jest.fn(() => ({
//       on: jest.fn().mockReturnThis(),
//       subscribe: jest.fn(),
//     })),
//   })),
// }))

// ローカルストレージのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// セッションストレージのモック
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// ResizeObserver のモック (一部のコンポーネントで使用)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// IntersectionObserver のモック
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// matchMedia のモック (レスポンシブデザインテスト用)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Canvas API のモック (ガントチャート用)
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}))

// クリップボード API のモック
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
})

// console のテスト用設定
// テスト実行時のconsoleログを抑制したい場合は以下をコメントアウト
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// }