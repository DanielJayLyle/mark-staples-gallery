'use client';
import { useCallback, useEffect, useState } from 'react';
import Lightbox from './Lightbox';
import type { Card } from '@/lib/cards';

type Props = { cards: Card[]; limit?: number; expandLabel?: string; studio?: boolean };

/** A grid of pieces. Every card opens the lightbox; the link to a piece (#slug) reopens it. */
export default function WorkGrid({ cards, limit, expandLabel, studio = false }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const shown = limit && !all ? cards.slice(0, limit) : cards;

  const show = useCallback((i: number | null) => {
    setOpen(i);
    const url = location.pathname + location.search + (i == null ? '' : '#' + cards[i].slug);
    history.replaceState(history.state, '', url);
  }, [cards]);

  useEffect(() => {
    const fromHash = () => { const i = cards.findIndex((c) => '#' + c.slug === location.hash); if (i >= 0) { if (limit && i >= limit) setAll(true); setOpen(i); } };
    fromHash(); window.addEventListener('hashchange', fromHash); return () => window.removeEventListener('hashchange', fromHash);
  }, [cards, limit]);

  return (
    <>
      <div className={studio ? 'studio-strip' : 'work-grid'}>
        {shown.map((c, i) => (
          <button key={c.slug} id={c.slug} type="button" className="work-card" onClick={() => show(i)} aria-label={`Open ${c.title || (studio ? c.alt : 'untitled piece')}${c.photos.length > 1 ? `, ${c.photos.length} photos` : ''}`}>
            <span className="thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.photos[0].thumb || c.photos[0].url} alt={c.alt} width={c.photos[0].width} height={c.photos[0].height} loading="lazy" decoding="async" />
              {c.photos.length > 1 && <span className="count" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1.5" y="4.5" width="10" height="10" rx="1.5" /><path d="M4.5 1.5h8.5a1.5 1.5 0 0 1 1.5 1.5v8.5" /></svg>{c.photos.length}</span>}
            </span>
            {!studio && (c.title || c.sold) && (
              <span className="meta">
                {c.title && <span className="t">{c.title}</span>}
                {c.sold && <span className="row"><span><span className="dot" aria-hidden="true" /> Sold</span></span>}
              </span>
            )}
          </button>
        ))}
      </div>
      {limit && cards.length > limit && (
        <button type="button" className="chip arch-more" onClick={() => setAll((v) => !v)} aria-expanded={all}>{all ? 'Show fewer' : expandLabel || `Show all ${cards.length}`}</button>
      )}
      {open != null && <Lightbox cards={cards} index={open} onIndex={(i) => show(i)} onClose={() => show(null)} studio={studio} />}
    </>
  );
}
