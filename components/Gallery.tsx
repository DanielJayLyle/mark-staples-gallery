'use client';
import { useEffect, useRef } from 'react';
import { MARKUP } from './gallery/markup';

import type { AboutContent } from '@/content/about';

type Props = { artworks: unknown[]; initialSlug?: string | null; openOnLoad?: boolean; about?: AboutContent; initialView?: 'gallery' | 'about' };

/** Mounts the 3D gallery. The engine is loaded on the client only, after the page's HTML has rendered. */
export default function Gallery({ artworks, initialSlug = null, openOnLoad = false, about, initialView = 'gallery' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.innerHTML = MARKUP;
    document.body.classList.add('is-gallery');
    let cleanup = () => {};
    let cancelled = false;
    import('./gallery/engine').then(({ mountGallery }) => {
      const piece = initialSlug ?? new URLSearchParams(location.search).get('piece');
      if (!cancelled) cleanup = mountGallery(el, { artworks, initialSlug: piece, openOnLoad, about, initialView });
    });
    return () => { cancelled = true; cleanup(); el.innerHTML = ''; document.body.classList.remove('is-gallery'); };
  }, [artworks, initialSlug, openOnLoad, about, initialView]);
  return <div ref={ref} />;
}
