/** An artwork as stored in the CMS (Sanity) or the local seed file. */
export type Venue = { name: string; address: string; url?: string };
export type Collection = { slug: string; title: string; blurb?: string };

export type Artwork = {
  slug: string;
  title: string;
  kind?: string; // "Original painting", "Mirror art", "Sculpture"...
  medium?: string;
  year?: number;
  status: 'available' | 'reserved' | 'sold' | 'notForSale';
  price?: number; // GBP, whole pounds
  /** How it hangs in the 3D room */
  display: 'canvas' | 'cutout' | 'sculptureModel' | 'sculpturePhoto';
  shape?: 'rect' | 'round';
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  frame?: 'none' | 'black' | 'oak' | 'white' | 'original';
  frameText?: string;
  story?: string;
  soldNote?: string;
  currentVenue?: Venue | null; // on show somewhere right now
  pastVenue?: Venue | null; // shown or sold via
  image: { url: string; width: number; height: number; alt?: string };
  collection?: Collection | null;
  /** Hang in the 3D room (the first 15 featured pieces, in hanging order) */
  featured?: boolean;
  /** Sample content used while building, never shown on the live site */
  sample?: boolean;
};
