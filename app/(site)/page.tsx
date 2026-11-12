import Link from 'next/link';
import Gallery from '@/components/Gallery';
import { getFeatured, getCollectionList } from '@/lib/artworks';
import { toEngine } from '@/lib/toEngine';
import { SITE } from '@/lib/site';
import { getAbout } from '@/lib/siteText';

export const revalidate = 60;
export const metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const [artworks, about, collections] = await Promise.all([getFeatured(), getAbout(), getCollectionList()]);
  return (
    <>
      {/* Readable by Google and screen readers; the 3D room sits on top visually */}
      <div className="sr-only">
        <h1>Mark Staples, pop and street artist</h1>
        <p>{SITE.description}</p>
        <h2>About Mark Staples (markys11)</h2>
        <p>
          Mark Staples is a street pop artist based in Southampton, on Instagram as @marky_s11. He grew up loving cartoons and characters,
          found his way into graffiti, doodling and art as a kid in Bristol, and picked up the paint again during lockdown.
          His work now hangs in Brighton galleries and in homes, bars, cafes and on walls across the UK.
        </p>
        <p>Inspired by {about.influences.slice(0, 6).join(', ')} and many more.</p>
        <h2>Collections</h2>
        <ul>{collections.map((c) => <li key={c.slug}><Link href={`/work/${c.slug}`}>{c.title}</Link></li>)}</ul>
        <h2>Featured work</h2>
        <nav aria-label="All artworks">
          <ul>{artworks.map((a) => <li key={a.slug}><Link href={`/work/${a.slug}`}>{[a.title, a.kind].filter(Boolean).join(', ')}</Link></li>)}</ul>
          <Link href="/work">Browse all work</Link> <Link href="/about">About Mark Staples</Link>
        </nav>
      </div>
      <Gallery artworks={artworks.map(toEngine)} about={about} />
    </>
  );
}
