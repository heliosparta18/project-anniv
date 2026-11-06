import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass, MIN_TOUCH_TARGET_SIZE } from '../helpers/responsive_checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const navbarPath = path.join(projectRoot, 'src/components/layout/Navbar.tsx');

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
      const classMatch = tagContent.match(/className="([^"]+)"/);
      const hrefMatch = tagContent.match(/href=(?:"([^"]+)"|{([^}]+)})/);
      const ariaLabelMatch = tagContent.match(/aria-label="([^"]+)"/);
      elements.push({
        tagName,
        href: hrefMatch ? (hrefMatch[1] || hrefMatch[2]) : null,
        ariaLabel: ariaLabelMatch ? ariaLabelMatch[1] : null,
        className: classMatch ? classMatch[1] : '',
        snippet: tagContent
      });
      startRegex.lastIndex = tagEnd + 1;
    }
  }
  return elements;
}

test('Touch Targets: Standard Minimum Size Threshold', () => {
  assert.strictEqual(MIN_TOUCH_TARGET_SIZE, 44, 'WCAG 2.5.5 touch target size requirement is 44px');
});

test('Touch Targets: Real Navbar.tsx Interactive Elements Meet Touch Target Standards', () => {
  assert.ok(fs.existsSync(navbarPath), `Navbar.tsx must exist at ${navbarPath}`);
  const content = fs.readFileSync(navbarPath, 'utf-8');
  const elements = extractInteractiveElements(content);

  assert.ok(elements.length >= 6, `Expected at least 6 interactive elements in Navbar.tsx, found ${elements.length}`);

  for (const el of elements) {
    const desc = `<${el.tagName}> href="${el.href || ''}" aria-label="${el.ariaLabel || ''}"`;
    assert.ok(
      el.className.includes('min-h-[44px]') ||
      el.className.includes('min-w-[44px]') ||
      validateTouchTargetClass(el.className),
      `Element ${desc} must specify touch target minimums (found classes: "${el.className}")`
    );
  }
});

test('Touch Targets: Navbar.tsx Brand and Desktop Links Explicitly Enforce 44px Minimum Height', () => {
  const content = fs.readFileSync(navbarPath, 'utf-8');
  const elements = extractInteractiveElements(content);

  // 1. Brand Logo link (#hero)
  const brand = elements.find(e => e.href === '#hero');
  assert.ok(brand, 'Brand link (#hero) must exist');
  assert.ok(
    brand.className.includes('min-h-[44px]'),
    `Brand link must include min-h-[44px] to satisfy touch target height on touch devices (found: "${brand.className}")`
  );

  // 2. Desktop nav link (item.href)
  const desktopNav = elements.find(e => e.href === 'item.href');
  assert.ok(desktopNav, 'Desktop navigation item must exist');
  assert.ok(
    desktopNav.className.includes('min-h-[44px]'),
    `Desktop nav items must include min-h-[44px] to prevent touch deficit on tablets/laptops (found: "${desktopNav.className}")`
  );

  // 3. Desktop CTA button (#letter)
  const ctaLinks = elements.filter(e => e.href === '#letter');
  assert.ok(ctaLinks.length >= 1, 'CTA button (#letter) must exist');
  for (const cta of ctaLinks) {
    assert.ok(
      cta.className.includes('min-h-[44px]'),
      `CTA button (#letter) must include min-h-[44px] (found: "${cta.className}")`
    );
  }

  // 4. Mobile toggle button
  const toggle = elements.find(e => e.tagName === 'button');
  assert.ok(toggle, 'Mobile toggle button must exist');
  assert.ok(
    toggle.className.includes('min-w-[44px]') && toggle.className.includes('min-h-[44px]'),
    `Mobile toggle button must specify both min-w-[44px] and min-h-[44px] (found: "${toggle.className}")`
  );
});

test('Touch Targets: Navbar.tsx Breakpoint Cleanly Uses Mobile Drawer for Tablet Portrait (<1024px)', () => {
  const content = fs.readFileSync(navbarPath, 'utf-8');

  // Must not switch to desktop navbar at md (768px)
  assert.ok(
    !content.includes('hidden md:flex'),
    'Navbar must not use "hidden md:flex" which causes horizontal clipping at 768px tablet portrait'
  );
  assert.ok(
    !content.includes('flex md:hidden'),
    'Navbar must not hide mobile toggle at md (768px); use lg: breakpoint instead'
  );

  // Must switch at lg (1024px)
  assert.ok(
    content.includes('hidden lg:flex'),
    'Navbar must use "hidden lg:flex" for desktop nav container'
  );
  assert.ok(
    content.includes('flex lg:hidden'),
    'Navbar must use "flex lg:hidden" for mobile toggle container'
  );
  assert.ok(
    content.includes('lg:hidden'),
    'Navbar must use "lg:hidden" on mobile drawer dropdown'
  );
});
