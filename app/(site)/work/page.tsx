import type { Metadata } from 'next';
import PageTop from '@/components/PageTop';
import SiteFoot from '@/components/SiteFoot';
import Archive from '@/components/Archive';
import { getCollections } from '@/lib/artworks';

export const revalidate = 60;
export const metadata: Metadata = { title: 'All work', description: 'Original paintings, mirror art and sculpture by Mark Staples, by section. See what is available, on show and sold.', alternates: { canonical: '/work' } };

export default async function WorkIndex() {
  const groups = await getCollections();
  return (
    <div className="page">
      <PageTop />
      <main className="wrap">
        <h1 className="big">All work</h1>
        <p className="lede">Pop and street art by Mark Staples: spray paint, hand-cut mirrors and tagged sculpture. Every piece is an original. The 3D gallery shows a curated selection; everything lives here.</p>
        <Archive groups={groups} />
      </main>
      <SiteFoot />
    </div>
  );
}
