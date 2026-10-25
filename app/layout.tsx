import type { Metadata, Viewport } from 'next';
import { SITE, isProduction } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'Mark Staples | Pop and street art', template: '%s | Mark Staples' },
  description: SITE.description,
  icons: { icon: '/tag.svg' },
  openGraph: { siteName: 'Mark Staples', type: 'website', locale: 'en_GB' },
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
