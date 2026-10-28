import type { Metadata } from 'next';
import Link from 'next/link';
import Gallery from '@/components/Gallery';
import { getFeatured } from '@/lib/artworks';
import { toEngine } from '@/lib/toEngine';
import { getAbout } from '@/lib/siteText';

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const { inspires } = await getAbout();
  return {
    title: 'Who inspires Mark Staples',
    description: `The artists who inspire Mark Staples: ${inspires.names.map((n) => n.name).join(', ')}.`,
    alternates: { canonical: '/influences' },
  };
}

export default async function InfluencesPage() {
  const [artworks, ABOUT] = await Promise.all([getFeatured(), getAbout()]);
  const INFLUENCES = ABOUT.inspires;
  return (
    <>
      <div className="sr-only">
        <h1>Who inspires Mark Staples</h1>
        <p>{INFLUENCES.intro}</p>
        <ul>{INFLUENCES.names.map((n) => <li key={n.name}>{n.name}{n.met ? ' (met)' : ''}</li>)}</ul>
        <Link href="/about">About Mark Staples</Link> <Link href="/work">See all work</Link>
      </div>
      <Gallery artworks={artworks.map(toEngine)} about={ABOUT} initialView="influences" />
    </>
  );
}
