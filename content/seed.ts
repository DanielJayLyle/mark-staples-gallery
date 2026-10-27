import type { Artwork, Collection, Photo, Venue } from '@/lib/types';
import ARCHIVE from './archive.json';

/* Local content, used until the Sanity project is connected. Generated from Mark's photo folders
   (content/archive.json) plus the hand-tuned details the 3D room needs for the pieces hanging in it.
   Only facts we know are here: no invented stories, years or prices. */
const HATCH: Venue = { name: 'Hatch & Barrel', address: '46 High Street, West End, Southampton', url: 'https://hatchandbarrel.com' };
const BRIGHTON_BOX: Venue = { name: 'The Brighton Box Gallery', address: '21 Dukes Lane, Brighton', url: 'https://www.thebrightonbox.com' };

/** Collections in page order. Recent is automatic (newest pieces) and sits above these. */
export const COLLECTIONS: (Collection & { key: string })[] = [
  { key: 'paintings', slug: 'paintings', title: 'Paintings' },
  { key: 'churchill', slug: 'churchill-collection', title: 'Churchill collection', story: true,
    blurb: 'Seven made, in collaboration with the Scottish artist Lewis McClean, who cut the stencils. All seven sold, including one at The Brighton Box.' },
  { key: 'icons', slug: 'icons-collection', title: 'Icons collection', blurb: 'Various, from 2023 and 2024.' },
  { key: 'buddha', slug: 'buddha-collection', title: 'Buddha collection' },
  { key: 'mirror', slug: 'mirror-collection', title: 'Mirror collection' },
  { key: 'models', slug: 'models-clothing-and-boards', title: 'Models, clothing and boards' },
  { key: 'doodling', slug: 'always-doodling', title: 'Always doodling' },
  { key: 'early', slug: 'early-art', title: 'Early art' },
  { key: 'poetry', slug: 'poetry-corner', title: 'Poetry corner' },
  { key: 'misc', slug: 'misc', title: 'Misc' },
];
const byKey = (k: string) => { const { key, ...c } = COLLECTIONS.find((x) => x.key === k)!; void key; return c; };

/** The pieces hanging in the 3D room: clean cut-out images and the sizes the room hangs them at (sizes are estimates until Mark confirms). */
const ROOM: Record<string, Partial<Artwork> & { image: Photo }> = {
  smile: { featured: true, kind: 'Mirror art', display: 'cutout', shape: 'round', widthCm: 90, heightCm: 90, frame: 'original',
    image: { url: '/art/smile.webp', width: 1196, height: 1215, alt: 'Smile: sunburst mirror with a dripping smiley face cut into the glass' } },
  acquiesce: { featured: true, kind: 'Mixed media on canvas', display: 'canvas', widthCm: 60, heightCm: 100, frame: 'black',
    image: { url: '/art/acquiesce.webp', width: 803, height: 1337, alt: 'Acquiesce: portrait of a singer at a microphone over blue spray paint and hand-written lyrics' } },
  'endless-love': { featured: true, kind: 'Painting', display: 'canvas', widthCm: 100, heightCm: 63, frame: 'oak', currentVenue: HATCH,
    image: { url: '/art/endless-love.webp', width: 1415, height: 892, alt: 'Endless Love: the word LOVE sprayed repeatedly in bright colours on black' } },
  'the-dreamer': { featured: true, kind: 'Painting', display: 'canvas', widthCm: 100, heightCm: 64, frame: 'oak', pastVenue: HATCH,
    image: { url: '/art/the-dreamer.webp', width: 1388, height: 894, alt: 'The Dreamer: soft multicoloured spray-paint dots on black' } },
  heartfelt: { featured: true, kind: 'Painting', display: 'canvas', widthCm: 150, heightCm: 100, frame: 'none',
    image: { url: '/art/heartfelt.webp', width: 1427, height: 924, alt: 'Heartfelt: hundreds of colourful spray-painted hearts with drips' } },
  tagged: { featured: true, kind: 'Sculpture', display: 'sculptureModel', widthCm: 46, depthCm: 30, heightCm: 80,
    image: { url: '/art/tagged.webp', width: 520, height: 776, alt: 'Tagged: black mannequin bust covered in tags with a gold stripe' } },
  'brighton-buddy-boi': { featured: true, kind: 'Sculpture', display: 'sculpturePhoto', widthCm: 22, depthCm: 18, heightCm: 34, pastVenue: BRIGHTON_BOX, soldNote: 'Sold at The Brighton Box Gallery',
    image: { url: '/art/brighton-buddy-boi.webp', width: 916, height: 1460, alt: 'Brighton Buddy Boi: Buddha figure in a teal beanie and round sunglasses' } },
};
/** Hanging order in the 3D room */
const ROOM_ORDER = ['smile', 'acquiesce', 'endless-love', 'the-dreamer', 'heartfelt', 'tagged', 'brighton-buddy-boi'];

type Raw = { slug: string; title: string; collection: string; photos: Photo[]; alt: string; addedAt: string; status: Artwork['status']; note: string };
const fromArchive = (r: Raw): Artwork => {
  const room = ROOM[r.slug];
  const photos = room ? [room.image, ...r.photos] : r.photos;
  return {
    slug: r.slug, title: r.title, status: r.status, addedAt: r.addedAt, note: r.note || undefined,
    display: 'canvas', collection: byKey(r.collection), photos, image: room ? room.image : photos[0],
    ...(room ? (({ image, ...rest }) => { void image; return rest; })(room) : {}),
    ...(room ? { sizeEstimated: true } : {}),
  };
};

/* The strongest pieces lead each collection (picked from the photos); everything else follows. */
const LEAD = [
  'endless-love', 'heartfelt', 'the-dreamer', 'paintings-06', 'paintings-13', 'paintings-14', 'if-you-see-darkness', 'paintings-01', 'paintings-07', 'paintings-09', 'level-up', 'paintings-10', 'paintings-11',
  'acquiesce', 'elvis', 'madonna', 'peggy', 'carry-on', 'sid', 'stevie', 'james-dean', 'blondie', 'hendrix', 'kate-moss', 'icons-13', 'charlie',
  'brighton-buddy-boi', 'buddha-bill', 'buddha-bob', 'buddha-barry', 'buddha-ba',
  'only-love-can-hurt-like-this', 'smile', 'hey-you-never-give-up', 'chaos', 'love-you', 'dancefloor', 'harlan',
  'tagged', 'camper-van', 'models-18', 'models-01', 'models-08', 'models-12', 'the-fallen-angel', 'models-15', 'glideaway', 'models-21',
  'doodling-65', 'doodling-69', 'doodling-49', 'doodling-10', 'doodling-52', 'doodling-57', 'doodling-47', 'doodling-71', 'doodling-42', 'doodling-37', 'doodling-48', 'doodling-06',
  'early-09', 'early-06', 'kiss-me', 'early-15', 'early-05', 'early-14', 'early-07',
  'five-things-i-like-about-me', 'be-you-tiful', 'the-lady-on-the-train', 'poetry-04', 'dear-john', 'poetry-08',
  'misc-07', 'misc-11', 'misc-10', 'misc-02', 'misc-14', 'misc-09', 'misc-04', 'misc-05',
];
const pieces = (ARCHIVE.pieces as Raw[]).map(fromArchive).map((p) => (LEAD.includes(p.slug) ? { ...p, rank: LEAD.indexOf(p.slug) + 1 } : p));
export const SEED: Artwork[] = [
  ...ROOM_ORDER.map((s) => pieces.find((p) => p.slug === s)!).filter(Boolean),
  ...pieces.filter((p) => !ROOM[p.slug]),
];

/** Behind-the-scenes photos for the "In the studio" strip */
export const STUDIO: { title: string; photos: Photo[] }[] = ARCHIVE.studio as { title: string; photos: Photo[] }[];
