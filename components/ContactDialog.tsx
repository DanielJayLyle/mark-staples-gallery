'use client';
import { useEffect, useRef, useState } from 'react';
import { mountTurnstile } from './turnstile';

const TOPICS = [
  { id: 'commission', label: 'A commission' },
  { id: 'buying', label: 'Buying a piece' },
  { id: 'other', label: 'Something else' },
];
const PROMPT: Record<string, string> = {
  commission: 'What would you like Mark to make? Size, colours, where it will go, any ideas you have.',
  buying: 'Which piece caught your eye?',
  other: 'Your message',
};

/** "Get in touch": one pop-up for the whole site. Any link to #contact (or with data-contact) opens it. */
export default function ContactDialog() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('commission');
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; msg?: string }>({ status: 'idle' });
  const box = useRef<HTMLDivElement>(null);
  const tsEl = useRef<HTMLDivElement>(null);
  const ts = useRef<ReturnType<typeof mountTurnstile> | null>(null);
  const back = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href="#contact"],[data-contact]');
      if (!a) return;
      e.preventDefault(); back.current = a as HTMLElement; setOpen(true);
    };
    const fromHash = () => { if (location.hash === '#contact') { setOpen(true); history.replaceState(null, '', location.pathname + location.search); } };
    document.addEventListener('click', onClick); window.addEventListener('hashchange', fromHash); fromHash();
    return () => { document.removeEventListener('click', onClick); window.removeEventListener('hashchange', fromHash); };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    box.current?.querySelector<HTMLElement>('input[name="name"]')?.focus({ preventScroll: true });
    if (tsEl.current && !ts.current) ts.current = mountTurnstile(tsEl.current);
    // keys pressed while focus is outside the pop-up (e.g. after sending) must not steer the 3D room behind it
    const key = (e: KeyboardEvent) => { if (box.current?.contains(e.target as Node)) return; e.stopPropagation(); if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', key, true);
    return () => { window.removeEventListener('keydown', key, true); document.documentElement.style.overflow = ''; back.current?.focus?.({ preventScroll: true }); };
  }, [open]);

  function close() { setOpen(false); if (state.status === 'done') { setState({ status: 'idle' }); ts.current = null; } }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState({ status: 'sending' });
    try {
      const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(f), topic, turnstile: ts.current?.token() || '' }) });
      const j = await r.json();
      if (r.ok) setState({ status: 'done', msg: `Thanks ${f.get('name')}. Mark has your message and will reply to ${f.get('email')} soon.` });
      else { ts.current?.reset(); setState({ status: 'error', msg: j.error }); }
    } catch { setState({ status: 'error', msg: 'Could not reach the server. Check your connection and try again.' }); }
  }

  if (!open) return null;
  return (
    <div className="cd" role="dialog" aria-modal="true" aria-labelledby="cd-title"
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') close(); }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="cd-box" ref={box}>
        <button type="button" className="nav cd-close" onClick={close} aria-label="Close"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg></button>
        <h2 id="cd-title">Get in touch</h2>
        <p className="cd-lede">Commissions, a piece you&rsquo;ve seen, or just to say hello. Mark replies personally.</p>
        {state.status === 'done'
          ? <div className="done">{state.msg}</div>
          : <form className="form" onSubmit={submit}>
              <div className="cd-topics" role="radiogroup" aria-label="What is it about?">
                {TOPICS.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={topic === t.id} className={'chip' + (topic === t.id ? ' on' : '')} onClick={() => setTopic(t.id)}>{t.label}</button>
                ))}
              </div>
              <label>Your name<input name="name" required autoComplete="name" maxLength={80} /></label>
              <label>Email<input name="email" type="email" required autoComplete="email" /></label>
              <label className="hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              <label>Message<textarea name="message" rows={4} placeholder={PROMPT[topic]} /></label>
              <div ref={tsEl} />
              <p className="form-note">Mark uses your details only to reply. <a href="/privacy" target="_blank">Privacy</a></p>
              <div><button className="btn" type="submit" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Sending' : 'Send message'}</button></div>
              {state.status === 'error' && <div className="done">{state.msg}</div>}
            </form>}
        <p className="cd-alt">Or message Mark on <a href="https://www.instagram.com/marky_s11/" target="_blank" rel="noopener">Instagram @marky_s11</a></p>
      </div>
    </div>
  );
}
