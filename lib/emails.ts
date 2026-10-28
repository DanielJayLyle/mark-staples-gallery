/* Enquiry emails, in the site's style. Plain tables and inline styles so they look right in Gmail, Outlook and
   Apple Mail. Web fonts don't load in most inboxes, so headings fall back to Arial Black and body to Arial. */
import { SITE } from './site';

const RED = '#d8233d', BLUE = '#76ceff', INK = '#141312', INK2 = '#5d5a55', BG = '#f6f5f2';
const HEAD = "'Unbounded','Arial Black',Arial,sans-serif";
const BODY = "'Montserrat',Arial,Helvetica,sans-serif";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
// Outlook can't show WebP, so Sanity photos are asked for as JPEG
const abs = (u?: string) => (!u ? '' : u.startsWith('http') ? u.replace('fm=webp', 'fm=jpg') : SITE.url + u);

export type EnquiryPiece = { title: string; link: string; image?: string; status?: string } | null;

function frame(preheader: string, inner: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Mark Staples</title></head>
<body style="margin:0;padding:0;background:${BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e4de;">
<tr><td style="height:5px;line-height:5px;font-size:0;background:${RED};">&nbsp;</td><td style="height:5px;line-height:5px;font-size:0;background:${BLUE};width:30%;">&nbsp;</td></tr>
<tr><td colspan="2" style="padding:28px 32px 6px;"><a href="${SITE.url}"><img src="${SITE.url}/email/logo.png" width="176" height="39" alt="Mark Staples" style="display:block;border:0;"></a></td></tr>
${inner}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="padding:16px 32px;font:11px/1.6 ${BODY};letter-spacing:.12em;text-transform:uppercase;color:${INK2};" align="center">
<a href="${SITE.url}" style="color:${INK2};text-decoration:none;">${esc(SITE.url.replace(/^https?:\/\//, ''))}</a> &middot; <a href="https://www.instagram.com/marky_s11/" style="color:${INK2};text-decoration:none;">Instagram @marky_s11</a>
</td></tr></table>
</td></tr></table></body></html>`;
}

const row = (html: string, pad = '14px 32px') => `<tr><td colspan="2" style="padding:${pad};">${html}</td></tr>`;
const h1 = (t: string) => `<h1 style="margin:0;font:900 26px/1.15 ${HEAD};text-transform:uppercase;color:${INK};letter-spacing:-.01em;">${t}</h1>`;
const p = (t: string, extra = '') => `<p style="margin:0 0 12px;font:15px/1.65 ${BODY};color:${INK2};${extra}">${t}</p>`;
const btn = (href: string, label: string) => `<a href="${href}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font:700 12px/1 ${BODY};letter-spacing:.16em;text-transform:uppercase;padding:15px 24px;border-radius:999px;">${label}</a>`;

function pieceCard(piece: EnquiryPiece, cta: string) {
  if (!piece) return '';
  const img = abs(piece.image);
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece9e3;background:${BG};"><tr>
${img ? `<td width="120" style="padding:12px;"><a href="${piece.link}"><img src="${esc(img)}" width="110" alt="${esc(piece.title)}" style="display:block;width:110px;height:auto;border:0;"></a></td>` : ''}
<td style="padding:12px 14px 12px ${img ? '2px' : '14px'};vertical-align:middle;">
<div style="font:800 14px/1.3 ${HEAD};text-transform:uppercase;color:${INK};">${esc(piece.title)}</div>
${piece.status ? `<div style="font:12px/1.5 ${BODY};color:${INK2};margin-top:4px;">${esc(piece.status)}</div>` : ''}
<div style="margin-top:8px;"><a href="${piece.link}" style="font:700 12px/1 ${BODY};color:${INK};letter-spacing:.08em;">${cta} &rarr;</a></div>
</td></tr></table>`, '6px 32px 14px');
}

/** The email Mark gets. Reply goes straight to the visitor. */
export function toMark(o: { name: string; email: string; message: string; piece: EnquiryPiece; subject: string }) {
  const first = o.name.split(/\s+/)[0];
  const quote = esc(o.message || '(no message)').replace(/\n/g, '<br>');
  const reply = `mailto:${encodeURIComponent(o.email)}?subject=${encodeURIComponent('Re: ' + (o.piece ? o.piece.title : 'your enquiry'))}`;
  const html = frame(`${o.name} asked about ${o.piece ? o.piece.title : 'your work'}`, [
    row(h1('New enquiry'), '18px 32px 6px'),
    row(p(`<b style="color:${INK};">${esc(o.name)}</b> &middot; <a href="mailto:${esc(o.email)}" style="color:${INK};">${esc(o.email)}</a>`, 'margin:0;'), '6px 32px 4px'),
    pieceCard(o.piece, 'See the piece'),
    row(`<div style="border-left:4px solid ${RED};padding:4px 0 4px 16px;font:16px/1.65 ${BODY};color:${INK};">${quote}</div>`, '8px 32px 18px'),
    row(btn(reply, `Reply to ${esc(first)}`), '4px 32px 10px'),
    row(p('Or just hit reply: it goes straight to them. The enquiry is also saved in your Studio.', 'font-size:13px;'), '6px 32px 26px'),
  ].join(''));
  const text = `New enquiry\n\n${o.name} (${o.email})${o.piece ? `\nAbout: ${o.piece.title} ${o.piece.link}` : ''}\n\n${o.message}\n\nJust hit reply to answer them.`;
  return { subject: o.subject, html, text };
}

/** The thank-you the visitor gets. Replies go to Mark. */
export function toVisitor(o: { name: string; piece: EnquiryPiece }) {
  const first = o.name.split(/\s+/)[0];
  const about = o.piece ? ` about <b style="color:${INK};">${esc(o.piece.title)}</b>` : '';
  const html = frame(`Mark has your message and will reply personally.`, [
    row(h1(`Thanks, ${esc(first)}`), '18px 32px 8px'),
    row(p(`Your enquiry${about} has reached Mark. He reads every one himself and will reply personally, usually within a day or two.`)
      + p('If you think of anything else in the meantime, just reply to this email.'), '6px 32px 4px'),
    pieceCard(o.piece, 'See it again'),
    row(`<p style="margin:0;font:15px/1.6 ${BODY};color:${INK};">Peace and love always x<br><b>Mark Staples</b></p>`, '10px 32px 14px'),
    row(btn(`${SITE.url}/work`, 'Explore more work'), '6px 32px 30px'),
  ].join(''));
  const text = `Thanks, ${first}\n\nYour enquiry${o.piece ? ` about ${o.piece.title}` : ''} has reached Mark. He reads every one himself and will reply personally, usually within a day or two.\n\nIf you think of anything else, just reply to this email.\n\nPeace and love always x\nMark Staples\n${SITE.url}`;
  return { subject: `Thanks for your enquiry${o.piece ? ' about ' + o.piece.title : ''}`, html, text };
}
