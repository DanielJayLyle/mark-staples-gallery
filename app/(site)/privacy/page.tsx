import type { Metadata } from 'next';
import Link from 'next/link';
import PageTop from '@/components/PageTop';
import SiteFoot from '@/components/SiteFoot';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How the Mark Staples website uses the details you send in an enquiry.',
  alternates: { canonical: '/privacy' },
};

const UPDATED = '30 October 2026';

export default function Privacy() {
  return (
    <div className="page">
      <PageTop />
      <main className="wrap prose">
        <h1 className="big">Privacy</h1>
        <p className="lede">The short version: this site only collects what you type into an enquiry, uses it to reply to you, and never sells or shares it for marketing.</p>

        <h2>Who looks after your details</h2>
        <p>Mark Staples, the artist, is responsible for your details. The site is built and run for him by <a href="https://futurefaced.co.uk" target="_blank" rel="noopener">Future Faced</a>, who can access the site&rsquo;s systems to keep it working.</p>
        <p>To ask anything about your details, reply to any email you&rsquo;ve had from the site, or message Mark on <a href="https://www.instagram.com/marky_s11/" target="_blank" rel="noopener">Instagram @marky_s11</a>.</p>

        <h2>What we collect</h2>
        <p>When you send an enquiry: your name, your email address, your message and which piece you asked about. That&rsquo;s it. There are no accounts, no newsletter sign-up and no advertising trackers.</p>

        <h2>What it&rsquo;s used for</h2>
        <p>To reply to you about the piece, or about similar work and commissions if you asked. You also get one automatic email confirming that your enquiry arrived. The legal basis is Mark&rsquo;s legitimate interest in answering people who contact him, and taking steps you&rsquo;ve asked for before a possible sale.</p>

        <h2>Who handles it for us</h2>
        <ul>
          <li><b>Resend</b> sends the enquiry emails.</li>
          <li><b>Sanity</b> stores a copy of each enquiry so Mark can keep track of them.</li>
          <li><b>Cloudflare Turnstile</b> checks that a form is being sent by a person, not a bot. It looks at technical signals from your browser and doesn&rsquo;t track you across other sites.</li>
          <li><b>Vercel</b> hosts the website and keeps short-lived technical logs, such as IP addresses, to keep it secure and running. Its visitor statistics count page views without cookies and without identifying you.</li>
        </ul>
        <p>Some of these companies are based in, or use servers in, the United States. They protect UK data with the safeguards UK law requires for international transfers.</p>

        <h2>How long we keep it</h2>
        <p>Only as long as needed to deal with your enquiry and any sale that follows, then it&rsquo;s deleted. You can ask for it to be deleted sooner at any time.</p>

        <h2>Cookies</h2>
        <p>The site doesn&rsquo;t set advertising or tracking cookies. Fonts are hosted on this site, so loading a page doesn&rsquo;t send anything to Google. The spam check may use what it needs to tell a person from a bot, only when you open an enquiry form.</p>

        <h2>Your rights</h2>
        <p>Under UK data protection law you can ask to see the details held about you, have them corrected or deleted, or object to how they&rsquo;re used. Just get in touch as above. If you&rsquo;re unhappy with the answer, you can complain to the <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener">Information Commissioner&rsquo;s Office</a>.</p>

        <p className="prose-meta">Last updated {UPDATED}. <Link href="/work">Back to all work</Link></p>
      </main>
      <SiteFoot />
    </div>
  );
}
