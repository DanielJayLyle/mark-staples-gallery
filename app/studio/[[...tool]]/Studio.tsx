'use client';
import { NextStudio } from 'next-sanity/studio';
import config from '../../../sanity.config';
export default function Studio() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return <main style={{ fontFamily: 'system-ui', padding: 40, maxWidth: 560 }}><h1>Studio not connected yet</h1><p>Create a free Sanity project, then set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> in Vercel. Mark will then manage artworks and enquiries here at <code>/studio</code>.</p></main>;
  }
  return <NextStudio config={config} />;
}
