import { defineField, defineType } from 'sanity';

export const artwork = defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  groups: [
    { name: 'main', title: 'Details', default: true },
    { name: 'gallery', title: 'How it hangs' },
    { name: 'sales', title: 'Sales and venues' },
  ],
  fields: [
    defineField({ name: 'title', type: 'string', group: 'main', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', group: 'main', options: { source: 'title', maxLength: 80 }, validation: (r) => r.required(),
      description: 'Used in the web address, e.g. /work/endless-love' }),
    defineField({ name: 'image', type: 'image', group: 'main', options: { hotspot: true }, validation: (r) => r.required(),
      description: 'Straight-on photo, evenly lit, no glare. For mirrors and sculptures, upload a PNG with the background removed.',
      fields: [defineField({ name: 'alt', type: 'string', title: 'Describe the image (for screen readers and Google)' })] }),
    defineField({ name: 'collection', title: 'Section', type: 'reference', to: [{ type: 'collection' }], group: 'main', description: 'Which section of All work it sits in' }),
    defineField({ name: 'kind', type: 'string', group: 'main', initialValue: 'Original painting',
      options: { list: ['Original painting', 'Mixed media on canvas', 'Mirror art', 'Sculpture', 'Limited edition print', 'Commission'] } }),
    defineField({ name: 'medium', type: 'string', group: 'main', description: 'e.g. Spray paint and acrylic on canvas' }),
    defineField({ name: 'year', type: 'number', group: 'main', initialValue: new Date().getFullYear() }),
    defineField({ name: 'story', type: 'text', rows: 4, group: 'main', description: 'Two or three sentences about the piece' }),

    defineField({ name: 'featured', title: 'Hang in the 3D gallery', type: 'boolean', group: 'gallery', initialValue: false,
      description: 'The 3D room shows up to 15 pieces. Everything else lives on the All work page.',
      validation: (r) => r.custom(async (val, ctx) => {
        if (!val) return true;
        const client = ctx.getClient({ apiVersion: '2025-01-01' });
        const n = await client.fetch<number>('count(*[_type=="artwork" && featured == true && !(_id in path("drafts.**")) && _id != $id])', { id: (ctx.document?._id || '').replace('drafts.', '') });
        return n >= 15 ? 'The gallery already has 15 pieces. Unhang one first.' : true;
      }) }),
    defineField({ name: 'display', title: 'Display in the 3D room as', type: 'string', group: 'gallery', initialValue: 'canvas', validation: (r) => r.required(),
      options: { layout: 'radio', list: [
        { title: 'Canvas or framed piece on the wall', value: 'canvas' },
        { title: 'Cut-out object on the wall (mirrors, shaped pieces)', value: 'cutout' },
        { title: 'Sculpture: 3D scan', value: 'sculptureModel' },
        { title: 'Sculpture: photo on a plinth', value: 'sculpturePhoto' },
      ] } }),
    defineField({ name: 'shape', type: 'string', group: 'gallery', initialValue: 'rect', options: { layout: 'radio', list: [{ title: 'Rectangular', value: 'rect' }, { title: 'Round', value: 'round' }] } }),
    defineField({ name: 'widthCm', title: 'Width (cm)', type: 'number', group: 'gallery', description: 'Needed to hang it at true size in the 3D room',
      validation: (r) => r.positive().custom((v, ctx) => (ctx.document?.featured && !v ? 'Add the width so it can hang in the 3D room' : true)) }),
    defineField({ name: 'heightCm', title: 'Height (cm)', type: 'number', group: 'gallery',
      validation: (r) => r.positive().custom((v, ctx) => (ctx.document?.featured && !v ? 'Add the height so it can hang in the 3D room' : true)) }),
    defineField({ name: 'depthCm', title: 'Depth (cm)', type: 'number', group: 'gallery' }),
    defineField({ name: 'frame', type: 'string', group: 'gallery', initialValue: 'none',
      options: { list: [{ title: 'Unframed canvas', value: 'none' }, { title: 'Black float frame', value: 'black' }, { title: 'Oak float frame', value: 'oak' }, { title: 'White frame', value: 'white' }, { title: 'Original or vintage frame', value: 'original' }] } }),
    defineField({ name: 'frameText', title: 'Frame description', type: 'string', group: 'gallery' }),
    defineField({ name: 'scan', title: '3D scan (.glb from Polycam)', type: 'file', group: 'gallery', options: { accept: '.glb,.gltf' },
      hidden: ({ parent }) => parent?.display !== 'sculptureModel' }),
    defineField({ name: 'order', title: 'Hanging order', type: 'number', group: 'gallery', description: 'Lower numbers hang first' }),

    defineField({ name: 'status', type: 'string', group: 'sales', initialValue: 'available', validation: (r) => r.required(),
      options: { layout: 'radio', list: [
        { title: 'Available', value: 'available' }, { title: 'Reserved', value: 'reserved' },
        { title: 'Sold', value: 'sold' }, { title: 'Not for sale', value: 'notForSale' },
      ] } }),
    defineField({ name: 'price', title: 'Price (£)', type: 'number', group: 'sales', description: 'Optional. Prices are currently hidden on the site; this is kept for if they are switched back on.' }),
    defineField({ name: 'soldNote', title: 'Sold note', type: 'string', group: 'sales', hidden: ({ parent }) => parent?.status !== 'sold', description: 'e.g. Sold at The Brighton Box Gallery' }),
    defineField({ name: 'currentVenue', title: 'On show now at', type: 'reference', to: [{ type: 'venue' }], group: 'sales' }),
    defineField({ name: 'pastVenue', title: 'Previously shown at / sold via', type: 'reference', to: [{ type: 'venue' }], group: 'sales' }),
  ],
  orderings: [{ title: 'Hanging order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', status: 'status', price: 'price', media: 'image' },
    prepare: ({ title, status, price, media }) => ({ title, media, subtitle: [status, price ? '£' + price : null].filter(Boolean).join(' · ') }),
  },
});
