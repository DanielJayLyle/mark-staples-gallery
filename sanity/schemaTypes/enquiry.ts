import { defineField, defineType } from 'sanity';
export const enquiry = defineType({
  name: 'enquiry', title: 'Enquiry', type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', readOnly: true }),
    defineField({ name: 'email', type: 'string', readOnly: true }),
    defineField({ name: 'message', type: 'text', readOnly: true }),
    defineField({ name: 'artwork', type: 'reference', to: [{ type: 'artwork' }], readOnly: true }),
    defineField({ name: 'artworkTitle', title: 'Piece', type: 'string', readOnly: true }),
    defineField({ name: 'topic', title: 'About', type: 'string', readOnly: true, description: 'For messages from the Get in touch pop-up' }),
    defineField({ name: 'status', type: 'string', initialValue: 'new',
      options: { layout: 'radio', list: [{ title: 'New', value: 'new' }, { title: 'Replied', value: 'replied' }, { title: 'Viewing booked', value: 'viewing' }, { title: 'Reserved', value: 'reserved' }, { title: 'Sold', value: 'sold' }, { title: 'Closed', value: 'closed' }] } }),
    defineField({ name: 'notes', type: 'text', rows: 3 }),
    defineField({ name: 'receivedAt', type: 'datetime', readOnly: true }),
  ],
  orderings: [{ title: 'Newest first', name: 'newest', by: [{ field: 'receivedAt', direction: 'desc' }] }],
  preview: { select: { title: 'name', subtitle: 'artworkTitle', topic: 'topic', status: 'status' },
    prepare: ({ title, subtitle, topic, status }) => ({ title: `${title}`, subtitle: `${status === 'new' ? '● New · ' : ''}${subtitle || topic || 'General enquiry'}` }) },
});
