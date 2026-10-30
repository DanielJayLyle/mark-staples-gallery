import type { Metadata } from 'next';
import Link from 'next/link';
import { ldHtml } from '@/lib/jsonld';
import Gallery from '@/components/Gallery';
import { getFeatured } from '@/lib/artworks';
import { toEngine } from '@/lib/toEngine';
import { getAbout } from '@/lib/siteText';
import { SITE } from '@/lib/site';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Meet the artist',
  description: 'Meet Mark Staples: a 70s council estate kid who found peace in graffiti and art, now with work in Brighton galleries, bars, cafes and on walls across the UK.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const [artworks, ABOUT] = await Promise.all([getFeatured(), getAbout()]);
  const text = (p: string) => p.replace('{influences}', ABOUT.influences.join(', '));
  const person = { '@context': 'https://schema.org', '@type': 'Person', name: 'Mark Staples', alternateName: 'MS11', jobTitle: 'Artist', sameAs: ['https://www.instagram.com/marky_s11/'], url: `${SITE.url}/about`, description: ABOUT.paragraphs.map(text).join(' ') };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldHtml(person)} />
      <div className="sr-only">
        <h1>About Mark Staples</h1>
        {ABOUT.paragraphs.map((p) => <p key={p}>{text(p)}</p>)}
        <p>{ABOUT.signoff} MS11</p>
        <Link href="/work">See all work</Link>
      </div>
      <Gallery artworks={artworks.map(toEngine)} about={ABOUT} initialView="about" />
    </>
  );
}
