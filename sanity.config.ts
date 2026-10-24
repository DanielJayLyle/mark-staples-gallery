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
        S.documentTypeListItem('artwork').title('Artworks'),
        S.listItem().title('New enquiries').child(S.documentList().title('New enquiries').filter('_type == "enquiry" && status == "new"').defaultOrdering([{ field: 'receivedAt', direction: 'desc' }])),
        S.documentTypeListItem('enquiry').title('All enquiries'),
        S.divider(),
        S.documentTypeListItem('venue').title('Venues'),
      ]),
    }),
  ],
  schema: { types: schemaTypes },
});
