/** @type {import('next').NextConfig} */
const security = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];
const nextConfig = {
  poweredByHeader: false,
  // the one-off Sanity import reads the site's own photo files
  experimental: { outputFileTracingIncludes: { '/api/admin/import': ['./public/work/**', './public/art/**'] } },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }] },
  async headers() { return [{ source: '/:path*', headers: security }]; },
};
export default nextConfig;
