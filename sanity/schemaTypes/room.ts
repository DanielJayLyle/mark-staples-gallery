import { defineArrayMember, defineField, defineType } from 'sanity';

/* One page that is the 3D room: drag to reorder, × to remove, add any piece. Up to 15. */
export const room = defineType({
  name: 'room', title: '3D room', type: 'document',
  fields: [
    defineField({ name: 'pieces', title: 'Hanging in the room, in order along the wall', type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'artwork' }] })],
      validation: (r) => [
        r.max(15).error('The room holds 15 pieces at most. Remove one first.'),
        r.unique(),
        r.custom(async (refs, ctx) => {
          if (!refs?.length) return true;
          const ids = (refs as { _ref: string }[]).map((x) => x._ref);
          const missing = await ctx.getClient({ apiVersion: '2025-01-01' }).fetch<string[]>(`*[_id in $ids && !defined(widthCm)].title`, { ids });
          return missing.length ? { message: `Add a width (in More details) for: ${missing.map((t) => t || 'Untitled').join(', ')}`, level: 'warning' } : true;
        }),
      ] }),
  ],
  preview: { prepare: () => ({ title: '3D room' }) },
});
