/** JSON for a <script type="application/ld+json"> tag. Escapes "<" so text from the CMS can never close the tag early. */
export const ldHtml = (o: unknown) => ({ __html: JSON.stringify(o).replace(/</g, '\\u003c') });
