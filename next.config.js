const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    // Force all Yjs imports to resolve to the same instance.
    // Without this, y-webrtc and y-indexeddb can bundle separate copies of yjs,
    // which breaks instanceof checks in the sync protocol and silently prevents
    // Y.Doc sync between peers. See https://github.com/yjs/yjs/issues/438
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: path.resolve(__dirname, 'node_modules/yjs'),
    }
    return config
  },
}

module.exports = nextConfig
