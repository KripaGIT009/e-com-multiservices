/**
 * Deterministic placeholder artwork for products with no image of their own.
 *
 * The catalogue API (ItemResponse) carries no image field, so the storefront used to
 * fall back to `picsum.photos/seed/<name>` — a random-photo service. That produced
 * the Golden Gate Bridge for "Ethnic Kurta – Men" and a waterfall for "Anarkali Suit",
 * and left blank tiles whenever the service was slow.
 *
 * A generated tile is honest about having no photograph, renders instantly, works
 * offline, and stays stable for a given product.
 */

/** Brand-derived tints, paired so the glyph always meets contrast on its ground. */
const TONES: ReadonlyArray<{ bg: string; fg: string }> = [
  { bg: '#FFECE2', fg: '#C2410C' }, // saffron
  { bg: '#FDE7EF', fg: '#BE185D' }, // pink
  { bg: '#FEF3C7', fg: '#92700E' }, // turmeric
  { bg: '#F3E8FF', fg: '#7E22CE' }, // plum
  { bg: '#FFE4E6', fg: '#9F1239' }, // rose
  { bg: '#EDE9FE', fg: '#5B21B6' }, // violet
];

/** Stable hash so the same product always gets the same tile. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Up to two initials from the product name, e.g. "Ethnic Kurta" -> "EK". */
function initials(name: string): string {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Returns a self-contained SVG data URI. Safe to use directly in [src] — it contains
 * no external references and no user-controlled markup (the label is escaped).
 */
export function productPlaceholder(name: string, id: number | string = ''): string {
  const tone = TONES[hash(`${name}${id}`) % TONES.length];
  const label = initials(name).replace(/[<>&"']/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
<rect width="400" height="400" fill="${tone.bg}"/>
<circle cx="200" cy="176" r="86" fill="${tone.fg}" opacity="0.10"/>
<text x="200" y="176" fill="${tone.fg}" font-family="Poppins, Noto Sans, sans-serif"
 font-size="86" font-weight="600" text-anchor="middle" dominant-baseline="central">${label}</text>
<text x="200" y="300" fill="${tone.fg}" font-family="Poppins, Noto Sans, sans-serif"
 font-size="20" font-weight="500" text-anchor="middle" opacity="0.55">MyIndianStore</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
