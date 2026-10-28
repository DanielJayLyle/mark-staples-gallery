import type { Metadata } from 'next';
import '../gallery.css';
import '../site.css';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/unbounded';

export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

export default function Preview({ searchParams }: { searchParams: { next?: string; wrong?: string } }) {
  return (
    <div className="page nf pv">
      <main className="wrap nf-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tag.svg" alt="Mark Staples" width={120} height={84} className="nf-tag" />
        <p className="nf-code">Preview</p>
        <h1 className="big">Almost ready</h1>
        <p className="lede">Mark&rsquo;s new site is being finished. Enter the password to take a look.</p>
        <form className="pv-form" method="post" action="/api/preview">
          <input type="hidden" name="next" value={searchParams.next || '/'} />
          <input className="pv-input" name="password" type="password" placeholder="Password" aria-label="Password" autoFocus required autoComplete="current-password" />
          <button className="nf-btn solid" type="submit">Enter</button>
        </form>
        {searchParams.wrong && <p className="pv-wrong" role="alert">That&rsquo;s not it. Try again.</p>}
        <p className="pv-insta">In the meantime: <a href="https://www.instagram.com/marky_s11/" target="_blank" rel="noopener">Instagram @marky_s11</a></p>
      </main>
    </div>
  );
}
