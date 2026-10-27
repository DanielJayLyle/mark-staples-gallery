import { defineField, defineType } from 'sanity';
export const collection = defineType({
  name: 'collection', title: 'Collection', type: 'document',
  description: 'Groups work on the All work page, e.g. Mirror collection',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'blurb', type: 'text', rows: 2, description: 'A line or two shown under the collection title' }),
    defineField({ name: 'story', title: 'Tell it as a story', type: 'boolean', initialValue: false, description: 'For collections like Churchill: the intro and making-of come first' }),
    defineField({ name: 'order', type: 'number', description: 'Lower numbers show first' }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
});
