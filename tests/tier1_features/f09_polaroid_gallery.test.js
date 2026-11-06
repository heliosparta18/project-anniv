import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass } from '../helpers/responsive_checker.js';
import { polaroids } from '../../src/data/anniversaryData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const polaroidGalleryPath = path.resolve(__dirname, '../../src/components/gallery/PolaroidGallery.tsx');
const polaroidCardPath = path.resolve(__dirname, '../../src/components/gallery/PolaroidCard.tsx');

// Robust JSX element extractor that tracks brace depth so attribute arrow functions like (e) => ...
// do not prematurely terminate tag parsing
function extractInteractiveElements(source) {
  const elements = [];
  const startRegex = /<(a|button)\s+/g;
  let match;
  while ((match = startRegex.exec(source)) !== null) {
    const tagName = match[1];
    const tagStart = match.index;
    let i = startRegex.lastIndex;
    let braceDepth = 0;
    let inString = null;
    let tagEnd = -1;

    while (i < source.length) {
      const ch = source[i];
      if (inString) {
        if (ch === inString && source[i - 1] !== '\\') inString = null;
      } else if (ch === '"' || ch === "'") {
        inString = ch;
      } else if (ch === '{') {
        braceDepth++;
      } else if (ch === '}') {
        braceDepth--;
      } else if (ch === '>' && braceDepth === 0) {
        tagEnd = i;
        break;
      }
      i++;
    }

    if (tagEnd !== -1) {
      const tagContent = source.slice(tagStart, tagEnd + 1);
      const classMatch = tagContent.match(/className="([^"]+)"/) || tagContent.match(/className=\{`([^`]+)`\}/);
      const hrefMatch = tagContent.match(/href=(?:"([^"]+)"|{([^}]+)})/);
      const ariaLabelMatch = tagContent.match(/aria-label="([^"]+)"/) || tagContent.match(/aria-label=\{`([^`]+)`\}/);
      elements.push({
        tagName,
        href: hrefMatch ? (hrefMatch[1] || hrefMatch[2]) : null,
        ariaLabel: ariaLabelMatch ? (ariaLabelMatch[1] || ariaLabelMatch[2]) : null,
        className: classMatch ? (classMatch[1] || classMatch[2]) : '',
        snippet: tagContent
      });
      startRegex.lastIndex = tagEnd + 1;
    }
  }
  return elements;
}

test('Feature 9 - Polaroid Gallery: Polaroid Frame Structure and 48px Bottom Chin', () => {
  // 1. Verify required source files exist
  assert.ok(fs.existsSync(polaroidGalleryPath), 'PolaroidGallery.tsx must exist in src/components/gallery/');
  assert.ok(fs.existsSync(polaroidCardPath), 'PolaroidCard.tsx must exist in src/components/gallery/');

  const galleryCode = fs.readFileSync(polaroidGalleryPath, 'utf8');
  const cardCode = fs.readFileSync(polaroidCardPath, 'utf8');

  // 2. Component exports
  assert.ok(
    galleryCode.includes('export function PolaroidGallery') || galleryCode.includes('export const PolaroidGallery'),
    'PolaroidGallery.tsx must export PolaroidGallery component'
  );
  assert.ok(
    cardCode.includes('export function PolaroidCard') || cardCode.includes('export const PolaroidCard'),
    'PolaroidCard.tsx must export PolaroidCard component'
  );

  // 3. Landmark container and accessibility
  assert.ok(galleryCode.includes('id="gallery"'), 'PolaroidGallery must define landmark container with id="gallery"');
  assert.ok(galleryCode.includes('aria-label='), 'PolaroidGallery must define descriptive aria-label');

  // 4. Overflow protection to prevent mobile blowout from rotated cards
  assert.ok(
    galleryCode.includes('overflow-x-clip') || galleryCode.includes('overflow-x-hidden'),
    'PolaroidGallery must enforce overflow-x-clip to prevent mobile horizontal blowouts from tilted cards'
  );

  // 5. Polaroid frame styling and 48px bottom chin
  assert.ok(
    cardCode.includes('polaroid-frame') || cardCode.includes('pb-12'),
    'PolaroidCard must use polaroid-frame or 48px bottom chin padding (pb-12)'
  );

  // 6. Organic tilts / CSS rotation
  assert.ok(
    cardCode.includes('rotate(') || cardCode.includes('photo.rotation') || cardCode.includes('rotation'),
    'PolaroidCard must apply organic tilt rotation degrees'
  );

  // 7. Washi tape decoration
  assert.ok(
    cardCode.includes('washi-tape') || galleryCode.includes('washi-tape'),
    'PolaroidCard or PolaroidGallery must feature translucent washi tape craft styling'
  );

  // 8. Responsive grid scaling
  assert.ok(galleryCode.includes('grid-cols-1'), 'PolaroidGallery must use single column grid on mobile');
  assert.ok(galleryCode.includes('sm:grid-cols-2'), 'PolaroidGallery must scale to 2 columns on tablet');
  assert.ok(galleryCode.includes('lg:grid-cols-3'), 'PolaroidGallery must scale to 3 columns on desktop');

  // 9. Antislop R-02 Copywriting hygiene: strict em-dash ban
  assert.ok(
    !galleryCode.includes('\u2014'),
    'PolaroidGallery.tsx must not contain any em-dash character per R-02 antislop rules'
  );
  assert.ok(
    !cardCode.includes('\u2014'),
    'PolaroidCard.tsx must not contain any em-dash character per R-02 antislop rules'
  );
});

test('Feature 9 - Polaroid Gallery: 3D Card Flip to Handwritten Notes on Back', () => {
  const cardCode = fs.readFileSync(polaroidCardPath, 'utf8');

  // 1. 3D CSS transform properties: perspective, transform-style, backface-visibility
  assert.ok(
    cardCode.includes('perspective') || cardCode.includes('[perspective:1000px]'),
    'PolaroidCard must specify 3D perspective (e.g. 1000px) for realistic depth'
  );
  assert.ok(
    cardCode.includes('preserve-3d') || cardCode.includes('[transform-style:preserve-3d]'),
    'PolaroidCard must declare transform-style: preserve-3d'
  );
  assert.ok(
    cardCode.includes('rotateY(180deg)') || cardCode.includes('rotate-y-180') || cardCode.includes('[transform:rotateY(180deg)]'),
    'PolaroidCard must execute rotateY(180deg) 3D card flip transform'
  );
  assert.ok(
    cardCode.includes('backface-visibility') || cardCode.includes('backface-hidden') || cardCode.includes('[backface-visibility:hidden]'),
    'PolaroidCard must hide backface on card faces'
  );

  // 2. Handwritten typography with Caveat font
  assert.ok(
    cardCode.includes('font-handwriting'),
    'PolaroidCard must use font-handwriting (Caveat font) for authentic personal handwriting notes'
  );

  // 3. Flip state management and interaction
  assert.ok(
    cardCode.includes('isFlipped') || cardCode.includes('flipped'),
    'PolaroidCard must maintain flip state'
  );
  assert.ok(
    cardCode.includes('photo.note') || cardCode.includes('note'),
    'PolaroidCard back face must render photo note content'
  );

  // 4. Aesthetic typography memory frame presentation (R1: clean typography, no placeholder images)
  assert.ok(
    !cardCode.includes('<img'),
    'PolaroidCard must remove placeholder img tags per R1 requirement'
  );

  // 5. Touch target invariants on interactive buttons
  const interactiveElements = extractInteractiveElements(cardCode);
  assert.ok(interactiveElements.length >= 1, 'PolaroidCard must have at least one interactive control (flip/expand)');
  for (const el of interactiveElements) {
    assert.ok(
      el.className.includes('min-h-[44px]') ||
      el.className.includes('min-w-[44px]') ||
      validateTouchTargetClass(el.className),
      `PolaroidCard interactive element <${el.tagName}> must satisfy WCAG 2.5.5 >= 44px touch target (found: "${el.className}")`
    );
  }
});

test('Feature 9 - Polaroid Gallery: Category Filtering Logic', () => {
  const galleryCode = fs.readFileSync(polaroidGalleryPath, 'utf8');

  // 1. Category state management
  assert.ok(
    galleryCode.includes('activeCategory') || galleryCode.includes('selectedCategory') || galleryCode.includes('category'),
    'PolaroidGallery must manage active category filtering state'
  );

  // 2. Supported category tags from interface contract
  const expectedCategories = ['all', 'dates', 'travel', 'candid', 'favorites'];
  for (const cat of expectedCategories) {
    assert.ok(
      galleryCode.includes(`'${cat}'`) || galleryCode.includes(`"${cat}"`),
      `PolaroidGallery must support category filter option: "${cat}"`
    );
  }

  // 3. Tab accessibility attributes (WAI-ARIA tabs pattern)
  assert.ok(
    galleryCode.includes('role="tablist"') || galleryCode.includes("role='tablist'"),
    'PolaroidGallery category tabs container must declare role="tablist"'
  );
  assert.ok(
    galleryCode.includes('role="tab"') || galleryCode.includes("role='tab'"),
    'PolaroidGallery category tabs must declare role="tab"'
  );
  assert.ok(
    galleryCode.includes('aria-selected') || galleryCode.includes('aria-pressed'),
    'PolaroidGallery category tabs must announce selected state'
  );

  // 4. Touch target compliance on category tab buttons
  const interactiveElements = extractInteractiveElements(galleryCode);
  const tabButtons = interactiveElements.filter(e => e.tagName === 'button');
  assert.ok(tabButtons.length >= 1, `Expected interactive tab buttons, found ${tabButtons.length}`);
  for (const btn of tabButtons) {
    assert.ok(
      btn.className.includes('min-h-[44px]') ||
      btn.className.includes('min-w-[44px]') ||
      validateTouchTargetClass(btn.className),
      `Category tab button must satisfy WCAG 2.5.5 touch target size (found: "${btn.className}")`
    );
  }

  // 5. Exact category filter count verification against production data
  assert.strictEqual(polaroids.length, 6, 'Production data must contain 6 polaroid moments');
  const travelCount = polaroids.filter(p => p.category === 'travel').length;
  assert.strictEqual(travelCount, 1, 'Production data must contain 1 travel photo');
  const candidCount = polaroids.filter(p => p.category === 'candid').length;
  assert.strictEqual(candidCount, 1, 'Production data must contain 1 candid photo');
  const datesCount = polaroids.filter(p => p.category === 'dates').length;
  assert.strictEqual(datesCount, 2, 'Production data must contain 2 date photos');
  const favCount = polaroids.filter(p => p.category === 'favorites').length;
  assert.strictEqual(favCount, 2, 'Production data must contain 2 favorite photos');
});
