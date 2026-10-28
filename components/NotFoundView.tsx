import Link from 'next/link';
import PageTop from './PageTop';
import SiteFoot from './SiteFoot';

/** The one 404 page, used for any unknown address and for pieces that no longer exist. */
export default function NotFoundView() {
  return (
    <div className="page nf">
      <PageTop />
      <main className="wrap nf-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tag.svg" alt="" width={120} height={84} className="nf-tag" />
        <p className="nf-code">404</p>
        <h1 className="big">Nothing hanging here</h1>
        <p className="lede">This page doesn&rsquo;t exist, or the piece has moved. Everything Mark has made is still a click away.</p>
        <div className="nf-links">
          <Link className="nf-btn solid" href="/">Walk the 3D gallery</Link>
          <Link className="nf-btn" href="/work">See all work</Link>
        </div>
      </main>
      <SiteFoot />
    </div>
  );
}
