/* Temporary password wall for the preview period. On only while SITE_PASSWORD is set in Vercel:
   delete that variable and redeploy to open the site to everyone. */
export const COOKIE = 'ms_preview';
export async function passHash(pw: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ms11:' + pw.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
