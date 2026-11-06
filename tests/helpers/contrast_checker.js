/**
 * WCAG AA Contrast Calculator
 * Implements W3C WCAG 2.1 relative luminance and contrast ratio algorithms.
 */

export function parseHexColor(hex) {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function channelLuminance(val) {
  const c = val / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function calculateContrastRatio(color1, color2) {
  const rgb1 = typeof color1 === 'string' ? parseHexColor(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? parseHexColor(color2) : color2;
  const lum1 = relativeLuminance(rgb1);
  const lum2 = relativeLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isWcagAaCompliant(foreground, background, isLargeText = false) {
  const ratio = calculateContrastRatio(foreground, background);
  const required = isLargeText ? 3.0 : 4.5;
  return {
    ratio,
    required,
    passed: ratio >= required
  };
}
