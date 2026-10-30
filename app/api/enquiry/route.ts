import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { getArtwork, hasPage } from '@/lib/artworks';
import { SITE, sanityConfig, statusText } from '@/lib/site';

import { toMark, toVisitor } from '@/lib/emails';

async function sendEmail(body: Record<string, unknown>) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

export async function POST(req: Request) {
  let data: Record<string, string>;
  try { data = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const name = String(data.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const email = String(data.email || '').trim().slice(0, 200);
  const message = String(data.message || '').trim().slice(0, 4000);
  const slug = String(data.slug || '').trim();
  // general messages from the contact pop-up say what they're about
  const TOPICS: Record<string, string> = { commission: 'Commission', buying: 'Buying a piece', other: 'Something else' };
  const topic = TOPICS[String(data.topic || '')] || '';

  // Spam trap: real people never fill the hidden "website" field
  if (data.website) return NextResponse.json({ ok: true });
  if (process.env.TURNSTILE_SECRET_KEY) {
    const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: String(data.turnstile || '') }) })
      .then((r) => r.json()).catch(() => ({ success: false }));
    if (!v.success) return NextResponse.json({ error: 'Please wait a second for the spam check, then send again.' }, { status: 400 });
  }
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please add your name and a valid email address.' }, { status: 400 });
  // the name goes into a thank-you email sent to whatever address was typed, so it can't carry links
  if (/https?:|www\.|\.(com|net|org|ru|xyz|io|co)\b|[<>]/i.test(name)) return NextResponse.json({ error: 'Please just add your name in the name box.' }, { status: 400 });

  const found = slug ? await getArtwork(slug) : null;
  const art = found?.artwork;
  const label = art ? (art.title || `an untitled piece (${art.collection?.title || 'All work'})`) : '';
  const subject = art ? `Enquiry: ${label} (${art.status === 'sold' ? 'sold, asking about similar work' : (statusText(art) || 'status not set')})` : topic === 'Commission' ? 'Commission enquiry from the website' : `New message from the website${topic ? ` (${topic.toLowerCase()})` : ''}`;
  const link = art ? (hasPage(art) ? `${SITE.url}/work/${art.slug}` : `${SITE.url}/work/${art.collection?.slug || ''}#${art.slug}`) : SITE.url;

  let emailed = false, saved = false;
  const problems: string[] = [];

  if (process.env.RESEND_API_KEY && process.env.ENQUIRY_TO && process.env.ENQUIRY_FROM) {
    try {
      const piece = art ? { title: label, link, image: art.photos?.find((ph) => !ph.video)?.thumb || art.image?.url, status: art.status === 'sold' ? 'Sold' : statusText(art) } : null;
      const m = toMark({ name, email, message, piece, subject, topic });
      await sendEmail({ from: process.env.ENQUIRY_FROM, to: process.env.ENQUIRY_TO, reply_to: email, subject: m.subject, html: m.html, text: m.text });
      const v = toVisitor({ name, piece, topic });
      await sendEmail({ from: process.env.ENQUIRY_FROM, to: email, reply_to: process.env.ENQUIRY_TO, subject: v.subject, html: v.html, text: v.text });
      emailed = true;
    } catch (e) { problems.push('email'); console.error(e); }
  }

  if (sanityConfig.projectId && process.env.SANITY_API_WRITE_TOKEN) {
    try {
      const client = createClient({ ...sanityConfig, token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false, perspective: 'published' });
      const ref = art ? await client.fetch<string | null>(`*[_type=="artwork" && slug.current==$slug][0]._id`, { slug: art.slug }) : null;
      await client.create({ _type: 'enquiry', name, email, message, status: 'new', receivedAt: new Date().toISOString(), artworkTitle: label || undefined, topic: topic || undefined,
        ...(ref ? { artwork: { _type: 'reference', _ref: ref } } : {}) });
      saved = true;
    } catch (e) { problems.push('cms'); console.error(e); }
  }

  if (!emailed && !saved) {
    // Not configured yet (local demo) or both services failed
    console.log('[enquiry]', { name, email, slug, message });
    if (problems.length) return NextResponse.json({ error: 'Sorry, that did not send. Please try again in a minute.' }, { status: 502 });
    // nothing is connected yet: say so rather than pretending it was sent
    return NextResponse.json({ error: 'Online enquiries are being switched on this week. For now, please message Mark on Instagram: @marky_s11' }, { status: 503 });
  }
  return NextResponse.json({ ok: true, emailed, saved });
}
