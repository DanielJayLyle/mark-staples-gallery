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
  // zoom: double-tap or double-click to zoom in and out, pinch on phones, drag to look around when zoomed
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const pan = useRef<{ x: number; y: number; zx: number; zy: number } | null>(null);
  const lastTap = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const n = card.photos.length;

  useEffect(() => { setPhoto(0); setAsking(false); }, [index]);
  useEffect(() => { setZoom({ s: 1, x: 0, y: 0 }); }, [index, photo]);
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
  function toggleZoom(cx: number, cy: number) {
    if (zoom.s > 1) { setZoom({ s: 1, x: 0, y: 0 }); return; }
    const r = stageRef.current!.getBoundingClientRect(), s = 2.5;
    // zoom in on the point that was tapped
    setZoom({ s, x: (r.left + r.width / 2 - cx) * (s - 1), y: (r.top + r.height / 2 - cy) * (s - 1) });
  }
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
        <div ref={stageRef} className={'lb-stage' + (zoom.s > 1 ? ' zoomed' : '')}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button,video')) return;
            pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pts.current.size === 2) {
              const [a, b] = [...pts.current.values()];
              pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: zoom.s }; start.current = null; pan.current = null; setGesturing(true);
            } else if (zoom.s > 1) { pan.current = { x: e.clientX, y: e.clientY, zx: zoom.x, zy: zoom.y }; setGesturing(true); }
            else start.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={(e) => {
            if (!pts.current.has(e.pointerId)) return;
            pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pinch.current && pts.current.size >= 2) {
              const [a, b] = [...pts.current.values()];
              const s = Math.min(4, Math.max(1, pinch.current.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d));
              setZoom((z) => (s === 1 ? { s: 1, x: 0, y: 0 } : { ...z, s }));
            } else if (pan.current) {
              const p0 = pan.current; setZoom((z) => ({ ...z, x: p0.zx + (e.clientX - p0.x), y: p0.zy + (e.clientY - p0.y) }));
            }
          }}
          onPointerUp={(e) => {
            pts.current.delete(e.pointerId);
            if (pts.current.size < 2) pinch.current = null;
            if (!pts.current.size) { pan.current = null; setGesturing(false); }
            const s = start.current; start.current = null; if (!s) return;
            const dx = e.clientX - s.x, dy = e.clientY - s.y;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { (n > 1 ? step(dx < 0 ? 1 : -1) : piece(dx < 0 ? 1 : -1)); return; }
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && e.pointerType !== 'mouse') {
              const now = performance.now();
              if (now - lastTap.current < 300) { toggleZoom(e.clientX, e.clientY); lastTap.current = 0; } else lastTap.current = now;
            }
          }}
          onPointerCancel={(e) => { pts.current.delete(e.pointerId); pinch.current = null; pan.current = null; start.current = null; setGesturing(false); }}
          onDoubleClick={(e) => { if (!(e.target as HTMLElement).closest('button,video')) toggleZoom(e.clientX, e.clientY); }}>
          {p.video
            ? <video key={p.url} src={p.url} poster={p.thumb} controls playsInline preload="metadata" />
            // eslint-disable-next-line @next/next/no-img-element
            : <img key={p.url} src={p.url} alt={p.alt || card.alt} width={p.width} height={p.height} draggable={false}
                style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`, transition: gesturing ? 'none' : 'transform .3s cubic-bezier(.2,.8,.2,1)' }} />}
          {!p.video && zoom.s === 1 && <span className="lb-zoomhint" aria-hidden="true">Double-tap to zoom</span>}
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
