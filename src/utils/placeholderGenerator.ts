/**
 * Aesthetic SVG Gradient & Placeholder Generator
 * Generates beautiful, lightweight, soft warm feminine vector placeholders.
 * Guarantees zero broken images (404s) even in offline environments.
 */

export type PlaceholderTheme = 'sunset' | 'coffee' | 'rose' | 'night' | 'cozy';
export type PlaceholderIcon = 'heart' | 'sun' | 'coffee' | 'camera' | 'car' | 'cake' | 'rain';

export interface SvgPlaceholderOptions {
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  category?: string;
  theme: PlaceholderTheme;
  icon?: PlaceholderIcon;
}

const PALETTES: Record<PlaceholderTheme, {
  bgStart: string;
  bgEnd: string;
  accent: string;
  text: string;
  subtext: string;
  pattern: string;
}> = {
  sunset: {
    bgStart: '#F7EBEB',
    bgEnd: '#E8D8C8',
    accent: '#9E4759',
    text: '#3B2F2F',
    subtext: '#6F5E5C',
    pattern: 'rgba(158, 71, 89, 0.08)'
  },
  coffee: {
    bgStart: '#FAF7F2',
    bgEnd: '#FDF1EB',
    accent: '#853848',
    text: '#3B2F2F',
    subtext: '#7D6967',
    pattern: 'rgba(111, 94, 92, 0.08)'
  },
  rose: {
    bgStart: '#FFFDF9',
    bgEnd: '#F7EBEB',
    accent: '#8C2D3A',
    text: '#3B2F2F',
    subtext: '#6F5E5C',
    pattern: 'rgba(140, 45, 58, 0.08)'
  },
  night: {
    bgStart: '#2A2222',
    bgEnd: '#3B2F2F',
    accent: '#E8D8C8',
    text: '#FFFDF9',
    subtext: '#D4A5A5',
    pattern: 'rgba(232, 216, 200, 0.1)'
  },
  cozy: {
    bgStart: '#FAF7F2',
    bgEnd: '#E8DFD5',
    accent: '#9E4759',
    text: '#3B2F2F',
    subtext: '#6F5E5C',
    pattern: 'rgba(158, 71, 89, 0.06)'
  }
};

const ICONS: Record<PlaceholderIcon, string> = {
  heart: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>`,
  sun: `<circle cx="12" cy="12" r="5" fill="currentColor"/><line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  coffee: `<path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="6" y1="1" x2="6" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="1" x2="14" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  camera: `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="2" fill="none"/>`,
  car: `<rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><polygon points="16 8 20 8 23 11 23 16 16 16 8" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="5.5" cy="18.5" r="2.5" fill="currentColor"/><circle cx="18.5" cy="18.5" r="2.5" fill="currentColor"/>`,
  cake: `<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" stroke="currentColor" stroke-width="2" fill="none"/><path d="M2 21h20" stroke="currentColor" stroke-width="2"/><line x1="12" y1="7" x2="12" y2="11" stroke="currentColor" stroke-width="2"/><path d="M12 4a1 1 0 0 0-1 1c0 .7 1 1.5 1 1.5s1-.8 1-1.5a1 1 0 0 0-1-1z" fill="currentColor"/>`,
  rain: `<line x1="16" y1="13" x2="16" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="13" x2="8" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="15" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`
};

export function generateSvgMarkup(opts: SvgPlaceholderOptions): string {
  const t = PALETTES[opts.theme] || PALETTES.sunset;
  const iconSvg = opts.icon ? ICONS[opts.icon] || ICONS.heart : ICONS.heart;
  const gradId = `grad_${Math.abs(hashString(opts.title + opts.theme))}`;
  const patternId = `pat_${Math.abs(hashString(opts.title + opts.theme))}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${t.bgStart}" />
      <stop offset="50%" stop-color="${t.bgEnd}" />
      <stop offset="100%" stop-color="${t.bgStart}" />
    </linearGradient>
    <pattern id="${patternId}" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.5" fill="${t.pattern}" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="url(#${gradId})" />
  <rect width="100%" height="100%" fill="url(#${patternId})" />

  <!-- Subtle Ambient Glow Rings -->
  <circle cx="${opts.width * 0.5}" cy="${opts.height * 0.42}" r="${Math.min(opts.width, opts.height) * 0.35}" fill="${t.accent}" opacity="0.07" />
  <circle cx="${opts.width * 0.5}" cy="${opts.height * 0.42}" r="${Math.min(opts.width, opts.height) * 0.22}" fill="${t.accent}" opacity="0.09" />

  <!-- Inner Soft Border -->
  <rect x="16" y="16" width="${opts.width - 32}" height="${opts.height - 32}" rx="12" fill="none" stroke="${t.accent}" stroke-width="1.2" stroke-opacity="0.25" stroke-dasharray="6,4" />

  <!-- Central Icon Badge -->
  <g transform="translate(${opts.width * 0.5 - 28}, ${opts.height * 0.42 - 28}) scale(2.33)" color="${t.accent}">
    ${iconSvg}
  </g>

  <!-- Category Tag (if provided) -->
  ${opts.category ? `
  <g transform="translate(${opts.width * 0.5}, ${opts.height * 0.65})">
    <rect x="-60" y="-14" width="120" height="24" rx="12" fill="${t.accent}" opacity="0.12" />
    <text text-anchor="middle" y="2" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="1.5" fill="${t.accent}" text-transform="uppercase">${escapeXml(opts.category)}</text>
  </g>` : ''}

  <!-- Title Text -->
  <text x="50%" y="${opts.category ? opts.height * 0.74 : opts.height * 0.68}" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="${Math.max(16, Math.min(26, opts.width / 16))}" font-weight="600" fill="${t.text}">
    ${escapeXml(opts.title)}
  </text>

  <!-- Subtitle Text -->
  ${opts.subtitle ? `
  <text x="50%" y="${opts.category ? opts.height * 0.82 : opts.height * 0.76}" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="${Math.max(12, Math.min(14, opts.width / 26))}" font-weight="500" fill="${t.subtext}">
    ${escapeXml(opts.subtitle)}
  </text>` : ''}

  <!-- Romantic Sparkle Accents -->
  <g transform="translate(${opts.width * 0.22}, ${opts.height * 0.28})" fill="${t.accent}" opacity="0.35">
    <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6 Z" />
  </g>
  <g transform="translate(${opts.width * 0.78}, ${opts.height * 0.32})" fill="${t.accent}" opacity="0.35">
    <path d="M0 -8 Q0 0 8 0 Q0 0 0 8 Q0 0 -8 0 Q0 0 0 -8 Z" />
  </g>
</svg>`;
}

export function generateSvgDataUrl(opts: SvgPlaceholderOptions): string {
  const svg = generateSvgMarkup(opts);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Pre-configured fallback presets mapped to asset identifiers.
 */
export const DEFAULT_PLACEHOLDERS: Record<string, SvgPlaceholderOptions> = {
  'milestone-1': {
    width: 600,
    height: 400,
    title: 'Pertama Kali Ketemu',
    subtitle: 'Kopi Kenangan Heritage, Senopati',
    category: 'First Meeting',
    theme: 'coffee',
    icon: 'coffee'
  },
  'milestone-2': {
    width: 600,
    height: 400,
    title: 'Midnight Talks & Mie',
    subtitle: 'Jalanan Kota & Warung Mie 24 Jam',
    category: 'Midnight Drive',
    theme: 'night',
    icon: 'car'
  },
  'milestone-3': {
    width: 600,
    height: 400,
    title: 'Resmi Jadi Pasangan',
    subtitle: 'Rooftop Garden Cafe, Jakarta',
    category: 'Anniversary Date',
    theme: 'rose',
    icon: 'heart'
  },
  'milestone-4': {
    width: 600,
    height: 400,
    title: 'Kehujanan Bareng',
    subtitle: 'Emperan Toko Sudirman',
    category: 'Little Adventures',
    theme: 'cozy',
    icon: 'rain'
  },
  'milestone-5': {
    width: 600,
    height: 400,
    title: '1 Year Down, Forever To Go',
    subtitle: 'Here With You 💕',
    category: 'Today & Beyond',
    theme: 'rose',
    icon: 'heart'
  },
  'polaroid-1': {
    width: 600,
    height: 600,
    title: 'Sunset Hunter',
    subtitle: 'Pantai Indah Kapuk',
    category: 'Travel',
    theme: 'sunset',
    icon: 'sun'
  },
  'polaroid-2': {
    width: 600,
    height: 600,
    title: 'Your Prettiest Laugh',
    subtitle: 'Weekend Coffee Date',
    category: 'Candid',
    theme: 'coffee',
    icon: 'camera'
  },
  'polaroid-3': {
    width: 600,
    height: 600,
    title: 'Our Favorite Corner',
    subtitle: 'Kroma Cafe',
    category: 'Dates',
    theme: 'coffee',
    icon: 'coffee'
  },
  'polaroid-4': {
    width: 600,
    height: 600,
    title: 'Zero Filter, 100% Us',
    subtitle: 'Weekend Getaway',
    category: 'Favorites',
    theme: 'night',
    icon: 'car'
  },
  'polaroid-5': {
    width: 600,
    height: 600,
    title: 'Birthday Girl Surprise',
    subtitle: 'Birthday Dinner',
    category: 'Dates',
    theme: 'rose',
    icon: 'cake'
  },
  'polaroid-6': {
    width: 600,
    height: 600,
    title: 'Lazy Sunday Morning',
    subtitle: 'Bakehouse',
    category: 'Favorites',
    theme: 'cozy',
    icon: 'heart'
  }
};

export function getPlaceholderPhoto(idOrPath: string): string {
  // Extract key
  const match = (idOrPath || '').match(/(milestone-\d|polaroid-\d)/i);
  const key = match ? match[1].toLowerCase() : 'polaroid-1';
  const opts = DEFAULT_PLACEHOLDERS[key] || DEFAULT_PLACEHOLDERS['polaroid-1'];
  return generateSvgDataUrl(opts);
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
