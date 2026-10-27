/** An artwork as stored in the CMS (Sanity) or the local seed file. */
export type Venue = { name: string; address: string; url?: string };
export type Collection = { slug: string; title: string; blurb?: string; /** shown as a story: intro and making-of first */ story?: boolean };
/** One photo (or short video) of a piece. `thumb` is a smaller copy for grids. */
export type Photo = { url: string; width: number; height: number; alt?: string; thumb?: string; video?: boolean };

export type Artwork = {
  slug: string;
  /** Empty when Mark hasn't named it; the site then just shows the photo */
  title: string;
  kind?: string; // "Original painting", "Mirror art", "Sculpture"...
  medium?: string;
  year?: number;
  /** '' = not known: no label is shown, just an enquire button */
  status: 'available' | 'reserved' | 'sold' | 'notForSale' | '';
  price?: number; // GBP, whole pounds
  /** How it hangs in the 3D room */
  display: 'canvas' | 'cutout' | 'sculptureModel' | 'sculpturePhoto';
  shape?: 'rect' | 'round';
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  /** Size is a guess for hanging in the 3D room; not shown to visitors until Mark confirms it */
  sizeEstimated?: boolean;
  frame?: 'none' | 'black' | 'oak' | 'white' | 'original';
  frameText?: string;
  story?: string;
  soldNote?: string;
  currentVenue?: Venue | null; // on show somewhere right now
  pastVenue?: Venue | null; // shown or sold via
  /** Main image. For pieces in the 3D room this is the clean cut-out the room uses */
  image: Photo;
  /** Every photo of the piece, main first, for the lightbox. Can include short videos */
  photos?: Photo[];
  /** When it was added. Drives the automatic Recent section */
  addedAt?: string;
  /** Lower numbers lead their collection; unranked pieces follow, newest first */
  rank?: number;
  /** A short line shown with the piece, e.g. a charity auction */
  note?: string;
  collection?: Collection | null;
  /** Hang in the 3D room (the first 15 featured pieces, in hanging order) */
  featured?: boolean;
};
