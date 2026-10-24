import { defineField, defineType } from 'sanity';
export const venue = defineType({
  name: 'venue', title: 'Venue', type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'address', type: 'string' }),
    defineField({ name: 'url', title: 'Website', type: 'url' }),
  ],
});
