import { defineArrayMember, defineField, defineType } from 'sanity';

/* Adding a piece should take under a minute: photos, a collection, Publish. Everything else is optional and tucked away. */
export const artwork = defineType({
  name: 'artwork',
  title: 'Piece',
  type: 'document',
  groups: [
    { name: 'main', title: 'Piece', default: true },
    { name: 'more', title: 'More details' },
    { name: 'room', title: 'For the 3D room' },
  ],
  fields: [
    defineField({ name: 'photos', type: 'array', group: 'main', validation: (r) => r.required().min(1),
      description: 'Drop in one or more photos. The first one is the main photo; drag to reorder. Short videos are fine too.',
      options: { layout: 'grid' },
      of: [
        defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', type: 'string', title: 'Describe the photo (optional, helps Google)' })] }),
        defineArrayMember({ type: 'file', name: 'video', title: 'Video', options: { accept: 'video/mp4,video/quicktime' } }),
      ] }),
    defineField({ name: 'collection', title: 'Collection', type: 'reference', to: [{ type: 'collection' }], group: 'main', validation: (r) => r.required(),
      description: 'Its home on the All work page. New pieces also show in Recent automatically.' }),
    defineField({ name: 'title', type: 'string', group: 'main', description: 'Optional. Leave blank if it has no name.' }),
    defineField({ name: 'slug', title: 'Web address', type: 'slug', group: 'main', options: { source: 'title', maxLength: 80 }, validation: (r) => r.required(),
      initialValue: () => ({ _type: 'slug', current: 'piece-' + Date.now().toString(36) }),
      description: 'Filled in for you. Press Generate after adding a title for a nicer address.' }),
    defineField({ name: 'status', type: 'string', group: 'main', initialValue: '',
      options: { layout: 'radio', direction: 'horizontal', list: [
        { title: 'Not sure / don’t show', value: '' }, { title: 'Available', value: 'available' }, { title: 'Reserved', value: 'reserved' },
        { title: 'Sold', value: 'sold' }, { title: 'Not for sale', value: 'notForSale' },
      ] } }),
    defineField({ name: 'addedAt', title: 'Added', type: 'date', group: 'more', initialValue: () => new Date().toISOString().slice(0, 10),
      description: 'Pieces added in the last 12 months show in Recent. Change it to backdate older work.' }),

    defineField({ name: 'note', type: 'string', group: 'more', description: 'One short line, e.g. "Silent auction for charity until 20 December"' }),
    defineField({ name: 'story', type: 'text', rows: 4, group: 'more', description: 'A few sentences about the piece. Pieces with a story, size or year get their own page.' }),
    defineField({ name: 'kind', type: 'string', group: 'more', options: { list: ['Painting', 'Mixed media on canvas', 'Mirror art', 'Sculpture', 'Drawing', 'Poem', 'Print', 'Commission'] } }),
    defineField({ name: 'medium', type: 'string', group: 'more', description: 'e.g. Spray paint and acrylic on canvas' }),
    defineField({ name: 'year', type: 'number', group: 'more' }),
    defineField({ name: 'widthCm', title: 'Width (cm)', type: 'number', group: 'more', description: 'Needed if it hangs in the 3D room' }),
    defineField({ name: 'heightCm', title: 'Height (cm)', type: 'number', group: 'more' }),
    defineField({ name: 'depthCm', title: 'Depth (cm)', type: 'number', group: 'more' }),
    defineField({ name: 'price', title: 'Price (£)', type: 'number', group: 'more', description: 'Kept private while prices are switched off on the site.' }),
    defineField({ name: 'soldNote', title: 'Sold note', type: 'string', group: 'more', hidden: ({ parent }) => parent?.status !== 'sold', description: 'e.g. Sold at The Brighton Box Gallery' }),
    defineField({ name: 'currentVenue', title: 'On show now at', type: 'reference', to: [{ type: 'venue' }], group: 'more' }),
    defineField({ name: 'pastVenue', title: 'Previously shown at / sold via', type: 'reference', to: [{ type: 'venue' }], group: 'more' }),

    defineField({ name: 'image', title: 'Cut-out for the 3D room (optional)', type: 'image', group: 'room', options: { hotspot: true },
      description: 'Only for pieces in the 3D room: a straight-on photo, or a PNG with the background removed for mirrors and sculptures. If empty, the main photo is used.' }),
    defineField({ name: 'display', title: 'Show in the 3D room as', type: 'string', group: 'room', initialValue: 'canvas',
      options: { layout: 'radio', list: [
        { title: 'Canvas or framed piece on the wall', value: 'canvas' },
        { title: 'Cut-out object on the wall (mirrors, shaped pieces)', value: 'cutout' },
        { title: 'Sculpture: 3D scan', value: 'sculptureModel' },
        { title: 'Sculpture: photo on a plinth', value: 'sculpturePhoto' },
      ] } }),
    defineField({ name: 'shape', type: 'string', group: 'room', initialValue: 'rect', options: { layout: 'radio', list: [{ title: 'Rectangular', value: 'rect' }, { title: 'Round', value: 'round' }] } }),
    defineField({ name: 'frame', type: 'string', group: 'room', initialValue: 'none',
      options: { list: [{ title: 'Unframed canvas', value: 'none' }, { title: 'Black float frame', value: 'black' }, { title: 'Oak float frame', value: 'oak' }, { title: 'White frame', value: 'white' }, { title: 'Original or vintage frame', value: 'original' }] } }),
    defineField({ name: 'frameText', title: 'Frame description', type: 'string', group: 'room' }),
    defineField({ name: 'scan', title: '3D scan (.glb from Polycam)', type: 'file', group: 'room', options: { accept: '.glb,.gltf' },
      hidden: ({ parent }) => parent?.display !== 'sculptureModel' }),
  ],
  orderings: [{ title: 'Newest first', name: 'added', by: [{ field: 'addedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', status: 'status', media: 'photos.0', col: 'collection.title' },
    prepare: ({ title, status, media, col }) => ({ title: title || 'Untitled', media, subtitle: [col, status].filter(Boolean).join(' · ') }),
  },
});
