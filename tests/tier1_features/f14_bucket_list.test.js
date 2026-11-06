import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass, MIN_TOUCH_TARGET_SIZE } from '../helpers/responsive_checker.js';
import { bucketListItems } from '../../src/data/anniversaryData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const bucketListPath = path.join(projectRoot, 'src/components/bucketlist/BucketList.tsx');
const bucketListItemPath = path.join(projectRoot, 'src/components/bucketlist/BucketListItem.tsx');
const interactiveBucketListPath = path.join(projectRoot, 'src/components/interactive/BucketList.tsx');

function extractButtonElements(source) {
  const elements = [];
  const startRegex = /<button\s+/g;
  let match;
  while ((match = startRegex.exec(source)) !== null) {
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
      const classMatch = tagContent.match(/className=(?:["']([^"']+)["']|\{`([\s\S]*?)`\})/);
      elements.push({
        tagContent,
        className: classMatch ? (classMatch[1] || classMatch[2]) : ''
      });
      startRegex.lastIndex = tagEnd + 1;
    }
  }
  return elements;
}

test('Feature 14 - Bucket List: Checklist Items Display & Progress Calculation', () => {
  // 1. Component files existence
  assert.ok(fs.existsSync(bucketListPath), 'BucketList.tsx must exist in src/components/bucketlist/');
  assert.ok(fs.existsSync(bucketListItemPath), 'BucketListItem.tsx must exist in src/components/bucketlist/');
  assert.ok(fs.existsSync(interactiveBucketListPath), 'BucketList.tsx must be re-exported in src/components/interactive/');

  const listCode = fs.readFileSync(bucketListPath, 'utf8');
  const itemCode = fs.readFileSync(bucketListItemPath, 'utf8');

  // 2. Component export invariants
  assert.ok(
    listCode.includes('export function BucketList') || listCode.includes('export const BucketList'),
    'BucketList.tsx must export BucketList component'
  );
  assert.ok(
    itemCode.includes('export function BucketListItem') || itemCode.includes('export const BucketListItem'),
    'BucketListItem.tsx must export BucketListItem component'
  );

  // 3. Landmark container and accessibility
  assert.ok(listCode.includes('id="bucket-list"'), 'BucketList must define landmark container id="bucket-list"');
  assert.ok(listCode.includes('scroll-mt-20'), 'BucketList must define scroll-mt-20');
  assert.ok(listCode.includes('overflow-x-clip'), 'BucketList must enforce overflow-x-clip for mobile safety');
  assert.ok(listCode.includes('aria-label='), 'BucketList must include accessible aria-label');

  // 4. Data validation against production bucket list items
  assert.ok(Array.isArray(bucketListItems), 'bucketListItems must be an array');
  assert.strictEqual(bucketListItems.length, 8, 'Must provide exactly 8 bucket list items in production data');
  for (const item of bucketListItems) {
    assert.ok(typeof item.id === 'string' && item.id.length > 0, 'Item id is required');
    assert.ok(typeof item.text === 'string' && item.text.length > 0, 'Item text is required');
    assert.ok(typeof item.completed === 'boolean', 'Item completed flag must be boolean');
  }

  // 5. Dynamic Progress Bar semantics
  assert.ok(listCode.includes('role="progressbar"'), 'BucketList must include semantic role="progressbar"');
  assert.ok(listCode.includes('aria-valuenow='), 'Progress bar must define dynamic aria-valuenow attribute');
  assert.ok(listCode.includes('aria-valuemin='), 'Progress bar must define aria-valuemin attribute');
  assert.ok(listCode.includes('aria-valuemax='), 'Progress bar must define aria-valuemax attribute');
  assert.ok(
    listCode.includes('impian udah terwujud') || listCode.includes('dreams accomplished'),
    'Progress bar banner must announce completed dreams count'
  );

  // 6. Category / Status filter tabs
  assert.ok(listCode.includes('role="tablist"'), 'BucketList must define role="tablist"');
  assert.ok(listCode.includes('role="tab"'), 'Filter pills must declare role="tab"');
  assert.ok(listCode.includes('aria-selected='), 'Filter pills must announce selected state');

  // 7. Touch targets (WCAG 2.5.5 >= 44x44px)
  assert.strictEqual(MIN_TOUCH_TARGET_SIZE, 44, 'WCAG 2.5.5 minimum touch target requirement is 44px');
  const buttons = extractButtonElements(listCode).concat(extractButtonElements(itemCode));
  assert.ok(buttons.length >= 2, 'Must render interactive buttons');
  for (const b of buttons) {
    assert.ok(
      validateTouchTargetClass(b.className) ||
      (b.className.includes('min-h-[44px]') && b.className.includes('min-w-[44px]')),
      `Button must satisfy WCAG >= 44px touch target (got: "${b.className}")`
    );
  }

  // 8. Strict zero em-dash ban per R-02 antislop rules
  assert.ok(!listCode.includes('\u2014') && !listCode.includes('&mdash;'), 'BucketList.tsx must contain 0 em-dashes');
  assert.ok(!itemCode.includes('\u2014') && !itemCode.includes('&mdash;'), 'BucketListItem.tsx must contain 0 em-dashes');
});

test('Feature 14 - Bucket List: Heart Checkbox Toggle and Confetti Celebration', () => {
  const listCode = fs.readFileSync(bucketListPath, 'utf8');
  const itemCode = fs.readFileSync(bucketListItemPath, 'utf8');

  // 1. Heart checkbox semantics
  assert.ok(
    itemCode.includes('role="checkbox"'),
    'BucketListItem toggle button must define semantic role="checkbox"'
  );
  assert.ok(
    itemCode.includes('aria-checked='),
    'BucketListItem toggle button must declare dynamic aria-checked attribute'
  );
  assert.ok(
    itemCode.includes('Heart'),
    'BucketListItem must import and render Heart icon'
  );
  assert.ok(
    itemCode.includes('line-through'),
    'BucketListItem must apply strikethrough typography when dream is accomplished'
  );

  // 2. Celebration confetti integration
  assert.ok(
    listCode.includes("from 'canvas-confetti'") || listCode.includes('from "canvas-confetti"'),
    'BucketList must import canvas-confetti'
  );
  assert.ok(
    listCode.includes('confetti('),
    'BucketList must trigger confetti function when dream is completed'
  );
  assert.ok(
    listCode.includes('disableForReducedMotion'),
    'Confetti trigger must respect reduced motion accessibility preferences'
  );
});

test('Feature 14 - Bucket List: LocalStorage State Persistence', () => {
  const listCode = fs.readFileSync(bucketListPath, 'utf8');

  // 1. Clean namespaced storage key
  assert.ok(
    listCode.includes('anniv_bucket_list_completed') || listCode.includes('BUCKET_LIST_STORAGE_KEY'),
    'BucketList must define isolated localStorage key "anniv_bucket_list_completed"'
  );

  // 2. Storage read and write invocations
  assert.ok(
    listCode.includes('localStorage.getItem'),
    'BucketList must read persistent state using localStorage.getItem'
  );
  assert.ok(
    listCode.includes('localStorage.setItem'),
    'BucketList must persist state using localStorage.setItem'
  );

  // 3. Safe browser environment checks
  assert.ok(
    listCode.includes("typeof window === 'undefined'") || listCode.includes('typeof window !== "undefined"'),
    'BucketList must guard window access for SSR/Node safe execution'
  );
});
