import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import PageTop from '@/components/PageTop';
import { getArtworks } from '@/lib/artworks';
import { formatPrice } from '@/lib/site';

export const revalidate = 60;
export const metadata: Metadata = { title: 'All work', description: 'Original paintings, mirror art and sculpture by Mark Staples. See what is available, on show and sold.', alternates: { canonical: '/work' } };

export default async function WorkIndex() {
  const artworks = await getArtworks();
  return (
    <div className="page">
      <PageTop />
      <main className="wrap">
        <h1 className="big">All work</h1>
        <p className="lede">Pop and street art by Mark Staples: spray paint, hand-cut mirrors and tagged sculpture. Every piece is an original. Walk the 3D gallery or browse below.</p>
        <div className="work-grid">
          {artworks.map((a) => (
            <Link key={a.slug} className="work-card" href={`/work/${a.slug}`}>
              <div className="thumb"><Image src={a.image.url} alt={a.image.alt || a.title} width={a.image.width} height={a.image.height} sizes="(max-width: 820px) 50vw, 25vw" /></div>
              <h2>{a.title}</h2>
              <div className="row">{a.status === 'sold' ? <span><span className="dot" aria-hidden="true" /> <b>Sold</b></span> : <b>{formatPrice(a.price)}</b>}<span>{a.status !== 'sold' && a.currentVenue ? `On show at ${a.currentVenue.name}` : a.kind}</span></div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
