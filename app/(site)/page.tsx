import Link from 'next/link';
import Gallery from '@/components/Gallery';
import { getArtworks } from '@/lib/artworks';
import { toEngine } from '@/lib/toEngine';
import { SITE } from '@/lib/site';

export const revalidate = 60;

export default async function Home() {
  const artworks = await getArtworks();
  return (
    <>
      {/* Readable by Google and screen readers; the 3D room sits on top visually */}
      <div className="sr-only">
        <h1>Mark Staples, pop and street artist</h1>
        <p>{SITE.description}</p>
        <nav aria-label="All artworks">
          <ul>{artworks.map((a) => <li key={a.slug}><Link href={`/work/${a.slug}`}>{a.title}, {a.kind}</Link></li>)}</ul>
          <Link href="/work">Browse all work</Link>
        </nav>
      </div>
      <Gallery artworks={artworks.map(toEngine)} />
    </>
  );
}
