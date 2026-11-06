import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateSvgMarkup,
  generateSvgDataUrl,
  getPlaceholderPhoto,
  DEFAULT_PLACEHOLDERS
} from '../../src/utils/placeholderGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const photosDir = path.join(projectRoot, 'public/photos');

test('Feature 3 - Placeholder Assets: Default Presets Dictionary Completeness', () => {
  assert.ok(DEFAULT_PLACEHOLDERS, 'DEFAULT_PLACEHOLDERS must be exported');

  // Verify all 5 milestone presets exist
  for (let i = 1; i <= 5; i++) {
    const key = `milestone-${i}`;
    assert.ok(DEFAULT_PLACEHOLDERS[key], `Preset ${key} must exist`);
    assert.strictEqual(DEFAULT_PLACEHOLDERS[key].width, 600);
    assert.strictEqual(DEFAULT_PLACEHOLDERS[key].height, 400);
    assert.ok(DEFAULT_PLACEHOLDERS[key].title.length > 0);
  }

  // Verify all 6 polaroid presets exist
  for (let i = 1; i <= 6; i++) {
    const key = `polaroid-${i}`;
    assert.ok(DEFAULT_PLACEHOLDERS[key], `Preset ${key} must exist`);
    assert.strictEqual(DEFAULT_PLACEHOLDERS[key].width, 600);
    assert.strictEqual(DEFAULT_PLACEHOLDERS[key].height, 600);
    assert.ok(DEFAULT_PLACEHOLDERS[key].title.length > 0);
  }
});

test('Feature 3 - Placeholder Assets: Real SVG Vector Generation via generateSvgMarkup', () => {
  const opts = DEFAULT_PLACEHOLDERS['milestone-1'];
  const svg = generateSvgMarkup(opts);

  assert.ok(typeof svg === 'string', 'generateSvgMarkup must return string');
  assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'), 'Must have standard SVG XML namespace');
  assert.ok(svg.includes('viewBox="0 0 600 400"'), 'Must include correct viewBox for 600x400');
  assert.ok(svg.includes('<linearGradient'), 'Must include linear gradient definition');
  assert.ok(svg.includes('<pattern'), 'Must include decorative dot pattern');
  assert.ok(svg.includes('Pertama Kali Ketemu'), 'Must include escaped title text');
  assert.ok(svg.includes('Kopi Kenangan Heritage'), 'Must include subtitle text');
  assert.ok(svg.includes('</svg>'), 'Must close svg tag');
});

test('Feature 3 - Placeholder Assets: SVG Data URL Conversion via generateSvgDataUrl', () => {
  const opts = DEFAULT_PLACEHOLDERS['polaroid-1'];
  const dataUrl = generateSvgDataUrl(opts);

  assert.ok(dataUrl.startsWith('data:image/svg+xml;utf8,'), 'Must return valid data URL format');
  assert.ok(dataUrl.includes('%3Csvg'), 'Must contain URL-encoded SVG markup');
  assert.ok(dataUrl.length > 500, 'Data URL must contain substantial vector content');
});

test('Feature 3 - Placeholder Assets: Fallback Resolution via getPlaceholderPhoto', () => {
  // Test by milestone ID
  const milestoneData = getPlaceholderPhoto('milestone-1');
  assert.ok(milestoneData.startsWith('data:image/svg+xml;utf8,'), 'Resolves milestone-1 to data URL');

  // Test by photo file path
  const photoPathData = getPlaceholderPhoto('/photos/polaroid-3.svg');
  assert.ok(photoPathData.startsWith('data:image/svg+xml;utf8,'), 'Resolves /photos/polaroid-3.svg to data URL');

  // Test fallback on unknown/missing asset ID
  const fallbackData = getPlaceholderPhoto('missing-nonexistent-photo.jpg');
  assert.ok(fallbackData.startsWith('data:image/svg+xml;utf8,'), 'Safely falls back to default preset without throwing');
});

test('Feature 3 - Placeholder Assets: Physical SVG Files in public/photos/', () => {
  assert.ok(fs.existsSync(photosDir), 'public/photos/ directory must exist');

  const expectedFiles = [
    'milestone-1.svg', 'milestone-2.svg', 'milestone-3.svg', 'milestone-4.svg', 'milestone-5.svg',
    'polaroid-1.svg', 'polaroid-2.svg', 'polaroid-3.svg', 'polaroid-4.svg', 'polaroid-5.svg', 'polaroid-6.svg'
  ];

  for (const filename of expectedFiles) {
    const filePath = path.join(photosDir, filename);
    assert.ok(fs.existsSync(filePath), `Placeholder file ${filename} must exist on disk`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 1000, `File ${filename} must be substantial vector SVG (>1000 bytes, actual: ${stat.size})`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('<svg') && content.includes('</svg>'), `File ${filename} must be valid SVG XML`);
  }
});
