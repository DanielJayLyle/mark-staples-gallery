'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import EnquiryForm from './EnquiryForm';
import type { Card } from '@/lib/cards';

type Props = { cards: Card[]; index: number; onClose: () => void; onIndex: (i: number) => void; studio?: boolean };

/** Full-screen viewer for one piece: every photo (swipe, arrows, thumbnails), what we know about it, and an enquiry form. */
export default function Lightbox({ cards, index, onClose, onIndex, studio = false }: Props) {
  const card = cards[index];
  const [photo, setPhoto] = useState(0);
  const [asking, setAsking] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const n = card.photos.length;

  useEffect(() => { setPhoto(0); setAsking(false); }, [index]);
  const step = useCallback((d: number) => setPhoto((p) => (p + d + n) % n), [n]);
  const piece = useCallback((d: number) => onIndex((index + d + cards.length) % cards.length), [index, cards.length, onIndex]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = ''; prev?.focus?.({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea')) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') (n > 1 ? step(1) : piece(1));
      else if (e.key === 'ArrowLeft') (n > 1 ? step(-1) : piece(-1));
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [n, step, piece, onClose]);

  const p = card.photos[photo];
  const label = card.title || (studio ? '' : 'Untitled');
  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={card.title || card.alt}>
      <div className="lb-top">
        <span className="lb-count">{cards.length > 1 ? `${index + 1} / ${cards.length}` : ''}</span>
        <div className="lb-pieces">
          {cards.length > 1 && <>
            <button type="button" className="nav" onClick={() => piece(-1)} aria-label="Previous piece"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg></button>
            <button type="button" className="nav" onClick={() => piece(1)} aria-label="Next piece"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
          </>}
          <button ref={closeRef} type="button" className="nav lb-close" onClick={onClose} aria-label="Close"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg></button>
        </div>
      </div>

      <div className="lb-body">
        <div className="lb-stage"
          onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={(e) => {
            const s = start.current; start.current = null; if (!s) return;
            const dx = e.clientX - s.x, dy = e.clientY - s.y;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) (n > 1 ? step(dx < 0 ? 1 : -1) : piece(dx < 0 ? 1 : -1));
          }}>
          {p.video
            ? <video key={p.url} src={p.url} poster={p.thumb} controls playsInline preload="metadata" />
            // eslint-disable-next-line @next/next/no-img-element
            : <img key={p.url} src={p.url} alt={p.alt || card.alt} width={p.width} height={p.height} draggable={false} />}
          {n > 1 && <>
            <button type="button" className="lb-arrow l" onClick={() => step(-1)} aria-label="Previous photo">‹</button>
            <button type="button" className="lb-arrow r" onClick={() => step(1)} aria-label="Next photo">›</button>
          </>}
        </div>

        <aside className="lb-info">
          {card.collection && !studio && <div className="lb-eyebrow">{card.collection}</div>}
          {label && <h2 className={card.title ? '' : 'untitled'}>{label}</h2>}
          {!studio && (card.sold || card.statusText) && <div className="lb-status">{card.sold && <span className="dot" aria-hidden="true" />}{card.sold ? 'Sold' : card.statusText}</div>}
          {card.note && <p className="lb-note">{card.note}</p>}
          {n > 1 && (
            <div className="lb-thumbs" role="tablist" aria-label="Photos of this piece">
              {card.photos.map((ph, i) => (
                <button key={ph.url} type="button" role="tab" aria-selected={i === photo} aria-label={`Photo ${i + 1}${ph.video ? ' (video)' : ''}`} onClick={() => setPhoto(i)} className={i === photo ? 'on' : ''}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.thumb || ph.url} alt="" loading="lazy" />{ph.video && <i aria-hidden="true">▶</i>}
                </button>
              ))}
            </div>
          )}
          {!studio && <>
            {card.page && <Link className="lb-more" href={`/work/${card.slug}`}>Full details &rarr;</Link>}
            {asking
              ? <EnquiryForm key={card.slug} slug={card.slug} title={card.title || 'this piece'} sold={card.sold} startOpen />
              : <button type="button" className="btn lb-ask" onClick={() => setAsking(true)}>{card.sold ? 'Ask about similar work' : 'Enquire about this piece'}</button>}
          </>}
        </aside>
      </div>
    </div>
  );
}
