'use client';
import { useEffect, useRef, useState } from 'react';
import { mountTurnstile } from './turnstile';

export default function EnquiryForm({ slug, title, sold, startOpen = false }: { slug: string; title: string; sold: boolean; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; msg?: string }>({ status: 'idle' });
  const tsEl = useRef<HTMLDivElement>(null); const ts = useRef<ReturnType<typeof mountTurnstile> | null>(null);
  useEffect(() => { if (open && tsEl.current && !ts.current) ts.current = mountTurnstile(tsEl.current); }, [open]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState({ status: 'sending' });
    try {
      const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...Object.fromEntries(f), slug, turnstile: ts.current?.token() || '' }) });
      const j = await r.json();
      setState(r.ok ? { status: 'done', msg: `Thanks ${f.get('name')}. Mark has your enquiry about ${title === 'this piece' ? title : `"${title}"`} and will reply to ${f.get('email')} soon.` } : (ts.current?.reset(), { status: 'error', msg: j.error }));
    } catch { setState({ status: 'error', msg: 'Could not reach the server. Check your connection and try again.' }); }
  }
  if (state.status === 'done') return <div className="done">{state.msg}</div>;
  if (!open) return <div className="cta"><button className="btn" type="button" onClick={() => setOpen(true)}>{sold ? 'Ask about similar work' : 'Enquire about this piece'}</button></div>;
  return (
    <form className="form" onSubmit={submit}>
      <label>Your name<input name="name" required autoComplete="name" /></label>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label className="hp" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label>Message<textarea name="message" defaultValue={(() => { const t = title === 'this piece' ? title : `"${title}"`; return sold ? `Hi, I love ${t}. Do you have anything similar available, or take commissions?` : `Hi, I'm interested in ${t}. Is it available?`; })()} /></label>
      <div ref={tsEl} />
      <p className="form-note">Mark uses your details only to reply. <a href="/privacy" target="_blank">Privacy</a></p>
      <div><button className="btn" type="submit" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Sending' : 'Send enquiry'}</button></div>
      {state.status === 'error' && <div className="done">{state.msg}</div>}
    </form>
  );
}
