/** Search snippets: Google shows roughly 155 characters, so longer text is cut at a word with an ellipsis. */
export function clip(s: string, n = 155) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n - 1); return cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 30)).replace(/[,.;:]$/, '') + '…';
}
/** How Mark is introduced in search results */
export const WHO = 'Southampton street pop artist Mark Staples';
