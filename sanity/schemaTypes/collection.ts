import { defineField, defineType } from 'sanity';
export const collection = defineType({
  name: 'collection', title: 'Section', type: 'document',
  description: 'Groups work on the All work page, e.g. Love & Hearts, Mirror Art',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'blurb', type: 'string', description: 'One line shown under the section title' }),
    defineField({ name: 'order', type: 'number', description: 'Lower numbers show first' }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
});
