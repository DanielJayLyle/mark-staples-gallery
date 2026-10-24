import Link from 'next/link';
export default function NotFound() { return <main className="wrap"><h1 className="big">Not on the wall</h1><p className="lede">That piece has moved or the link is wrong.</p><Link className="chip" href="/work">See all work</Link></main>; }
