import Link from 'next/link';
export default function PageTop() {
  return (
    <header className="page-top">
      <Link className="brand" href="/" aria-label="Mark Staples, walk the gallery">
        <img src="/tag.svg" alt="" width={54} height={38} /><span>MARK<br />STAPLES</span>
      </Link>
      <nav><Link className="navlink" href="/about">About</Link><Link className="navlink" href="/work">All work</Link><Link className="chip" href="/">3D gallery</Link></nav>
    </header>
  );
}
