'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Artwork, Collection } from '@/lib/types';

type Group = { collection: Collection; artworks: Artwork[] };
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'onshow', label: 'On show' },
  { key: 'sold', label: 'Sold' },
] as const;
const PER_SECTION = 8;
import { priceOrStatus } from '@/lib/site';

export default function Archive({ groups }: { groups: Group[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const match = (a: Artwork) =>
    filter === 'all' ? true : filter === 'sold' ? a.status === 'sold' : filter === 'onshow' ? !!a.currentVenue && a.status !== 'sold' : a.status === 'available' || a.status === 'reserved';
  const shown = useMemo(() => groups.map((g) => ({ ...g, artworks: g.artworks.filter(match) })).filter((g) => g.artworks.length), [groups, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = shown.reduce((n, g) => n + g.artworks.length, 0);

  return (
    <>
      <div className="arch-bar" role="toolbar" aria-label="Filter and jump to a section">
        <div className="arch-filters">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={'pill' + (filter === f.key ? ' on' : '')} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
          <span className="arch-count">{total} pieces</span>
        </div>
        <nav className="arch-jump" aria-label="Sections">
          {shown.map((g) => <a key={g.collection.slug} href={`#${g.collection.slug}`}>{g.collection.title} <span>{g.artworks.length}</span></a>)}
        </nav>
      </div>

      {shown.map((g) => {
        const all = open[g.collection.slug];
        const list = all ? g.artworks : g.artworks.slice(0, PER_SECTION);
        return (
          <section key={g.collection.slug} id={g.collection.slug} className="arch-section">
            <header className="arch-head">
              <h2>{g.collection.title}</h2>
              {g.collection.blurb && <p>{g.collection.blurb}</p>}
            </header>
            <div className="work-grid">
              {list.map((a) => (
                <Link key={a.slug} className="work-card" href={`/work/${a.slug}`}>
                  <div className="thumb"><Image src={a.image.url} alt={a.image.alt || a.title} width={a.image.width} height={a.image.height} sizes="(max-width: 820px) 50vw, 25vw" /></div>
                  <h3>{a.title}</h3>
                  <div className="row">
                    {a.status === 'sold' ? <span><span className="dot" aria-hidden="true" /> <b>Sold</b></span> : <b>{priceOrStatus(a)}</b>}
                    <span>{a.kind}</span>
                  </div>
                </Link>
              ))}
            </div>
            {g.artworks.length > PER_SECTION && (
              <button type="button" className="chip arch-more" onClick={() => setOpen((o) => ({ ...o, [g.collection.slug]: !all }))}>
                {all ? 'Show fewer' : `Show all ${g.artworks.length} in ${g.collection.title}`}
              </button>
            )}
          </section>
        );
      })}
    </>
  );
}
