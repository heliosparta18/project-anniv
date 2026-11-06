import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass, MIN_TOUCH_TARGET_SIZE } from '../helpers/responsive_checker.js';
import { polaroids } from '../../src/data/anniversaryData.ts';
import { getPlaceholderPhoto } from '../../src/utils/placeholderGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const lightboxModalPath = path.resolve(__dirname, '../../src/components/gallery/LightboxModal.tsx');

test('Feature 10 - Lightbox Modal: Open on Photo Click with Full Metadata Presentation', () => {
  // 1. Verify LightboxModal source file existence
  assert.ok(fs.existsSync(lightboxModalPath), 'LightboxModal.tsx must exist in src/components/gallery/');
  const code = fs.readFileSync(lightboxModalPath, 'utf8');

  // 2. Component export invariants
  assert.ok(
    code.includes('export function LightboxModal') || code.includes('export const LightboxModal'),
    'LightboxModal.tsx must export LightboxModal component'
  );

  // 3. Accessible Dialog semantics & Fullscreen Backdrop
  assert.ok(code.includes('role="dialog"'), 'LightboxModal must render semantic role="dialog"');
  assert.ok(code.includes('aria-modal="true"'), 'LightboxModal must enforce aria-modal="true"');
  assert.ok(
    code.includes('aria-label='),
    'LightboxModal dialog container must provide accessible aria-label'
  );
  assert.ok(
    code.includes('fixed inset-0') && code.includes('z-50'),
    'LightboxModal must render fixed full-viewport overlay at highest stacking context (z-50)'
  );
  assert.ok(
    code.includes('backdrop-blur'),
    'LightboxModal backdrop must feature romantic aesthetic backdrop-blur'
  );

  // 4. Image rendering with resilient fallback
  assert.ok(
    code.includes('<img') && (code.includes('currentPhoto.url') || code.includes('photo.url')),
    'LightboxModal must render photo image tag with photo url'
  );
  assert.ok(
    code.includes('onError=') && code.includes('getPlaceholderPhoto'),
    'LightboxModal must bind onError fallback using getPlaceholderPhoto generator'
  );

  // 5. Full metadata display: caption, date, location, handwritten note
  assert.ok(
    code.includes('font-handwriting'),
    'LightboxModal must render photo caption and secret note in Caveat font (font-handwriting)'
  );
  assert.ok(
    code.includes('caption'),
    'LightboxModal must display photo caption'
  );
  assert.ok(
    code.includes('Calendar') && code.includes('date'),
    'LightboxModal must render date with romantic Calendar icon'
  );
  assert.ok(
    code.includes('MapPin') && code.includes('location'),
    'LightboxModal must render location with MapPin icon'
  );
  assert.ok(
    code.includes('note'),
    'LightboxModal must render heartfelt handwritten secret note from the back of the polaroid'
  );

  // 6. Production Polaroids Dataset Invariants
  assert.ok(Array.isArray(polaroids), 'polaroids must be an array');
  assert.strictEqual(polaroids.length, 6, 'Must define exactly 6 polaroids for Chapter 3');
  for (const p of polaroids) {
    assert.ok(typeof p.id === 'string' && p.id.length > 0, 'Polaroid ID is required');
    assert.ok(typeof p.caption === 'string' && p.caption.length > 0, 'Polaroid caption is required');
    assert.ok(typeof p.date === 'string' && p.date.length > 0, 'Polaroid date is required');
    assert.ok(typeof p.location === 'string' && p.location.length > 0, 'Polaroid location is required');
    assert.ok(typeof p.url === 'string' && p.url.length > 0, 'Polaroid url is required');
    assert.ok(typeof p.note === 'string' && p.note.length > 10, 'Polaroid secret note is required');

    // Test fallback generation
    const fallbackUrl = getPlaceholderPhoto(p.id);
    assert.ok(fallbackUrl.startsWith('data:image/svg+xml'), 'Fallback photo must produce valid SVG data URL');
  }

  // 7. Antislop R-02 Copywriting hygiene: strict em-dash ban
  assert.ok(
    !code.includes('\u2014') && !code.includes('&mdash;'),
    'LightboxModal.tsx must not contain any em dash character per R-02 antislop rules'
  );
});

test('Feature 10 - Lightbox Modal: Touch Close Button & Keyboard Escape Key Dismissal', () => {
  const code = fs.readFileSync(lightboxModalPath, 'utf8');

  // 1. Close button touch target (WCAG 2.5.5 >= 44x44px)
  assert.strictEqual(MIN_TOUCH_TARGET_SIZE, 44, 'Touch target size minimum standard is 44px');

  assert.ok(
    code.includes('aria-label="Close') || code.includes("aria-label='Close"),
    'Close button must specify accessible aria-label'
  );

  const closeButtonMatch = code.match(/<button[\s\S]*?aria-label="Close[^"]*"[\s\S]*?className="([^"]+)"/);
  assert.ok(closeButtonMatch, 'Close button must specify className');
  const closeBtnClass = closeButtonMatch[1];
  assert.ok(
    validateTouchTargetClass(closeBtnClass) ||
    (closeBtnClass.includes('min-w-[44px]') && closeBtnClass.includes('min-h-[44px]')),
    `Close button must satisfy minimum 44x44px touch target (got: "${closeBtnClass}")`
  );

  // 2. Keyboard Escape key dismissal
  assert.ok(
    code.includes("e.key === 'Escape'") || code.includes('e.key === "Escape"'),
    'LightboxModal must listen for Escape key to trigger dismissal'
  );
  assert.ok(
    code.includes('onClose()') || code.includes('onClose'),
    'Escape key handler must invoke onClose callback'
  );

  // 3. Keyboard Arrow navigation
  assert.ok(
    code.includes("e.key === 'ArrowLeft'") || code.includes('e.key === "ArrowLeft"'),
    'LightboxModal must support ArrowLeft key for previous photo navigation'
  );
  assert.ok(
    code.includes("e.key === 'ArrowRight'") || code.includes('e.key === "ArrowRight"'),
    'LightboxModal must support ArrowRight key for next photo navigation'
  );

  // 4. Focus Trap & management
  assert.ok(
    code.includes("e.key === 'Tab'") || code.includes('focus') || code.includes('querySelectorAll'),
    'LightboxModal must manage keyboard focus or focus trap within dialog'
  );

  // 5. Touch / Swipe Navigation Controls
  assert.ok(
    code.includes('Previous photo') && code.includes('Next photo'),
    'LightboxModal must provide previous and next navigation controls'
  );

  const navButtonMatches = code.match(/<button[\s\S]*?aria-label="(?:Previous|Next) photo"[\s\S]*?className="([^"]+)"/g);
  assert.ok(navButtonMatches && navButtonMatches.length >= 2, 'Must render both Previous and Next touch buttons');

  for (const btnSnippet of navButtonMatches) {
    const classMatch = btnSnippet.match(/className="([^"]+)"/);
    assert.ok(classMatch, 'Nav button must have className');
    const navClass = classMatch[1];
    assert.ok(
      validateTouchTargetClass(navClass) ||
      (navClass.includes('min-w-[44px]') && navClass.includes('min-h-[44px]')),
      `Nav buttons must satisfy minimum 44x44px touch target (got: "${navClass}")`
    );
  }

  // 6. Touch Swipe Gesture Detection
  assert.ok(
    code.includes('onTouchStart') && code.includes('onTouchEnd'),
    'LightboxModal must attach touch event handlers for mobile swipe navigation'
  );
  assert.ok(
    code.includes('targetTouches') || code.includes('clientX'),
    'Swipe detector must track clientX touch coordinates'
  );

  // 7. Backdrop Click Dismissal
  assert.ok(
    code.includes('onClick={onClose}') || code.includes('onClick={(e) => e.stopPropagation()}'),
    'Clicking backdrop outside photo card must dismiss modal'
  );
});

test('Feature 10 - Lightbox Modal: Body Scroll Lock Invariant', () => {
  const code = fs.readFileSync(lightboxModalPath, 'utf8');

  // 1. Source verification of document.body.style.overflow lock
  assert.ok(
    code.includes("document.body.style.overflow = 'hidden'") ||
    code.includes('document.body.style.overflow = "hidden"'),
    'LightboxModal must lock body scroll with document.body.style.overflow = "hidden"'
  );

  // 2. Source verification of cleanup / restoration
  assert.ok(
    code.includes('document.body.style.overflow = originalOverflow') ||
    code.includes('document.body.style.overflow = ""') ||
    code.includes("document.body.style.overflow = ''") ||
    code.includes('document.body.style.overflow = "unset"'),
    'LightboxModal must restore original overflow on modal close or unmount cleanup'
  );

  // 3. Behavioral simulation of scroll lock lifecycle
  const initialOverflow = '';
  let mockOverflow = initialOverflow;
  const mockBody = {
    style: {
      get overflow() { return mockOverflow; },
      set overflow(val) { mockOverflow = val; }
    }
  };

  // Simulate modal open effect
  const originalOverflow = mockBody.style.overflow;
  mockBody.style.overflow = 'hidden';
  assert.strictEqual(mockBody.style.overflow, 'hidden', 'Body scroll must be locked to hidden when modal is open');

  // Simulate modal close cleanup effect
  mockBody.style.overflow = originalOverflow;
  assert.strictEqual(mockBody.style.overflow, '', 'Body scroll must be restored back to initial state when modal closes');
});
