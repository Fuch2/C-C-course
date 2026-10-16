import type { NextConfig } from 'next';
import path from 'node:path';

// Метка сборки встраивается в клиент и сервер. Значение задаётся в главном процессе,
// поэтому воркеры сборки наследуют его и получают одну и ту же метку.
process.env.NEXT_PUBLIC_BUILD_STAMP ??= `${Date.now()}`;

const config: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  outputFileTracingIncludes: { '/*': ['../../content/**/*', '../../prisma/**/*'] },
  transpilePackages: ['@course/shared', '@course/course-engine', '@course/ui'],
  poweredByHeader: false,
  // Полный курс загружается каждым обработчиком статических страниц.
  // Ограничиваем параллелизм сборки, чтобы снизить пиковый расход памяти в Docker.
  experimental: { cpus: 2 },
  webpack(config) {
    // Shared TS sources use Node-compatible .js imports for the emitted runner.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
  async redirects() {
    return [{ source: '/learn/:lessonId', destination: '/lesson/:lessonId', permanent: false }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
