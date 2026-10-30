import type { Metadata } from 'next';
import Link from 'next/link';
import Gallery from '@/components/Gallery';
import { getFeatured } from '@/lib/artworks';
import { toEngine } from '@/lib/toEngine';
import { getAbout } from '@/lib/siteText';
import { WHO } from '@/lib/seo';

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const { inspires } = await getAbout();
  return {
    title: { absolute: 'Who inspires Mark Staples' },
    // the people he has met first, then as many others as fit in a search snippet
    description: (() => {
      const list = [...inspires.names.filter((n) => n.met), ...inspires.names.filter((n) => !n.met)].map((n) => n.name);
      let out = `The artists who inspire ${WHO}: ${list[0]}`;
      for (const n of list.slice(1)) { if ((out + ', ' + n + ' and more.').length > 155) break; out += ', ' + n; }
      return out + ' and more.';
    })(),
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
