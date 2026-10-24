'use client';
import { useEffect, useRef } from 'react';
import { MARKUP } from './gallery/markup';

type Props = { artworks: unknown[]; initialSlug?: string | null; openOnLoad?: boolean };

/** Mounts the 3D gallery. The engine is loaded on the client only, after the page's HTML has rendered. */
export default function Gallery({ artworks, initialSlug = null, openOnLoad = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.innerHTML = MARKUP;
    document.body.classList.add('is-gallery');
    let cleanup = () => {};
    let cancelled = false;
    import('./gallery/engine').then(({ mountGallery }) => {
      const piece = initialSlug ?? new URLSearchParams(location.search).get('piece');
      if (!cancelled) cleanup = mountGallery(el, { artworks, initialSlug: piece, openOnLoad });
    });
    return () => { cancelled = true; cleanup(); el.innerHTML = ''; document.body.classList.remove('is-gallery'); };
  }, [artworks, initialSlug, openOnLoad]);
  return <div ref={ref} />;
}
