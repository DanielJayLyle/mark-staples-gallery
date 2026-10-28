import type { MetadataRoute } from 'next';
import { getArtworks, getCollectionList, hasPage } from '@/lib/artworks';
import { SITE } from '@/lib/site';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [art, cols] = await Promise.all([getArtworks(), getCollectionList()]);
  return [
    { url: SITE.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.url}/work`, changeFrequency: 'weekly', priority: .9 },
    { url: `${SITE.url}/about`, changeFrequency: 'monthly', priority: .7 },
    { url: `${SITE.url}/influences`, changeFrequency: 'monthly', priority: .6 },
    { url: `${SITE.url}/privacy`, changeFrequency: 'yearly', priority: .2 },
    ...cols.map((c) => ({ url: `${SITE.url}/work/${c.slug}`, changeFrequency: 'weekly' as const, priority: .8 })),
    ...art.filter(hasPage).map((a) => ({ url: `${SITE.url}/work/${a.slug}`, changeFrequency: 'monthly' as const, priority: .8 })),
  ];
}
