'use client';
import { useState } from 'react';
import Lightbox from './Lightbox';
import type { Card } from '@/lib/cards';

/** Thumbnails of every photo of a piece on its own page; tapping one opens the lightbox. */
export default function PhotosButton({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);
  if (card.photos.length < 2) return null;
  return (
    <>
      <div className="art-photos">
        {card.photos.slice(0, 6).map((p, i) => (
          <button key={p.url} type="button" onClick={() => setOpen(true)} aria-label={`See all ${card.photos.length} photos`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumb || p.url} alt="" loading="lazy" />{i === 5 && card.photos.length > 6 && <span>+{card.photos.length - 6}</span>}
          </button>
        ))}
      </div>
      {open && <Lightbox cards={[card]} index={0} onIndex={() => {}} onClose={() => setOpen(false)} />}
    </>
  );
}
