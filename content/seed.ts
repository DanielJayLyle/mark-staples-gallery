import type { Artwork, Collection, Venue } from '@/lib/types';
import { SAMPLES } from './samples';

/* Local sample content. Used until a Sanity project is connected (NEXT_PUBLIC_SANITY_PROJECT_ID).
   Prices, sizes and stories are placeholders for the pitch. */
const HATCH: Venue = { name: 'Hatch & Barrel', address: '46 High Street, West End, Southampton', url: 'https://hatchandbarrel.com' };
const BRIGHTON_BOX: Venue = { name: 'The Brighton Box Gallery', address: '21 Dukes Lane, Brighton', url: 'https://www.thebrightonbox.com' };

export const COLLECTIONS: Collection[] = [
  { slug: 'love-hearts', title: 'Love & Hearts', blurb: 'Freehand LOVEs, hearts and drips, sprayed loud.' },
  { slug: 'icons-lyrics', title: 'Icons & Lyrics', blurb: 'Music legends and the words that made them, written out by hand.' },
  { slug: 'colour-abstract', title: 'Colour & Abstract', blurb: 'Spray-paint colour fields, dots and city-light blur.' },
  { slug: 'mirror-art', title: 'Mirror Art', blurb: 'Vintage mirrors, rescued and cut by hand.' },
  { slug: 'sculpture', title: 'Sculpture & Objects', blurb: 'Tagged busts, painted Buddhas and found objects.' },
];
const col = (slug: string) => COLLECTIONS.find((c) => c.slug === slug)!;

const img = (slug: string, width: number, height: number, alt: string) => ({ url: `/art/${slug}.webp`, width, height, alt });

const REAL: Artwork[] = [
  { slug: 'smile', collection: col('mirror-art'), featured: true, title: 'Smile', kind: 'Mirror art', medium: 'Hand-cut mirror art set in an original 1960s sunburst frame', year: 2026,
    status: 'available', price: 1000, display: 'cutout', shape: 'round', widthCm: 90, heightCm: 90, frame: 'original',
    frameText: 'Original 1960s sunburst, gilt rays with pearl tips',
    story: 'A real 1960s sunburst mirror, rescued and reworked. The drippy smile is cut into the glass by hand, so the face only shows up when you look into it. Every person who stands in front of it finishes the piece.',
    image: img('smile', 1196, 1215, 'Sunburst mirror with a dripping smiley face cut into the glass') },
  { slug: 'acquiesce', collection: col('icons-lyrics'), featured: true, title: 'Acquiesce', kind: 'Mixed media on canvas', medium: 'Spray paint, acrylic and hand-written lyrics on canvas', year: 2025,
    status: 'available', price: 1000, display: 'canvas', widthCm: 60, heightCm: 100, frame: 'black', frameText: 'Handmade solid black float frame',
    story: 'Liam Gallagher mid-chorus over custom blue sprays. The lyrics were chosen by the client and written out by hand across the whole canvas, line after line, until the song became the background.',
    image: img('acquiesce', 803, 1337, 'Black and white portrait of a singer at a microphone over blue spray paint and hand-written lyrics') },
  { slug: 'endless-love', collection: col('love-hearts'), featured: true, title: 'Endless Love', kind: 'Original painting', medium: 'Spray paint and acrylic on canvas', year: 2026,
    status: 'available', price: 1200, display: 'canvas', widthCm: 100, heightCm: 63, frame: 'oak', frameText: 'Oak float frame', currentVenue: HATCH,
    story: 'Row after row of LOVE, each one sprayed freehand in a different colour over a black ground. It is on the wall at Hatch & Barrel in West End right now, so you can see it in person before you buy.',
    image: img('endless-love', 1415, 892, 'The word LOVE sprayed repeatedly in bright colours on black') },
  { slug: 'the-dreamer', collection: col('colour-abstract'), featured: true, title: 'The Dreamer', kind: 'Original painting', medium: 'Layered spray paint and acrylic on canvas', year: 2026,
    status: 'sold', price: 1100, soldNote: 'Sold this week', display: 'canvas', widthCm: 100, heightCm: 64, frame: 'oak', frameText: 'Oak float frame', pastVenue: HATCH,
    story: 'Soft orbs of spray paint drifting over black, like city lights through a rainy window. It hung at Hatch & Barrel in West End until it sold this week.',
    image: img('the-dreamer', 1388, 894, 'Soft multicoloured spray-paint dots on a black background') },
  { slug: 'heartfelt', collection: col('love-hearts'), featured: true, title: 'Heartfelt', kind: 'Original painting', medium: 'Mixed hearts in spray paint, acrylic and paint pen on canvas', year: 2026,
    status: 'available', price: 1800, display: 'canvas', widthCm: 150, heightCm: 100, frame: 'none', frameText: 'Unframed, painted deep-edge canvas',
    story: 'Hundreds of hearts in spray, drips and paint pen, layered until there is no blank canvas left. At 150 × 100 cm it is Mark’s biggest hearts piece so far, made to be the loudest thing in a room.',
    image: img('heartfelt', 1427, 924, 'Hundreds of colourful spray-painted hearts with drips') },
  { slug: 'tagged', collection: col('sculpture'), featured: true, title: 'Tagged', kind: 'Sculpture', medium: 'Mannequin bust, paint pen and gold leaf', year: 2025,
    status: 'available', price: 1200, display: 'sculptureModel', widthCm: 46, depthCm: 30, heightCm: 80,
    story: 'A shop-window mannequin rescued from a skip, tagged by hand over a month and split down the middle with gold leaf.',
    image: img('tagged', 520, 776, 'Black mannequin bust covered in colourful tags with a gold stripe') },
  { slug: 'brighton-buddy-boi', collection: col('sculpture'), featured: true, title: 'Brighton Buddy Boi', kind: 'Sculpture', medium: 'Hand-painted ceramic Buddha with knitted beanie, round shades and smiley pendant', year: 2026,
    status: 'sold', price: 350, soldNote: 'Sold at The Brighton Box Gallery', display: 'sculpturePhoto', widthCm: 22, depthCm: 18, heightCm: 34, pastVenue: BRIGHTON_BOX,
    story: 'A little Buddha with a lot of attitude: knitted beanie, round shades and a smiley on a chain, with a robe covered in dripping smileys. He found his new home at The Brighton Box Gallery in Brighton.',
    image: img('brighton-buddy-boi', 916, 1460, 'Small Buddha figure in a teal beanie and round sunglasses with a smiley-covered robe') },
];

/** Real pieces first, then the clearly labelled samples standing in for the rest of Mark's archive. */
export const SEED: Artwork[] = [...REAL, ...SAMPLES.map((s) => ({ ...s, collection: col(s.collection as unknown as string) }))];
