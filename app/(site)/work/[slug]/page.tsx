import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import PageTop from '@/components/PageTop';
import SiteFoot from '@/components/SiteFoot';
import EnquiryForm from '@/components/EnquiryForm';
import { getArtwork, getArtworks, getCollection, getCollectionList, hasPage } from '@/lib/artworks';
import WorkGrid from '@/components/WorkGrid';
import PhotosButton from '@/components/PhotosButton';
import { toCard } from '@/lib/cards';
import { SITE, SHOW_PRICES, priceOrStatus, sizeText } from '@/lib/site';

export const revalidate = 60;
/* /work/<collection> is a collection page; /work/<piece> is a piece's own page (only for pieces with details). */
export async function generateStaticParams() {
  const [all, cols] = await Promise.all([getArtworks(), getCollectionList()]);
  return [...cols.map((c) => ({ slug: c.slug })), ...all.filter(hasPage).map((a) => ({ slug: a.slug }))];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = await getCollection(params.slug);
  if (g) {
    const description = `${g.collection.title} by Mark Staples: ${g.artworks.length} pieces.${g.collection.blurb ? ' ' + g.collection.blurb : ''}`.slice(0, 300);
    const cover = g.artworks[0]?.image;
    return { title: g.collection.title, description, alternates: { canonical: `/work/${g.collection.slug}` },
      openGraph: { title: `${g.collection.title} by Mark Staples`, description, images: cover ? [{ url: cover.url, width: cover.width, height: cover.height, alt: cover.alt }] : [] } };
  }
  const r = await getArtwork(params.slug);
  if (!r) return {};
  const a = r.artwork;
  if (!hasPage(a)) return { robots: { index: false } };
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
  const g = await getCollection(params.slug);
  if (g) return <CollectionPage group={g} />;
  const r = await getArtwork(params.slug);
  if (!r) notFound();
  const a = r.artwork;
  if (!hasPage(a)) redirect(`/work/${a.collection?.slug || ''}#${a.slug}`);
  const withPages = r.all.filter(hasPage); const at = withPages.findIndex((x) => x.slug === a.slug);
  const prev = withPages[(at - 1 + withPages.length) % withPages.length], next = withPages[(at + 1) % withPages.length];
  const title = a.title || 'Untitled';
  const sold = a.status === 'sold';
  const url = `${SITE.url}/work/${a.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'VisualArtwork', name: a.title || 'Untitled', url, image: new URL(a.image.url, SITE.url).toString(),
    description: a.story, artform: a.kind, artMedium: a.medium, dateCreated: a.year ? String(a.year) : undefined,
    ...(a.widthCm && a.heightCm && !a.sizeEstimated ? { width: { '@type': 'Distance', name: `${a.widthCm} cm` }, height: { '@type': 'Distance', name: `${a.heightCm} cm` } } : {}),
    creator: { '@type': 'Person', name: 'Mark Staples' },
    ...(SHOW_PRICES && a.price ? { offers: { '@type': 'Offer', price: a.price, priceCurrency: 'GBP', url,
      availability: sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' } } : {}),
  };
  // only the details we actually have
  const specs: [string, React.ReactNode][] = [...([['Medium', a.medium], ['Size', sizeText(a)], ['Frame', a.frameText], ['Year', a.year]] as [string, React.ReactNode][]).filter(([, v]) => v),
    ...(a.currentVenue && !sold ? [['On show at', <a key="v" className="venue" href={a.currentVenue.url} target="_blank" rel="noopener">{a.currentVenue.name} &#8599;&#xFE0E;</a>] as [string, React.ReactNode]] : []),
    ...(a.pastVenue ? [[sold ? 'Sold via' : 'Shown at', <a key="p" className="venue" href={a.pastVenue.url} target="_blank" rel="noopener">{a.pastVenue.name} &#8599;&#xFE0E;</a>] as [string, React.ReactNode]] : [])];
  return (
    <div className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageTop />
      <main className="wrap">
        <div className="crumbs"><Link href="/work">All work</Link>{a.collection && <> / <Link href={`/work/${a.collection.slug}`}>{a.collection.title}</Link></>} / {title}</div>
        <article className="art">
          <div className={'art-media' + (a.display === 'cutout' || a.display === 'sculpturePhoto' ? ' cut' : '')}>
            <Image src={a.image.url} alt={a.image.alt || a.title} width={a.image.width} height={a.image.height} priority sizes="(max-width: 820px) 100vw, 60vw" />
          </div>
          <div className="info">
            <div className="artist"><img src="/tag.svg" alt="" height={22} width={32} />Mark Staples {(a.kind || a.year) && <em>/ {[a.kind, a.year].filter(Boolean).join(', ')}</em>}</div>
            <h1>{title}</h1>
            <div className="price">
              {sold ? <><strong><span className="dot" aria-hidden="true" /> Sold</strong><span>{a.soldNote ? a.soldNote + '. ' : ''}Ask about similar work or commissions.</span></>
                : <>{priceOrStatus(a) && !a.currentVenue && <strong>{priceOrStatus(a)}</strong>}<span>{SHOW_PRICES && a.price ? 'Free UK delivery' : 'Enquire for details'}</span></>}
              {!sold && a.currentVenue && <div className="onshow"><i aria-hidden="true" /><span>On show now at <a className="venue" href={a.currentVenue.url} target="_blank" rel="noopener">{a.currentVenue.name} &#8599;&#xFE0E;</a></span><small>{a.currentVenue.address}. Pop in and see it in person.</small></div>}
            </div>
            {specs.length > 0 && <dl className="specs">{specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
            {a.note && <p className="story">{a.note}</p>}
            {a.story && <p className="story">{a.story}</p>}
            <PhotosButton card={toCard(a)} />
            <EnquiryForm slug={a.slug} title={a.title || 'this piece'} sold={sold} />
            {a.featured && <Link className="walk" href={`/?piece=${a.slug}`}>See it in the 3D gallery &rarr;</Link>}
          </div>
        </article>
        <nav className="prevnext" aria-label="More work"><Link href={`/work/${prev.slug}`}>&larr; {prev.title || 'Previous'}</Link><Link href={`/work/${next.slug}`}>{next.title || 'Next'} &rarr;</Link></nav>
      </main>
      <SiteFoot />
    </div>
  );
}

type Group = NonNullable<Awaited<ReturnType<typeof getCollection>>>;
function CollectionPage({ group: g }: { group: Group }) {
  const cards = g.artworks.map(toCard);
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${g.collection.title} by Mark Staples`, url: `${SITE.url}/work/${g.collection.slug}`,
    description: g.collection.blurb, hasPart: g.artworks.slice(0, 50).map((a) => ({ '@type': 'VisualArtwork', name: a.title || undefined, image: new URL(a.image.url, SITE.url).toString(), creator: { '@type': 'Person', name: 'Mark Staples' } })) };
  return (
    <div className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <PageTop />
      <main className="wrap">
        <div className="crumbs"><Link href="/work">All work</Link> / {g.collection.title}</div>
        <h1 className="big">{g.collection.title}</h1>
        {g.collection.blurb && <p className="lede">{g.collection.blurb}</p>}
        <p className="coll-count">{g.artworks.length} {g.artworks.length === 1 ? 'piece' : 'pieces'}. Tap any piece to see every photo, or to ask about it.</p>
        <WorkGrid cards={cards} />
        <nav className="prevnext" aria-label="Back"><Link href="/work">&larr; All work</Link><span /></nav>
      </main>
      <SiteFoot />
    </div>
  );
}
