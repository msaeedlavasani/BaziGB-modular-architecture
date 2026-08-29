/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Validation builds must not overwrite the active dev server's `.next` tree.
  // `npm run build:verify -w @bazigb/web` selects `.next-verify` explicitly.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // در توسعه، API و Socket.IO سرور NestJS روی پورت 3001 است.
  // استفاده از پروکسی same-origin باعث می‌شود دستگاه‌های دیگر شبکه هم
  // با همان آدرس وب (مثلاً http://192.168.x.x:3000) به سرور وصل شوند
  // و «بازی با حریف آنلاین» بین دو دستگاه کار کند.
  async rewrites() {
    // در پروداکشن، API_PROXY_TARGET باید http://localhost:3001 باشد
    const target = process.env.API_PROXY_TARGET ?? 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
      // Socket.IO: Next مسیر /socket.io/ را به /socket.io (بدون اسلش آخر)
      // ریدایرکت می‌کند و سرور Nest فقط با اسلش جواب می‌دهد — پس دو مسیر جدا
      // تعریف می‌شود تا اسلش آخر به سمت سرور حفظ شود.
      {
        source: '/socket.io',
        destination: `${target}/socket.io/`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${target}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
