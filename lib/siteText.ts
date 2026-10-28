import { ABOUT, type AboutContent } from '@/content/about';
import { INFLUENCES } from '@/content/influences';
import { sanityClient } from './artworks';

type SiteText = {
  aboutHeading?: string; aboutText?: string[]; aboutNames?: string[]; signoff?: string;
  inspiresHeading?: string; inspiresIntro?: string; inspiresNames?: { name?: string; met?: boolean }[];
};

/** The About wall and influences ceiling text: Mark's edits from the Studio, falling back field by field to the
    text in content/. Photos stay in the code; a name keeps its photo link when it matches one in content/influences. */
export async function getAbout(): Promise<AboutContent> {
  let t: SiteText | null = null;
  if (sanityClient) {
    try { t = await sanityClient.fetch<SiteText | null>(`*[_id == "siteText"][0]`, {}, { next: { revalidate: 60, tags: ['artwork'] } }); } catch {}
  }
  if (!t) return ABOUT;
  const has = <T,>(a?: T[]) => (a && a.length ? a : null);
  const names = has(t.inspiresNames?.filter((n) => n.name?.trim()))?.map((n) => ({
    name: n.name!.trim(), met: !!n.met, key: INFLUENCES.names.find((x) => x.name.toLowerCase() === n.name!.trim().toLowerCase())?.key,
  }));
  return {
    ...ABOUT,
    heading: t.aboutHeading?.trim() || ABOUT.heading,
    paragraphs: has(t.aboutText?.map((p) => p.trim()).filter(Boolean)) || ABOUT.paragraphs,
    influences: has(t.aboutNames?.map((n) => n.trim()).filter(Boolean)) || ABOUT.influences,
    signoff: t.signoff?.trim() || ABOUT.signoff,
    inspires: {
      ...INFLUENCES,
      heading: t.inspiresHeading?.trim() || INFLUENCES.heading,
      intro: t.inspiresIntro?.trim() || INFLUENCES.intro,
      names: (names || INFLUENCES.names).slice(0, 24),
    },
  };
}
