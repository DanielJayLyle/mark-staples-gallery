'use client';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemaTypes';

export default defineConfig({
  name: 'mark-staples',
  title: 'Mark Staples',
  basePath: '/studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not-configured',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S) => S.list().title('Mark Staples').items([
        S.listItem().title('3D room').child(S.document().schemaType('room').documentId('room')),
        S.documentTypeListItem('artwork').title('All pieces'),
        S.listItem().title('About & influences').child(S.document().schemaType('siteText').documentId('siteText')),
        S.listItem().title('New enquiries').child(S.documentList().title('New enquiries').filter('_type == "enquiry" && status == "new"').defaultOrdering([{ field: 'receivedAt', direction: 'desc' }])),
        S.documentTypeListItem('enquiry').title('All enquiries'),
        S.divider(),
        S.documentTypeListItem('collection').title('Collections'),
        S.documentTypeListItem('venue').title('Venues'),
      ]),
    }),
  ],
  schema: { types: schemaTypes, templates: (t) => t.filter(({ schemaType }) => schemaType !== 'room' && schemaType !== 'siteText') },
  document: { actions: (prev, ctx) => (ctx.schemaType === 'room' || ctx.schemaType === 'siteText' ? prev.filter(({ action }) => action !== 'duplicate' && action !== 'delete') : prev) },
});
