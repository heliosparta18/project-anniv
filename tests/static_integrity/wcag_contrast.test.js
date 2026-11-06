import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateContrastRatio, isWcagAaCompliant } from '../helpers/contrast_checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, '../../src/index.css');

function getThemeColors() {
  const css = fs.readFileSync(cssPath, 'utf8');
  const colorRegex = /--color-anniv-([a-zA-Z0-9]+):\s*(#[0-9A-Fa-f]{6});/g;
  const colors = {};
  let match;
  while ((match = colorRegex.exec(css)) !== null) {
    colors[match[1]] = match[2];
  }
  return colors;
}

test('Accessibility & Contrast: Normal Body Text on Light Backgrounds', () => {
  const colors = getThemeColors();
  const backgrounds = [colors.base, colors.card, '#FFFFFF'];
  const textColors = [colors.cocoa]; // Primary body text #3B2F2F

  for (const bg of backgrounds) {
    for (const fg of textColors) {
      const check = isWcagAaCompliant(fg, bg, false);
      assert.ok(
        check.passed,
        `Text ${fg} on background ${bg} must pass WCAG AA (ratio: ${check.ratio.toFixed(2)}:1)`
      );
      assert.ok(check.ratio >= 7.0, `Achieves high contrast > 7:1 (AAA) for optimal readability (actual: ${check.ratio.toFixed(2)}:1)`);
    }
  }
});

test('Accessibility & Contrast: Romantic Accent Text and Headings', () => {
  const colors = getThemeColors();
  const backgrounds = [colors.base, colors.card];
  const roseWine = colors.rose; // #9E4759

  for (const bg of backgrounds) {
    const check = isWcagAaCompliant(roseWine, bg, false);
    assert.ok(
      check.passed,
      `Rose wine (${roseWine}) on ${bg} must pass WCAG AA for headings/text (ratio: ${check.ratio.toFixed(2)}:1)`
    );
    assert.ok(check.ratio >= 4.5, `Rose wine on ${bg} satisfies 4.5:1 AA ratio`);
  }
});

test('Accessibility & Contrast: Button Labels on Accent Backgrounds', () => {
  const colors = getThemeColors();
  const white = '#FFFFFF';
  const roseWine = colors.rose;

  const check = isWcagAaCompliant(white, roseWine, false);
  assert.ok(
    check.passed,
    `White text on rose wine button must pass WCAG AA (ratio: ${check.ratio.toFixed(2)}:1)`
  );
  assert.ok(check.ratio >= 4.5, 'White on rose satisfies AA button threshold');
});

test('Accessibility & Contrast: Interactive Focus Indicators', () => {
  const colors = getThemeColors();
  const focusRing = colors.rose; // :focus-visible uses #9E4759
  const bg = colors.base;
  const ratio = calculateContrastRatio(focusRing, bg);
  assert.ok(ratio >= 3.0, `Focus indicators must have at least 3.0:1 contrast against background (actual: ${ratio.toFixed(2)}:1)`);
});

test('Accessibility & Contrast: Non-Text UI Borders and Actions', () => {
  const colors = getThemeColors();
  const actionBorder = colors.borderAction; // #96817D
  const bg = colors.base;
  const ratio = calculateContrastRatio(actionBorder, bg);
  assert.ok(ratio >= 3.0, `Interactive border must have at least 3.0:1 contrast for WCAG AA non-text compliance (actual: ${ratio.toFixed(2)}:1)`);
});
