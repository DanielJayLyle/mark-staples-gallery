/* Mark's bio, as he wrote it (light punctuation tidy only). Move into the CMS later if he wants to edit it himself.
   {influences} is replaced by the list below, each name sprayed in its own colour. */
import { INFLUENCES } from './influences';

export const ABOUT = {
  inspires: INFLUENCES,
  heading: 'Meet the artist',
  paragraphs: [
    'Original 70s council estate kid. Mark always loved cartoons and characters.',
    'Aged 11, he was taken to Bristol reluctantly after his mum and dad’s separation.',
    'Not a good childhood: bullied at school and bullied at home.',
    'Mark found peace and joy in graffiti, doodling and art.',
    'According to friends, he went to the same school as the infamous “Banksy”.',
    'Later in life his passion for art continued, but it stayed mostly hidden, except for the illustrations he made for his three children and family.',
    'During lockdown Mark got inspired to buy art equipment and begin a new journey.',
    'Inspired by the likes of {influences} and many, many more, he now has artwork in Brighton galleries and in homes, bars, cafes and on walls across the UK.',
  ],
  influences: ['Arron Crascall', 'Banksy', 'Ripper', 'Tboy', 'Postman', 'Mr Brainwash', 'Lewis McClean', 'Zinsky', 'Bobby Guy'],
  signoff: 'Peace and love always x',
  /* Photos of Mark (in public/about/). The first 3 are taped up beside the text; the rest scroll past in the reel.
     Each print keeps the photo's own shape. Add a caption to any of them if you like. */
  photos: [
    { src: '/about/mark-01.webp', w: 620, h: 1000, caption: '' },
    { src: '/about/mark-02.webp', w: 798, h: 1000, caption: '' },
    { src: '/about/mark-03.webp', w: 958, h: 1000, caption: '' },
    { src: '/about/mark-04.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-05.webp', w: 760, h: 570, caption: '' },
    { src: '/about/mark-06.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-07.webp', w: 580, h: 760, caption: '' },
    { src: '/about/mark-08.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-09.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-10.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-11.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-12.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-13.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-14.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-15.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-16.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-17.webp', w: 547, h: 760, caption: '' },
    { src: '/about/mark-18.webp', w: 471, h: 760, caption: '' },
    { src: '/about/mark-19.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-20.webp', w: 570, h: 760, caption: '' },
    { src: '/about/mark-21.webp', w: 567, h: 760, caption: '' },
    { src: '/about/mark-22.webp', w: 471, h: 760, caption: '' },
    { src: '/about/mark-23.webp', w: 570, h: 760, caption: '' },
  ] as { src: string; w: number; h: number; caption?: string }[],
};
export type AboutContent = typeof ABOUT;
