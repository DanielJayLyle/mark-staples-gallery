/* Cloudflare Turnstile: an invisible spam check on the enquiry forms. Does nothing until
   NEXT_PUBLIC_TURNSTILE_SITE_KEY is set in Vercel, so the forms work either way. */
export const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
let loading = null;
function load() {
  if (!TURNSTILE_KEY || typeof window === 'undefined') return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading) loading = new Promise((res) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true;
    s.onload = () => res(window.turnstile || null); s.onerror = () => res(null);
    document.head.appendChild(s);
  });
  return loading;
}
/** Mounts the check inside `el`; returns a function that gives the current token ('' if none). */
export function mountTurnstile(el) {
  let token = '', id = null;
  load().then((ts) => {
    if (!ts || !el.isConnected) return;
    id = ts.render(el, { sitekey: TURNSTILE_KEY, appearance: 'interaction-only', callback: (t) => { token = t; }, 'expired-callback': () => { token = ''; } });
  });
  return { token: () => token, reset: () => { token = ''; if (id != null && window.turnstile) window.turnstile.reset(id); } };
}
