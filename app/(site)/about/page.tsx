import type { Metadata } from 'next';
import Link from 'next/link';
import Gallery from '@/components/Gallery';
import { getFeatured } from '@/lib/artworks';
import { toEngine } from '@/lib/toEngine';
import { ABOUT } from '@/content/about';
import { SITE } from '@/lib/site';

export const revalidate = 60;
const text = (p: string) => p.replace('{influences}', ABOUT.influences.join(', '));
export const metadata: Metadata = {
  title: 'About Mark Staples',
  description: 'Meet Mark Staples: a 70s council estate kid from Bristol who found peace in graffiti and art, and now has work in Brighton galleries, bars, cafes and walls across the UK.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const artworks = await getFeatured();
  const person = { '@context': 'https://schema.org', '@type': 'Person', name: 'Mark Staples', alternateName: 'MS11', jobTitle: 'Artist', url: `${SITE.url}/about`, description: ABOUT.paragraphs.map(text).join(' ') };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
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
