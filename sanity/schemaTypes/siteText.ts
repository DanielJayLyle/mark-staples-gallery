import { defineArrayMember, defineField, defineType } from 'sanity';
import { ABOUT } from '../../content/about';
import { INFLUENCES } from '../../content/influences';

/* The words on the About wall and the influences ceiling. Starts filled in with the current text, so Mark only
   changes what he wants. Layout, colours and photos stay in the code. */
export const siteText = defineType({
  name: 'siteText', title: 'About & influences', type: 'document',
  groups: [{ name: 'about', title: 'About wall', default: true }, { name: 'inspires', title: 'Who inspires me' }],
  fields: [
    defineField({ name: 'aboutHeading', title: 'Heading', type: 'string', group: 'about', initialValue: ABOUT.heading }),
    defineField({ name: 'aboutText', title: 'Your story', type: 'array', group: 'about', of: [defineArrayMember({ type: 'text', rows: 2 })],
      initialValue: ABOUT.paragraphs,
      description: 'One box per paragraph. Write {influences} where the coloured list of names below should appear.' }),
    defineField({ name: 'aboutNames', title: 'Names in your story', type: 'array', group: 'about', of: [defineArrayMember({ type: 'string' })],
      initialValue: ABOUT.influences, options: { layout: 'tags' },
      description: 'Sprayed in colour where your story says {influences}.' }),
    defineField({ name: 'signoff', title: 'Sign-off', type: 'string', group: 'about', initialValue: ABOUT.signoff }),

    defineField({ name: 'inspiresHeading', title: 'Heading', type: 'string', group: 'inspires', initialValue: INFLUENCES.heading }),
    defineField({ name: 'inspiresIntro', title: 'Intro line', type: 'string', group: 'inspires', initialValue: INFLUENCES.intro }),
    defineField({ name: 'inspiresNames', title: 'Names on the ceiling', type: 'array', group: 'inspires',
      description: 'Drag to reorder. Tick "Met them" to add a heart. Room for 24 names.',
      initialValue: INFLUENCES.names.map((n, i) => ({ _key: 'n' + i, _type: 'inspiration', name: n.name, met: !!n.met })),
      validation: (r) => r.max(24).error('The ceiling fits 24 names. Remove one first.'),
      of: [defineArrayMember({ type: 'object', name: 'inspiration', fields: [
        defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'met', title: 'Met them', type: 'boolean', initialValue: false }),
      ], preview: { select: { title: 'name', met: 'met' }, prepare: ({ title, met }) => ({ title: (title || '') + (met ? '  ♥' : '') }) } })] }),
  ],
  preview: { prepare: () => ({ title: 'About & influences' }) },
});
