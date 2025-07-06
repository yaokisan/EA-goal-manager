/** @type {import('next').NextConfig} */
const nextConfig = {
  // テストファイルを本番ビルドから除外
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  webpack: (config, { dev, isServer }) => {
    // テストファイルを本番ビルドから除外
    if (!dev) {
      config.module.rules.push({
        test: /\.(test|spec)\.(js|jsx|ts|tsx)$/,
        loader: 'ignore-loader'
      })
    }
    return config
  },
  // ESLint設定でテストディレクトリを除外
  eslint: {
    dirs: ['src/app', 'src/components', 'src/hooks', 'src/lib', 'src/providers', 'src/types']
  }
}

module.exports = nextConfig