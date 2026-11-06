import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isWcagAaCompliant } from '../helpers/contrast_checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, '../../src/index.css');

/**
 * Extracts custom CSS tokens defined under `@theme` and `@layer base` in src/index.css
 */
function parseThemeTokens(cssContent) {
  const colorRegex = /--color-anniv-([a-zA-Z0-9]+):\s*(#[0-9A-Fa-f]{6});/g;
  const colors = {};
  let match;
  while ((match = colorRegex.exec(cssContent)) !== null) {
    colors[match[1]] = match[2];
  }

  const fontRegex = /--font-([a-zA-Z0-9]+):\s*([^;]+);/g;
  const fonts = {};
  while ((match = fontRegex.exec(cssContent)) !== null) {
    fonts[match[1]] = match[2].trim();
  }

  const shadowRegex = /--shadow-([a-zA-Z0-9-]+):\s*([^;]+);/g;
  const shadows = {};
  while ((match = shadowRegex.exec(cssContent)) !== null) {
    shadows[match[1]] = match[2].trim();
  }

  return { colors, fonts, shadows };
}

test('Feature 1 - Soft, Warm, Feminine Design System: Real @theme Color Tokens in index.css', () => {
  assert.ok(fs.existsSync(cssPath), `src/index.css must exist at ${cssPath}`);
  const css = fs.readFileSync(cssPath, 'utf8');
  const { colors } = parseThemeTokens(css);

  // Required palette tokens per PROJECT.md design system
  assert.ok(colors.base, '--color-anniv-base must be defined in @theme');
  assert.strictEqual(colors.base.toUpperCase(), '#FAF7F2', '--color-anniv-base must be warm linen #FAF7F2');

  assert.ok(colors.card, '--color-anniv-card must be defined in @theme');
  assert.strictEqual(colors.card.toUpperCase(), '#FFFDF9', '--color-anniv-card must be pure alabaster linen #FFFDF9');

  assert.ok(colors.cocoa, '--color-anniv-cocoa must be defined in @theme');
  assert.strictEqual(colors.cocoa.toUpperCase(), '#3B2F2F', '--color-anniv-cocoa must be deep warm cocoa #3B2F2F');

  assert.ok(colors.rose, '--color-anniv-rose must be defined in @theme');
  assert.strictEqual(colors.rose.toUpperCase(), '#9E4759', '--color-anniv-rose must be soft rose wine #9E4759');

  assert.ok(colors.secondary, '--color-anniv-secondary must be defined in @theme');
  assert.strictEqual(colors.secondary.toUpperCase(), '#6F5E5C', '--color-anniv-secondary must be #6F5E5C');

  assert.ok(colors.champagne, '--color-anniv-champagne must be defined in @theme');
  assert.strictEqual(colors.champagne.toUpperCase(), '#E8D8C8', '--color-anniv-champagne must be #E8D8C8');

  // Verify all parsed colors are valid 6-digit hex format
  for (const [name, hex] of Object.entries(colors)) {
    assert.match(hex, /^#[0-9A-Fa-f]{6}$/, `Parsed token --color-anniv-${name} (${hex}) must be valid 6-digit hex`);
  }
});

test('Feature 1 - Soft, Warm, Feminine Design System: WCAG AA/AAA Contrast from Parsed Tokens', () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const { colors } = parseThemeTokens(css);

  // 1. Primary body text (--color-anniv-cocoa) on warm base (--color-anniv-base)
  const cocoaBaseCheck = isWcagAaCompliant(colors.cocoa, colors.base, false);
  assert.ok(cocoaBaseCheck.passed, `Cocoa on base must pass WCAG AA (ratio: ${cocoaBaseCheck.ratio.toFixed(2)}:1)`);
  assert.ok(cocoaBaseCheck.ratio >= 7.0, `Cocoa on base achieves WCAG AAA (>7:1, actual: ${cocoaBaseCheck.ratio.toFixed(2)}:1)`);

  // 2. Primary body text (--color-anniv-cocoa) on card surface (--color-anniv-card)
  const cocoaCardCheck = isWcagAaCompliant(colors.cocoa, colors.card, false);
  assert.ok(cocoaCardCheck.passed, 'Cocoa on card must pass WCAG AA');
  assert.ok(cocoaCardCheck.ratio >= 7.0, 'Cocoa on card achieves WCAG AAA (>7:1)');

  // 3. Romantic Rose Accent (--color-anniv-rose) on warm base
  const roseBaseCheck = isWcagAaCompliant(colors.rose, colors.base, false);
  assert.ok(roseBaseCheck.passed, `Rose on base must pass WCAG AA (ratio: ${roseBaseCheck.ratio.toFixed(2)}:1)`);
  assert.ok(roseBaseCheck.ratio >= 4.5, 'Rose on base satisfies normal text AA threshold >=4.5:1');

  // 4. White text on Rose button
  const whiteRoseCheck = isWcagAaCompliant('#FFFFFF', colors.rose, false);
  assert.ok(whiteRoseCheck.passed, `White on rose button must pass WCAG AA (ratio: ${whiteRoseCheck.ratio.toFixed(2)}:1)`);
  assert.ok(whiteRoseCheck.ratio >= 4.5, 'White on rose satisfies AA threshold');

  // 5. Secondary text (--color-anniv-secondary) on warm base
  const secondaryCheck = isWcagAaCompliant(colors.secondary, colors.base, false);
  assert.ok(secondaryCheck.passed, `Secondary text on base must pass WCAG AA (ratio: ${secondaryCheck.ratio.toFixed(2)}:1)`);
});

test('Feature 1 - Soft, Warm, Feminine Design System: Typography Stacks in index.css', () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const { fonts } = parseThemeTokens(css);

  assert.ok(fonts.serif, '--font-serif must be defined');
  assert.ok(fonts.serif.includes('Cormorant Garamond'), 'Romantic serif font must specify Cormorant Garamond');
  assert.ok(fonts.serif.includes('Georgia') || fonts.serif.includes('serif'), 'Serif must include safe system fallback');

  assert.ok(fonts.sans, '--font-sans must be defined');
  assert.ok(fonts.sans.includes('Plus Jakarta Sans'), 'Body font must specify Plus Jakarta Sans');
  assert.ok(fonts.sans.includes('system-ui'), 'Sans must include system-ui fallback');

  assert.ok(fonts.handwriting, '--font-handwriting must be defined');
  assert.ok(fonts.handwriting.includes('Caveat'), 'Scrapbook handwritten font must specify Caveat');
});

test('Feature 1 - Soft, Warm, Feminine Design System: Warm Cocoa Shadows in index.css', () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const { shadows } = parseThemeTokens(css);

  assert.ok(shadows['warm-sm'], '--shadow-warm-sm must be defined');
  assert.ok(shadows['warm-md'], '--shadow-warm-md must be defined');
  assert.ok(shadows['warm-lg'], '--shadow-warm-lg must be defined');
  assert.ok(shadows['polaroid'], '--shadow-polaroid must be defined');

  // Verify warm cocoa undertone rgba(74, 62, 61, ...)
  for (const [name, val] of Object.entries(shadows)) {
    if (name.includes('warm') || name === 'polaroid') {
      assert.ok(val.includes('rgba(74, 62, 61'), `Shadow --shadow-${name} must use warm cocoa undertone rgba(74, 62, 61)`);
    }
  }
});

test('Feature 1 - Soft, Warm, Feminine Design System: Craft Motifs and Accessible Focus in index.css', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // Polaroid Frame CSS craft class
  assert.ok(css.includes('.polaroid-frame'), 'src/index.css must define .polaroid-frame');
  assert.ok(css.includes('padding: 12px 12px 48px 12px'), 'Polaroid frame must specify 48px bottom chin');
  assert.ok(css.includes(':hover'), 'Polaroid frame must define hover transition');

  // Washi Tape Ribbon CSS craft class
  assert.ok(css.includes('.washi-tape'), 'src/index.css must define .washi-tape');
  assert.ok(css.includes('clip-path: polygon'), 'Washi tape must use organic torn clip-path polygon');

  // Wax Seal Badge
  assert.ok(css.includes('.wax-seal-badge'), 'src/index.css must define .wax-seal-badge');

  // Accessible Focus Ring
  assert.ok(css.includes(':focus-visible'), 'src/index.css must define accessible :focus-visible ring');
  assert.ok(css.includes('outline: 2px solid #9E4759') || css.includes('#9E4759'), 'Focus ring must use rose wine token');

  // Prefers Reduced Motion Safety
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'src/index.css must provide reduced motion safety');
});
