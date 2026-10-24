import type { Metadata, Viewport } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'Mark Staples | Pop and street art', template: '%s | Mark Staples' },
  description: SITE.description,
  icons: { icon: '/tag.svg' },
  openGraph: { siteName: 'Mark Staples', type: 'website', locale: 'en_GB' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#E9E6E0' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Permanent+Marker&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
