import type { Metadata } from 'next';
import Link from 'next/link';
import PageTop from '@/components/PageTop';
import SiteFoot from '@/components/SiteFoot';
import WorkGrid from '@/components/WorkGrid';
import { getCollections, getRecent, getStudio } from '@/lib/artworks';
import { toCard } from '@/lib/cards';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'All work',
  description: 'Every piece by Mark Staples: recent paintings, the Churchill and Icons collections, painted Buddhas, hand-etched mirrors, painted objects, drawings and poetry.',
  alternates: { canonical: '/work' },
};

const PREVIEW = 8;

export default async function WorkIndex() {
  const [groups, recent, studio] = await Promise.all([getCollections(), getRecent(), getStudio()]);
  const studioCards = studio.map((s, i) => ({ slug: `studio-${i + 1}`, title: s.title, alt: `${s.title}, behind the scenes with Mark Staples`, photos: s.photos.map((p) => ({ ...p, alt: `${s.title}, behind the scenes with Mark Staples` })), status: '', statusText: '', sold: false, page: false }));
  return (
    <div className="page">
      <PageTop />
      <main className="wrap">
        <h1 className="big">All work</h1>
        <p className="lede">Everything Mark has made, by collection. The 3D gallery shows a handful; it all lives here. Tap any piece to see every photo of it, or to ask about it.</p>

        <nav className="arch-jump arch-bar" aria-label="Collections">
          {recent.length > 0 && <a href="#recent">Recent <span>{recent.length}</span></a>}
          {groups.map((g) => <a key={g.collection.slug} href={`#${g.collection.slug}`}>{g.collection.title} <span>{g.artworks.length}</span></a>)}
          {studio.length > 0 && <a href="#in-the-studio">In the studio</a>}
        </nav>

        {recent.length > 0 && (
          <section id="recent" className="arch-section">
            <header className="arch-head"><h2>Recent</h2><p>The newest work, whichever collection it lives in.</p></header>
            <WorkGrid cards={recent.map(toCard)} limit={PREVIEW} expandLabel={`Show all ${recent.length} recent pieces`} showCollection />
          </section>
        )}

        {groups.map((g) => (
          <section key={g.collection.slug} id={g.collection.slug} className="arch-section">
            <header className="arch-head">
              <div><h2><Link href={`/work/${g.collection.slug}`}>{g.collection.title}</Link></h2>{g.collection.blurb && <p>{g.collection.blurb}</p>}</div>
              {g.artworks.length > PREVIEW && <Link className="see-all" href={`/work/${g.collection.slug}`}>See all {g.artworks.length} &rarr;</Link>}
            </header>
            <WorkGrid cards={g.artworks.slice(0, PREVIEW).map(toCard)} />
          </section>
        ))}

        {studio.length > 0 && (
          <section id="in-the-studio" className="arch-section">
            <header className="arch-head"><h2>In the studio</h2><p>Behind the scenes: paint, stencils, shows and days out.</p></header>
            <WorkGrid cards={studioCards} studio />
          </section>
        )}
      </main>
      <SiteFoot />
    </div>
  );
}
