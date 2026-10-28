import Link from 'next/link';
import './gallery.css';
import './site.css';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/unbounded';

export default function NotFound() {
  return (
    <div className="page nf">
      <main className="wrap nf-wrap">
        <img src="/tag.svg" alt="" width={120} height={84} className="nf-tag" />
        <h1 className="big">Wrong wall</h1>
        <p className="lede">This page has been painted over. The work you're after is probably in the gallery.</p>
        <div className="nf-links">
          <Link className="btn" href="/">Walk the 3D gallery</Link>
          <Link className="chip" href="/work">See all work</Link>
        </div>
      </main>
    </div>
  );
}
