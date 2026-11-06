import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass, MIN_TOUCH_TARGET_SIZE } from '../helpers/responsive_checker.js';
import { coupons } from '../../src/data/anniversaryData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const couponBookPath = path.join(projectRoot, 'src/components/coupons/CouponBook.tsx');
const voucherCardPath = path.join(projectRoot, 'src/components/coupons/VoucherCard.tsx');
const interactiveCouponBookPath = path.join(projectRoot, 'src/components/interactive/CouponBook.tsx');

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

test('Feature 13 - Voucher Book: Coupon Rendering and Perforated Border Styling', () => {
  // 1. Component files existence
  assert.ok(fs.existsSync(couponBookPath), 'CouponBook.tsx must exist in src/components/coupons/');
  assert.ok(fs.existsSync(voucherCardPath), 'VoucherCard.tsx must exist in src/components/coupons/');
  assert.ok(fs.existsSync(interactiveCouponBookPath), 'CouponBook.tsx must be re-exported in src/components/interactive/');

  const bookCode = fs.readFileSync(couponBookPath, 'utf8');
  const cardCode = fs.readFileSync(voucherCardPath, 'utf8');

  // 2. Component export invariants
  assert.ok(
    bookCode.includes('export function CouponBook') || bookCode.includes('export const CouponBook'),
    'CouponBook.tsx must export CouponBook component'
  );
  assert.ok(
    cardCode.includes('export function VoucherCard') || cardCode.includes('export const VoucherCard'),
    'VoucherCard.tsx must export VoucherCard component'
  );

  // 3. Landmark container and accessibility
  assert.ok(bookCode.includes('id="coupons"'), 'CouponBook must define landmark container id="coupons"');
  assert.ok(bookCode.includes('scroll-mt-20'), 'CouponBook must define scroll-mt-20 to avoid sticky header clipping');
  assert.ok(bookCode.includes('overflow-x-clip'), 'CouponBook must enforce overflow-x-clip for mobile safety');
  assert.ok(bookCode.includes('aria-label='), 'CouponBook must include accessible aria-label');

  // 4. Perforated ticket styling & circular cutout notches
  assert.ok(
    cardCode.includes('border-dashed'),
    'VoucherCard must feature dashed perforation cut-line (border-dashed)'
  );
  assert.ok(
    cardCode.includes('rounded-full') && cardCode.includes('bg-anniv-base'),
    'VoucherCard must render circular cutout notches at perforation seam'
  );
  assert.ok(
    cardCode.includes('bg-anniv-card'),
    'VoucherCard must use warm ivory/linen background token (bg-anniv-card)'
  );

  // 5. Data validation against production coupons array
  assert.ok(Array.isArray(coupons), 'coupons must be an array');
  assert.strictEqual(coupons.length, 8, 'Must provide exactly 8 coupons in production data');
  for (const c of coupons) {
    assert.ok(typeof c.id === 'string' && c.id.length > 0, 'Coupon id is required');
    assert.ok(typeof c.title === 'string' && c.title.length > 0, 'Coupon title is required');
    assert.ok(typeof c.description === 'string' && c.description.length > 0, 'Coupon description is required');
    assert.ok(typeof c.terms === 'string' && c.terms.length > 0, 'Coupon terms are required');
    assert.ok(['treat', 'activity', 'pass'].includes(c.category), 'Coupon category must be valid');
  }

  // 6. Tablist accessibility and Filter Tabs
  assert.ok(bookCode.includes('role="tablist"'), 'CouponBook must render role="tablist" container');
  assert.ok(bookCode.includes('role="tab"'), 'Filter tabs must define role="tab"');
  assert.ok(bookCode.includes('aria-selected='), 'Filter tabs must declare aria-selected attribute');
  assert.ok(bookCode.includes("'available'") || bookCode.includes('"available"'), 'Must support "available" tab');
  assert.ok(bookCode.includes("'redeemed'") || bookCode.includes('"redeemed"'), 'Must support "redeemed" tab');

  // 7. Interactive touch target compliance (WCAG 2.5.5 >= 44x44px)
  assert.strictEqual(MIN_TOUCH_TARGET_SIZE, 44, 'WCAG 2.5.5 minimum touch target requirement is 44px');
  const buttons = extractButtonElements(bookCode).concat(extractButtonElements(cardCode));
  assert.ok(buttons.length >= 2, 'Must render interactive buttons');
  for (const b of buttons) {
    assert.ok(
      validateTouchTargetClass(b.className) ||
      (b.className.includes('min-h-[44px]') && b.className.includes('min-w-[44px]')),
      `Button must satisfy WCAG >= 44px touch target (got: "${b.className}")`
    );
  }

  // 8. Strict zero em-dash ban per R-02 antislop rules
  assert.ok(!bookCode.includes('\u2014') && !bookCode.includes('&mdash;'), 'CouponBook.tsx must contain 0 em-dashes');
  assert.ok(!cardCode.includes('\u2014') && !cardCode.includes('&mdash;'), 'VoucherCard.tsx must contain 0 em-dashes');
});

test('Feature 13 - Voucher Book: Redeem Action and Stamped State', () => {
  const bookCode = fs.readFileSync(couponBookPath, 'utf8');
  const cardCode = fs.readFileSync(voucherCardPath, 'utf8');

  // 1. Redeem action handlers
  assert.ok(
    cardCode.includes('onRedeem') && cardCode.includes('isRedeemed'),
    'VoucherCard must handle onRedeem action and isRedeemed state'
  );
  assert.ok(
    bookCode.includes('handleRedeem') || bookCode.includes('setRedeemedIds'),
    'CouponBook must manage redeemed voucher IDs'
  );

  // 2. Distressed "TERPAKAI / REDEEMED" stamp visual state
  assert.ok(
    cardCode.includes('TERPAKAI') || cardCode.includes('REDEEMED'),
    'VoucherCard must render TERPAKAI / REDEEMED text when redeemed'
  );
  assert.ok(
    cardCode.includes('-rotate-12') || cardCode.includes('rotate-'),
    'Redemption stamp must apply dynamic tilt rotation'
  );
  assert.ok(
    cardCode.includes('border-dashed') || cardCode.includes('border-4'),
    'Redemption stamp must feature thick distressed border'
  );
  assert.ok(
    cardCode.includes('anniv-wax') || cardCode.includes('red-'),
    'Redemption stamp must use romantic red/wax accent styling'
  );

  // 3. Reset/Undo capability
  assert.ok(
    cardCode.includes('onReset') || bookCode.includes('handleReset'),
    'VoucherCard and CouponBook must support reset / un-redeem capability'
  );
});

test('Feature 13 - Voucher Book: LocalStorage State Persistence', () => {
  const bookCode = fs.readFileSync(couponBookPath, 'utf8');

  // 1. Clean namespaced storage key
  assert.ok(
    bookCode.includes('anniv_redeemed_coupons') || bookCode.includes('COUPONS_STORAGE_KEY'),
    'CouponBook must define isolated localStorage key "anniv_redeemed_coupons"'
  );

  // 2. Storage read and write invocations
  assert.ok(
    bookCode.includes('localStorage.getItem'),
    'CouponBook must read persistent state using localStorage.getItem'
  );
  assert.ok(
    bookCode.includes('localStorage.setItem'),
    'CouponBook must persist state using localStorage.setItem'
  );

  // 3. Safe browser environment checks
  assert.ok(
    bookCode.includes("typeof window === 'undefined'") || bookCode.includes('typeof window !== "undefined"'),
    'CouponBook must guard window access for SSR/Node safe execution'
  );
});
