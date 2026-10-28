import type { Metadata, Viewport } from 'next';
import { SITE, isProduction } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'Mark Staples | Pop and street art', template: '%s | Mark Staples' },
  description: SITE.description,
  icons: { icon: '/tag.svg', apple: '/apple-touch-icon.png' },
  openGraph: { siteName: 'Mark Staples', type: 'website', locale: 'en_GB', images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Mark Staples, street pop art' }] },
  twitter: { card: 'summary_large_image', images: ['/og.jpg'] },
  ...(isProduction ? {} : { robots: { index: false, follow: false } }),
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#E9E6E0' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
