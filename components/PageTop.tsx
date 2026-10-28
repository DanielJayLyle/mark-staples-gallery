import Link from 'next/link';
/** Header for the normal pages. Same classes, fonts and sizes as the gallery's header; it just isn't fixed over a 3D room. */
export default function PageTop() {
  return (
    <header className="page-top">
      <Link className="brand" href="/" aria-label="Mark Staples, walk the gallery">
        <img className="brand-icon" src="/tag.svg" alt="" width={54} height={38} /><img className="brand-full" src="/logo-full.svg" alt="" width={1528} height={339} />
      </Link>
      <nav className="top-r" aria-label="Main">
        <Link className="navlink" href="/about">About</Link>
        <Link className="navlink" href="/influences">Influences</Link>
        <Link className="chip" href="/">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M8 1.5 14 4.8v6.4L8 14.5 2 11.2V4.8z" /><path d="M2 4.8 8 8l6-3.2M8 8v6.5" /></svg>
          <span>3D gallery</span>
        </Link>
      </nav>
    </header>
  );
}
