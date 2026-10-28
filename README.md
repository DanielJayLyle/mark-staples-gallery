# Mark Staples gallery

A 3D gallery website for Mark Staples, built with Next.js. Visitors walk a lit gallery wall, open any piece, and send an enquiry. Every artwork also has its own page so the site can rank on Google.

## What's in here

| Part | Where | What it does |
|---|---|---|
| 3D gallery | `components/gallery/engine.js` | The room, lights, drips, labels, detail pop-up and grid. Ported from the approved prototype. |
| Home page | `app/(site)/page.tsx` | Loads the artworks and mounts the gallery. Includes readable text and links for Google. |
| Artwork pages | `app/(site)/work/[slug]/page.tsx` | One page per piece at `/work/<slug>`, with title, description, social preview image and artwork structured data. |
| All work | `app/(site)/work/page.tsx` | A plain, crawlable grid of every piece. |
| Enquiries | `app/api/enquiry/route.ts` | Emails Mark (and a thank-you to the buyer) through Resend, and saves the enquiry in the CMS. Has a hidden spam trap. |
| CMS | `/studio`, `sanity/schemaTypes` | Sanity Studio built into the site. Mark adds work, sets prices and status, and sees enquiries here. |
| Local content | `content/seed.ts`, `content/archive.json`, `public/work`, `public/art` | Mark's real pieces, used until Sanity is connected. `archive.json` was generated from his photo folders; `public/art` holds the cut-outs for the 3D room. |
| SEO | `app/sitemap.ts`, `app/robots.ts` | Sitemap and robots file, generated from the artworks. |

When a piece opens in the gallery, the address bar changes to `/work/<slug>`, and the browser back button closes it. Anyone arriving at that link directly gets the full artwork page, with a "Walk the gallery from here" link that drops them into the room at that piece (`/?piece=<slug>`).

## Live and dev versions

- `main` is the live site. Only merge into it when a change has been checked.
- `dev` is the working version. Every push to `dev` gets its own Vercel preview link, which is private to your Vercel account (Settings, Deployment Protection) and hidden from Google (`robots.txt` blocks everything outside production).
- To release: open a pull request from `dev` into `main` on GitHub and merge it. Vercel deploys the live site automatically.

## Content while building

- Sizes for the pieces in the 3D room are estimates (`sizeEstimated`) and are hidden from visitors until Mark confirms them.
- Recent is automatic: everything added in the last 12 months. Each piece has one home collection.
- `content/about.ts` holds Mark's bio for the About wall.
- The 3D room shows up to 15 pieces marked "Hang in the 3D gallery"; everything else lives on All work, grouped by section.

## Run it on your computer

Needs Node.js 18.17 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no settings it uses the local content and enquiries are printed to the terminal.

## Put it online (about 10 minutes)

1. **GitHub:** create a new private repository and push this folder to it.
2. **Vercel:** Add New, Project, import the repository, Deploy. You get a live link like `mark-staples-gallery.vercel.app`, already working with the local content.
3. **Domain:** in Vercel, Settings, Domains, add Mark's domain and copy the DNS records it shows into wherever the domain is managed (Krystal or otherwise). Email is unaffected.

## Connect the CMS (Sanity)

1. Create a free project at https://www.sanity.io/manage. Note the **Project ID**.
2. In the Sanity project, under **API**, add these CORS origins (with credentials allowed): `http://localhost:3000` and the live site address.
3. In Vercel, Settings, Environment Variables, add:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` = the project ID
   - `NEXT_PUBLIC_SANITY_DATASET` = `production`
   - `SANITY_API_WRITE_TOKEN` = a token from the Sanity project (API, Tokens, Editor role). This lets enquiries be saved.
4. Redeploy. Mark logs in at `yoursite.com/studio`.
5. Add the venues (Hatch & Barrel, The Brighton Box Gallery), then the artworks. Until at least one piece is published, the site keeps showing the local content.

**Instant updates:** add `SANITY_REVALIDATE_SECRET` (any long random string) in Vercel, then in Sanity create a webhook pointing at `https://yoursite.com/api/revalidate?secret=<that string>`. Published changes then appear within seconds. Without it, pages refresh at most a minute after a change.

## Connect enquiry emails (Resend)

1. Create an account at https://resend.com and verify Mark's domain (Resend gives you DNS records to add).
2. In Vercel add:
   - `RESEND_API_KEY`
   - `ENQUIRY_TO` = Mark's email address
   - `ENQUIRY_FROM` = e.g. `Mark Staples Gallery <gallery@markstaples.co.uk>` (must be on the verified domain)
3. Redeploy. Mark gets each enquiry by email and can just hit reply; the buyer gets an automatic thank-you.

## How the CMS fields drive the 3D room

| Field | Effect in the room |
|---|---|
| Width and height (cm) | Hung at true scale |
| Display as: Canvas | A box with real depth; the frame field sets the edge colour (unframed canvases use painted edges) |
| Display as: Cut-out | For mirrors and shaped pieces; needs a PNG with the background removed; casts a shaped shadow |
| Display as: Sculpture photo | A cut-out photo standing on a plinth, always facing the visitor |
| Display as: Sculpture 3D scan | Currently shows the stand-in torso model; loading the uploaded `.glb` scan is the next task (see below) |
| Status: Sold | Red dot on the wall, price hidden, "Ask about similar work" |
| On show now at | Green "On show now at ..." panel with a link to the venue |
| Hanging order | Lower numbers hang first |

## Known next steps before launch

- **3D scans:** load the uploaded Polycam `.glb` file for "Sculpture: 3D scan" pieces (Three.js `GLTFLoader`). The schema field already exists.
- **Three.js version:** pinned to r128 so the scene looks exactly as approved. Upgrading needs the lighting re-tuned, because newer versions changed colour handling and light units.
- **Rooms:** the wall currently grows to fit any number of pieces in one long room. Splitting into several rooms is a later feature.
- **Photos:** ask for original photos of 3,000 px or more on the long side. The current images are about 1,400 px.
- **Phones:** test on a real mid-range Android phone; shadow quality is already lowered automatically on touch devices.

## Hosting

The site is on the Future Faced Vercel account (project `mark-staples-gallery`).

- Live: https://mark-staples-gallery-ashen.vercel.app (built from `main`)
- Dev preview: built from `dev`, behind Vercel login
- Once connected, the real address will be https://markys11.co.uk
