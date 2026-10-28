# Mark Staples gallery: briefing for Claude

Read this before changing anything. The README explains the project for people; this file holds the decisions and rules.

## Who and what

- Site for the artist **Mark Staples** (Instagram @marky_s11), built and run by **Dan at Future Faced**. Dan asks for changes; Mark edits content in the Studio.
- Domain: markys11.co.uk (DNS at GoDaddy). Live on Vercel (Future Faced account, project `ff-9dec`) at `mark-staples-gallery-ashen.vercel.app` until the domain is connected.
- Stack: Next.js 14 App Router, Three.js **r128** (do not upgrade, the engine depends on it), Sanity (content), Resend (email), Cloudflare Turnstile (spam), Vercel (hosting).

## Workflow (always)

1. Work on the `dev` branch. Push there; Vercel builds a preview at `mark-staples-gallery-git-dev-ff-9dec.vercel.app` (behind the Vercel login).
2. Run `npx tsc --noEmit -p .` and `npm run build` before pushing.
3. Dan checks the preview on desktop and phone. Only merge `dev` into `main` when he says "push to live". `main` deploys the live site.
4. Never force-push `main`. A safe copy of the site before the graffiti feature is on the branch `save-v1-before-graffiti`.
5. Dependabot opens weekly minor/patch PRs into `dev`; majors and `three` are ignored on purpose.

## Writing rules

- **No em dashes** anywhere: copy, alt text, emails, commit messages. Use commas, colons or full stops.
- UK spelling. Plain, warm, short. Nothing that sounds unfinished or placeholder ("coming soon", "stand-in", etc.).
- Only state facts we know about Mark's work. No invented titles, years, prices, stories or sizes.

## Brand

- Colours: red `#d8233d`, blue `#76ceff` (darker blue `#4fb4ec` for signs). No pink.
- Fonts: **Unbounded** for headings (caps), **Montserrat** for body. Bernoru was dropped for licence reasons; don't bring it back.
- Logo: `public/logo-full.svg` (full lockup, desktop header) and the tag icon (mobile). The symbol viewBox is `0 0 970 680`.
- Footer credit: "Site by Future Faced", a normal link, no arrow.

## What lives where

**Sanity (Mark edits, no code change needed):** pieces and photos, collections, venues, the 3D room list (up to 15, hand-ordered), About wall and influences ceiling text (`siteText` singleton), enquiries.
**Code (ask Claude):** layout, design, colours, the 3D engine, About photos (`content/about.ts`, `public/about`), influences photos (`content/influences.ts`), behind-the-scenes strip (`content/archive.json` studio).

- Every Sanity read falls back to the local content in `content/` if Sanity is empty or unreachable, so the site never goes blank.
- The dataset is **private** (it stores enquiries). The site reads with `SANITY_API_READ_TOKEN`; enquiries write with `SANITY_API_WRITE_TOKEN`.
- `featured` is computed from the room document, not stored on the piece.
- A piece gets its own page only if it has details (`hasPage` in `lib/artworks.ts`); otherwise `/work/<slug>` redirects to its collection and opens in the lightbox.
- Untitled pieces get names like "Doodle #12" from their collection (`nameUntitled`); the number comes from the slug.
- Recent = added in the last 12 months (`addedAt`). Collections sort by `rank` (Lead order) then newest.
- `sizeEstimated` sizes are used by the 3D room but never shown to visitors.

## The 3D engine (`components/gallery/engine.js`)

- One big file, `mountGallery(root, opts)`; markup in `components/gallery/markup.js`. Test changes visually (Playwright with swiftshader works in the cloud workspace).
- **Graffiti after hours:** builds through the visitor's own day and is cleaned at 6am. Coverage: none 6 to 10am, then rising to full by 10pm, full overnight. Night lighting ramps 5 to 7pm. Preview any hour with `?time=HH`. No manual switch (Dan removed it). Words only from t ≥ .3. No paste-ups or white patches behind art; signs and text stay readable via `cleanZones` fades. The intro waits for the graffiti (max 4s) so it doesn't pop in.
- Seeded random: `seed()` can return negatives; use `Math.abs(...)+7` for anything that must be positive.
- Influences ceiling has 19 placed slots plus 5 spares, so 24 names maximum.
- After `npm run build`, start `next start` on a fresh port; an old server serves stale chunks. Don't `pkill -f "next start"` (it kills the shell); kill by port.

## Environment variables (Vercel)

`RESEND_API_KEY`, `ENQUIRY_FROM` (`Mark Staples <enquiries@markys11.co.uk>`), `ENQUIRY_TO`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID` (`lymhtovz`), `NEXT_PUBLIC_SANITY_DATASET` (`production`), `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`, optional `SANITY_REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL` once the domain is live. Keys are created and pasted into Vercel by Dan; they never go in chat or in the repo.
