import type { MetadataRoute } from 'next';
import { SITE, isProduction } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  if (!isProduction) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/studio', '/api'] }, sitemap: `${SITE.url}/sitemap.xml` };
}
