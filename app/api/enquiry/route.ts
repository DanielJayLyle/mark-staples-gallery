import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { getArtwork } from '@/lib/artworks';
import { SITE, sanityConfig, formatPrice } from '@/lib/site';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

async function sendEmail(body: Record<string, unknown>) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

export async function POST(req: Request) {
  let data: Record<string, string>;
  try { data = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const name = String(data.name || '').trim().slice(0, 120);
  const email = String(data.email || '').trim().slice(0, 200);
  const message = String(data.message || '').trim().slice(0, 4000);
  const slug = String(data.slug || '').trim();

  // Spam trap: real people never fill the hidden "website" field
  if (data.website) return NextResponse.json({ ok: true });
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please add your name and a valid email address.' }, { status: 400 });

  const found = slug ? await getArtwork(slug) : null;
  const art = found?.artwork;
  const subject = art ? `Enquiry: ${art.title} (${art.status === 'sold' ? 'sold, similar work' : formatPrice(art.price)})` : 'New enquiry from the website';
  const link = art ? `${SITE.url}/work/${art.slug}` : SITE.url;

  let emailed = false, saved = false;
  const problems: string[] = [];

  if (process.env.RESEND_API_KEY && process.env.ENQUIRY_TO && process.env.ENQUIRY_FROM) {
    try {
      await sendEmail({
        from: process.env.ENQUIRY_FROM, to: process.env.ENQUIRY_TO, reply_to: email, subject,
        html: `<p><b>${esc(name)}</b> (${esc(email)}) asked about <a href="${link}">${esc(art?.title || 'your work')}</a>:</p><blockquote>${esc(message).replace(/\n/g, '<br>')}</blockquote><p>Just hit reply to answer them.</p>`,
      });
      await sendEmail({
        from: process.env.ENQUIRY_FROM, to: email, subject: `Thanks for your enquiry${art ? ' about ' + art.title : ''}`,
        html: `<p>Hi ${esc(name)},</p><p>Thanks for getting in touch${art ? ` about <a href="${link}">${esc(art.title)}</a>` : ''}. Mark will reply personally, usually within a day or two.</p><p>Mark Staples</p>`,
      });
      emailed = true;
    } catch (e) { problems.push('email'); console.error(e); }
  }

  if (sanityConfig.projectId && process.env.SANITY_API_WRITE_TOKEN) {
    try {
      const client = createClient({ ...sanityConfig, token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
      const ref = art ? await client.fetch<string | null>(`*[_type=="artwork" && slug.current==$slug][0]._id`, { slug: art.slug }) : null;
      await client.create({ _type: 'enquiry', name, email, message, status: 'new', receivedAt: new Date().toISOString(), artworkTitle: art?.title,
        ...(ref ? { artwork: { _type: 'reference', _ref: ref } } : {}) });
      saved = true;
    } catch (e) { problems.push('cms'); console.error(e); }
  }

  if (!emailed && !saved) {
    // Not configured yet (local demo) or both services failed
    console.log('[enquiry]', { name, email, slug, message });
    if (problems.length) return NextResponse.json({ error: 'Sorry, that did not send. Please try again in a minute.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, emailed, saved });
}
