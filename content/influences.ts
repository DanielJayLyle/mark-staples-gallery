/* The influences ceiling (look up from the About wall). Names are tagged across the ceiling;
   `met` adds a pink heart, and `key` links a name to the photos it appears in (hover one to light the other).
   Order matters on desktop: each slot has a hand-placed spot. Add names at the end. */
export type Influence = { name: string; met?: boolean; key?: string };
export type InfluencePhoto = { src: string; w: number; h: number; caption: string; keys: string[] };

export const INFLUENCES = {
  heading: 'Who inspires me',
  intro: 'The artists who got me painting.',
  names: [
    { name: 'Banksy' },
    { name: 'Hendog' },
    { name: 'Blek le Rat' },
    { name: 'Sophie Lassman' },
    { name: 'Bobby Guy' },
    { name: 'Emily Bowyer', met: true, key: 'emily' },
    { name: 'The Postman' },
    { name: 'Lewis McClean' },
    { name: 'Chris Guest' },
    { name: 'Zinsky', met: true, key: 'zinsky' },
    { name: 'Tboy', met: true, key: 'tboy' },
    { name: 'Mr Brainwash', met: true, key: 'mbw' },
    { name: 'Ripper' },
    { name: 'Amber Goldhammer' },
    { name: 'Jimmy Martin' },
    { name: 'Claire Woolhead' },
    { name: 'Arron Crascall' },
    { name: 'RYCA' },
    { name: 'Steve Brown' },
    { name: 'Fatboy Slim', met: true, key: 'fatboy' },
  ] as Influence[],
  photos: [
    { src: '/influences/inf-01.webp', w: 512, h: 640, caption: 'Fatboy Slim, Brighton Box', keys: ['fatboy'] },
    { src: '/influences/inf-05.webp', w: 640, h: 636, caption: 'Zinsky, Labyrinth', keys: ['zinsky'] },
    { src: '/influences/inf-04.webp', w: 640, h: 632, caption: 'Fatboy & Emily Bowyer', keys: ['emily', 'fatboy'] },
    { src: '/influences/inf-02.webp', w: 640, h: 480, caption: 'Mr Brainwash!', keys: ['mbw'] },
    { src: '/influences/inf-03.webp', w: 640, h: 479, caption: 'With Mr Brainwash', keys: ['mbw'] },
    { src: '/influences/inf-07.webp', w: 513, h: 640, caption: 'Me, Tboy & Fatboy', keys: ['tboy', 'fatboy'] },
    { src: '/influences/inf-06.webp', w: 512, h: 640, caption: 'Zinsky', keys: ['zinsky'] },
  ] as InfluencePhoto[],
};
