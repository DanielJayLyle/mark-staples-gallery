/** @type {import('next').NextConfig} */
const security = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // a light content policy: no plugins, no <base> tricks, forms only post to this site, nobody frames it
  { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];
const nextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }] },
  // renamed pieces keep their old links working
  async redirects() { return [{ source: '/work/peggy', destination: '/work/twiggy', permanent: true }]; },
  async headers() { return [{ source: '/:path*', headers: security }]; },
};
export default nextConfig;
