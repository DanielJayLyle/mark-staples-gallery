import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageTop from '@/components/PageTop';
import EnquiryForm from '@/components/EnquiryForm';
import { getArtwork, getArtworks } from '@/lib/artworks';
import { SITE, SHOW_PRICES, priceOrStatus, sizeText } from '@/lib/site';

export const revalidate = 60;
export async function generateStaticParams() { return (await getArtworks()).map((a) => ({ slug: a.slug })); }

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const r = await getArtwork(params.slug);
  if (!r) return {};
  const a = r.artwork;
  const description = [`${a.title} by Mark Staples.`, [a.kind, a.medium, sizeText(a)].filter(Boolean).join(', '), a.story].filter(Boolean).join(' ').slice(0, 300);
  return {
    title: a.kind ? `${a.title}, ${a.kind.toLowerCase()}` : a.title,
    description,
    alternates: { canonical: `/work/${a.slug}` },
    openGraph: { title: `${a.title} by Mark Staples`, description, images: [{ url: a.image.url, width: a.image.width, height: a.image.height, alt: a.image.alt }] },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function ArtworkPage({ params }: { params: { slug: string } }) {
  const r = await getArtwork(params.slug);
  if (!r) notFound();
  const { artwork: a, prev, next } = r;
  const sold = a.status === 'sold';
  const url = `${SITE.url}/work/${a.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'VisualArtwork', name: a.title, url, image: new URL(a.image.url, SITE.url).toString(),
    description: a.story, artform: a.kind, artMedium: a.medium, dateCreated: a.year ? String(a.year) : undefined,
    ...(a.widthCm && a.heightCm ? { width: { '@type': 'Distance', name: `${a.widthCm} cm` }, height: { '@type': 'Distance', name: `${a.heightCm} cm` } } : {}),
    creator: { '@type': 'Person', name: 'Mark Staples' },
    ...(SHOW_PRICES && a.price ? { offers: { '@type': 'Offer', price: a.price, priceCurrency: 'GBP', url,
      availability: sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' } } : {}),
  };
  // only the details we actually have
  const specs: [string, React.ReactNode][] = [...([['Medium', a.medium], ['Size', sizeText(a)], ['Frame', a.frameText], ['Year', a.year]] as [string, React.ReactNode][]).filter(([, v]) => v),
    ...(a.currentVenue && !sold ? [['On show at', <a key="v" className="venue" href={a.currentVenue.url} target="_blank" rel="noopener">{a.currentVenue.name} &#8599;</a>] as [string, React.ReactNode]] : []),
    ...(a.pastVenue ? [[sold ? 'Sold via' : 'Shown at', <a key="p" className="venue" href={a.pastVenue.url} target="_blank" rel="noopener">{a.pastVenue.name} &#8599;</a>] as [string, React.ReactNode]] : [])];
  return (
    <div className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageTop />
      <main className="wrap">
        <div className="crumbs"><Link href="/work">All work</Link> / {a.title}</div>
        <article className="art">
          <div className={'art-media' + (a.display === 'cutout' || a.display === 'sculpturePhoto' ? ' cut' : '')}>
            <Image src={a.image.url} alt={a.image.alt || a.title} width={a.image.width} height={a.image.height} priority sizes="(max-width: 820px) 100vw, 60vw" />
          </div>
          <div className="info">
            <div className="artist"><img src="/tag.svg" alt="" height={22} width={32} />Mark Staples {(a.kind || a.year) && <em>/ {[a.kind, a.year].filter(Boolean).join(', ')}</em>}</div>
            <h1>{a.title}</h1>
            <div className="price">
              {sold ? <><strong><span className="dot" aria-hidden="true" /> Sold</strong><span>{a.soldNote ? a.soldNote + '. ' : ''}Ask about similar work or commissions.</span></>
                : <><strong>{a.currentVenue && !(SHOW_PRICES && a.price) ? 'Available' : priceOrStatus(a)}</strong><span>{SHOW_PRICES && a.price ? 'Free UK delivery' : 'Enquire for details'}</span></>}
              {!sold && a.currentVenue && <div className="onshow"><i aria-hidden="true" /><span>On show now at <a className="venue" href={a.currentVenue.url} target="_blank" rel="noopener">{a.currentVenue.name} &#8599;</a></span><small>{a.currentVenue.address}. Pop in and see it in person.</small></div>}
            </div>
            {specs.length > 0 && <dl className="specs">{specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
            {a.story && <p className="story">{a.story}</p>}
            <EnquiryForm slug={a.slug} title={a.title} sold={sold} />
            <Link className="walk" href={`/?piece=${a.slug}`}>Walk the gallery from here &rarr;</Link>
          </div>
        </article>
        <nav className="prevnext" aria-label="More work"><Link href={`/work/${prev.slug}`}>&larr; {prev.title}</Link><Link href={`/work/${next.slug}`}>{next.title} &rarr;</Link></nav>
      </main>
    </div>
  );
}
