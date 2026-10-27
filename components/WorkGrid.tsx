'use client';
import { useCallback, useEffect, useState } from 'react';
import Lightbox from './Lightbox';
import type { Card } from '@/lib/cards';

type Props = { cards: Card[]; limit?: number; expandLabel?: string; studio?: boolean; showCollection?: boolean };

/** A grid of pieces. Every card opens the lightbox; the link to a piece (#slug) reopens it. */
export default function WorkGrid({ cards, limit, expandLabel, studio = false, showCollection = false }: Props) {
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
              {c.photos.length > 1 && <span className="count" aria-hidden="true">{c.photos.length} photos</span>}
            </span>
            {!studio && (c.title || c.sold || c.statusText || (showCollection && c.collection)) && (
              <span className="meta">
                {c.title && <span className="t">{c.title}</span>}
                <span className="row">
                  {c.sold ? <span><span className="dot" aria-hidden="true" /> <b>Sold</b></span> : c.statusText ? <b>{c.statusText}</b> : <span />}
                  {showCollection && c.collection && <span>{c.collection}</span>}
                </span>
              </span>
            )}
            {studio && c.title && <span className="meta"><span className="t s">{c.title}</span></span>}
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
