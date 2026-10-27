'use client';
import { useEffect, useRef, useState } from 'react';

/** Sticky pill menu for All Work: highlights the section you're in and keeps that pill in view. */
export default function JumpPills({ items }: { items: { id: string; label: string }[] }) {
  const [on, setOn] = useState(items[0]?.id);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setOn(vis.target.id);
    }, { rootMargin: '-90px 0px -60% 0px' });
    items.forEach((i) => { const el = document.getElementById(i.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [items]);
  useEffect(() => {
    const a = nav.current?.querySelector<HTMLAnchorElement>(`a[href="#${on}"]`);
    if (a && nav.current) nav.current.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
  }, [on]);
  return (
    <nav ref={nav} className="arch-jump arch-bar" aria-label="Collections">
      {items.map((i) => <a key={i.id} href={`#${i.id}`} className={i.id === on ? 'on' : ''} aria-current={i.id === on ? 'true' : undefined}>{i.label}</a>)}
    </nav>
  );
}
