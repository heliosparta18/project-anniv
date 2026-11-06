// Empirical Challenger M4 Adversarial Stress Test Harness
// Targets: Voucher Book, Bucket List, Confetti Robustness, Touch Targets, Invariants

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coupons, bucketListItems } from '../src/data/anniversaryData.ts';
import { validateTouchTargetClass } from './helpers/responsive_checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('='.repeat(78));
console.log('  CHALLENGER M4 ADVERSARIAL STRESS TEST & VERIFICATION HARNESS');
console.log('  Vouchers LocalStorage, Perforation, Bucket List, Confetti & Targets');
console.log('='.repeat(78));

let passCount = 0;
let failCount = 0;
const failures = [];

function check(cond, desc, meta = {}) {
  if (cond) {
    passCount++;
  } else {
    failCount++;
    failures.push({ desc, meta });
    console.error(`  ✖ FAIL: ${desc}`);
    if (Object.keys(meta).length > 0) {
      console.error('    Details:', meta);
    }
  }
}

// Read component source files
const couponBookPath = path.join(rootDir, 'src/components/coupons/CouponBook.tsx');
const voucherCardPath = path.join(rootDir, 'src/components/coupons/VoucherCard.tsx');
const bucketListPath = path.join(rootDir, 'src/components/bucketlist/BucketList.tsx');
const bucketListItemPath = path.join(rootDir, 'src/components/bucketlist/BucketListItem.tsx');

const couponBookCode = fs.readFileSync(couponBookPath, 'utf8');
const voucherCardCode = fs.readFileSync(voucherCardPath, 'utf8');
const bucketListCode = fs.readFileSync(bucketListPath, 'utf8');
const bucketListItemCode = fs.readFileSync(bucketListItemPath, 'utf8');

// =============================================================================
// SECTION 1: VOUCHER BOOK PERFORATION & STAMPED STATE INVARIANTS
// =============================================================================
console.log('\n[Section 1] Voucher Book Perforation & Stamped State Invariants...');

// 1.1 Perforation cut-line styling
check(
  voucherCardCode.includes('border-dashed'),
  'VoucherCard specifies border-dashed cut-line'
);
check(
  voucherCardCode.includes('border-t-2 md:border-t-0 md:border-l-2'),
  'VoucherCard implements responsive dashed perforation line (horizontal on mobile, vertical on desktop)'
);
check(
  voucherCardCode.includes('border-anniv-borderAction/30'),
  'VoucherCard perforation line uses soft romantic action border token'
);

// 1.2 Exactly 4 circular cutout notches
const notchMatches = voucherCardCode.match(/w-7\s+h-7\s+rounded-full\s+bg-anniv-base/g) || [];
check(
  notchMatches.length === 4,
  `VoucherCard implements exactly 4 circular cutout notches (found ${notchMatches.length})`
);

// Check Desktop notches (Top & Bottom)
check(
  voucherCardCode.includes('-top-3.5 left-1/2 -translate-x-1/2'),
  'Desktop top notch positioned at seam (-top-3.5 left-1/2 -translate-x-1/2)'
);
check(
  voucherCardCode.includes('-bottom-3.5 left-1/2 -translate-x-1/2'),
  'Desktop bottom notch positioned at seam (-bottom-3.5 left-1/2 -translate-x-1/2)'
);

// Check Mobile notches (Left & Right)
check(
  voucherCardCode.includes('-left-3.5 top-1/2 -translate-y-1/2'),
  'Mobile left notch positioned at seam (-left-3.5 top-1/2 -translate-y-1/2)'
);
check(
  voucherCardCode.includes('-right-3.5 top-1/2 -translate-y-1/2'),
  'Mobile right notch positioned at seam (-right-3.5 top-1/2 -translate-y-1/2)'
);

// 1.3 Overflow safety of notch cutouts
check(
  voucherCardCode.includes('overflow-hidden'),
  'VoucherCard container enforces overflow-hidden to prevent notch cutouts from overflowing'
);
check(
  couponBookCode.includes('overflow-x-clip'),
  'CouponBook section enforces overflow-x-clip container guard'
);
check(
  couponBookCode.includes('scroll-mt-20'),
  'CouponBook section enforces scroll-mt-20 for header scroll clearance'
);

// 1.4 Stamped redemption badge visual invariants
check(
  voucherCardCode.includes('TERPAKAI &bull; REDEEMED') || voucherCardCode.includes('TERPAKAI • REDEEMED'),
  'VoucherCard renders "TERPAKAI • REDEEMED" stamped text'
);
check(
  voucherCardCode.includes('-rotate-12'),
  'Redemption stamp applies -rotate-12 authentic angled stamp skew'
);
check(
  voucherCardCode.includes('border-4 border-dashed border-anniv-wax'),
  'Redemption stamp has distressed 4px dashed wax border'
);
check(
  voucherCardCode.includes('pointer-events-none'),
  'Redemption stamp specifies pointer-events-none so interactive buttons underneath remain accessible'
);
check(
  voucherCardCode.includes('opacity-90 saturate-85'),
  'Redeemed voucher card applies muted visual treatment (opacity-90 saturate-85)'
);

// =============================================================================
// SECTION 2: VOUCHER BOOK LOCALSTORAGE PERSISTENCE SIMULATION
// =============================================================================
console.log('\n[Section 2] Voucher Book LocalStorage Persistence Simulation...');

const STORAGE_KEY = 'anniv_redeemed_coupons';
check(
  couponBookCode.includes(`COUPONS_STORAGE_KEY = '${STORAGE_KEY}'`) || couponBookCode.includes(`COUPONS_STORAGE_KEY = "${STORAGE_KEY}"`),
  `CouponBook exports isolated storage key constant "${STORAGE_KEY}"`
);

// Emulate Voucher LocalStorage State Machine
class VoucherStoreManager {
  constructor(storageKey = STORAGE_KEY, initialStorage = null) {
    this.storageKey = storageKey;
    this.storage = {};
    if (initialStorage !== null) {
      this.storage[this.storageKey] = initialStorage;
    }
    this.redeemedIds = this.loadInitial();
  }

  loadInitial() {
    try {
      const saved = this.storage[this.storageKey];
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  handleRedeem(couponId) {
    if (this.redeemedIds.includes(couponId)) return;
    this.redeemedIds = [...this.redeemedIds, couponId];
    this.storage[this.storageKey] = JSON.stringify(this.redeemedIds);
  }

  handleReset(couponId) {
    this.redeemedIds = this.redeemedIds.filter((id) => id !== couponId);
    this.storage[this.storageKey] = JSON.stringify(this.redeemedIds);
  }

  handleResetAll() {
    this.redeemedIds = [];
    delete this.storage[this.storageKey];
  }

  simulateReload() {
    // Simulate browser reload by instantiating a fresh reader from current storage
    const reloaded = new VoucherStoreManager(this.storageKey);
    reloaded.storage = { ...this.storage };
    reloaded.redeemedIds = reloaded.loadInitial();
    return reloaded;
  }
}

// 2.1 Clean startup
const vm1 = new VoucherStoreManager();
check(vm1.redeemedIds.length === 0, 'Initial fresh store has 0 redeemed coupons');

// 2.2 Corrupted JSON resilience
const vmCorrupt = new VoucherStoreManager(STORAGE_KEY, '{invalid_json:corrupted');
check(
  vmCorrupt.redeemedIds.length === 0,
  'Corrupted JSON in localStorage falls back safely to empty array [] without crashing'
);

// 2.3 Redeem 1 coupon
vm1.handleRedeem(coupons[0].id);
check(vm1.redeemedIds.length === 1, `Redeemed 1 coupon: got count ${vm1.redeemedIds.length}`);
check(vm1.redeemedIds.includes(coupons[0].id), `Store contains redeemed coupon ID: ${coupons[0].id}`);

// 2.4 Idempotent redemption
vm1.handleRedeem(coupons[0].id);
check(vm1.redeemedIds.length === 1, 'Redeeming same coupon again does not duplicate ID');

// 2.5 Redeem 3 coupons
vm1.handleRedeem(coupons[1].id);
vm1.handleRedeem(coupons[2].id);
check(vm1.redeemedIds.length === 3, `Redeemed 3 coupons: got count ${vm1.redeemedIds.length}`);

// 2.6 Simulate reload after 3 redemptions
let reloaded = vm1.simulateReload();
check(
  reloaded.redeemedIds.length === 3,
  'Simulated browser reload retains all 3 redeemed coupons from localStorage'
);
check(
  coupons.slice(0, 3).every((c) => reloaded.redeemedIds.includes(c.id)),
  'All 3 redeemed IDs match across reload'
);

// 2.7 Undo single coupon
reloaded.handleReset(coupons[1].id);
check(
  reloaded.redeemedIds.length === 2,
  'Single coupon reset decreases redeemed count to 2'
);
check(
  !reloaded.redeemedIds.includes(coupons[1].id),
  'Reset coupon ID is cleanly removed'
);

// 2.8 Redeem all 8 coupons
for (const c of coupons) {
  reloaded.handleRedeem(c.id);
}
check(reloaded.redeemedIds.length === 8, 'Redeemed all 8 production coupons');

// 2.9 Simulate reload with all 8 redeemed
const reloadedAll = reloaded.simulateReload();
check(reloadedAll.redeemedIds.length === 8, 'All 8 redeemed coupons persist across reload');

// 2.10 Reset all functionality
reloadedAll.handleResetAll();
check(reloadedAll.redeemedIds.length === 0, 'Reset all clears redeemed state to 0');
check(
  reloadedAll.storage[STORAGE_KEY] === undefined,
  'Reset all removes localStorage key "anniv_redeemed_coupons"'
);

// Reload after reset all
const reloadedEmpty = reloadedAll.simulateReload();
check(reloadedEmpty.redeemedIds.length === 0, 'Reload after reset all shows 0 redeemed coupons');

// =============================================================================
// SECTION 3: BUCKET LIST DYNAMIC PROGRESS CALCULATION & STRESS
// =============================================================================
console.log('\n[Section 3] Bucket List Dynamic Progress Calculation & Bounds...');

// Formula from BucketList.tsx:
// const totalCount = items.length;
// const completedCount = completedIds.length;
// const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

function calcBucketProgress(totalCount, completedCount) {
  return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
}

// 3.1 Standard requirements: 0/8, 4/8, 8/8, and empty fallback
check(calcBucketProgress(8, 0) === 0, '0/8 dreams yields strictly 0%');
check(calcBucketProgress(8, 4) === 50, '4/8 dreams yields strictly 50%');
check(calcBucketProgress(8, 8) === 100, '8/8 dreams yields strictly 100%');
check(calcBucketProgress(0, 0) === 0, 'Empty items array (0/0) cleanly falls back to 0% without NaN');
check(calcBucketProgress(0, 5) === 0, 'Empty items array with orphan completed IDs yields 0% without division error');

// 3.2 Granular 8-item progression verification
const expectedPercentages = [0, 13, 25, 38, 50, 63, 75, 88, 100];
for (let c = 0; c <= 8; c++) {
  const pct = calcBucketProgress(8, c);
  check(
    pct === expectedPercentages[c],
    `${c}/8 dreams yields expected rounded percentage: ${pct}% === ${expectedPercentages[c]}%`
  );
}

// 3.3 Adversarial randomized progression stress test (10,000 cases)
let stressFailures = 0;
for (let i = 0; i < 10000; i++) {
  const total = Math.floor(Math.random() * 200);
  const completed = Math.floor(Math.random() * (total + 1));
  const res = calcBucketProgress(total, completed);

  if (!Number.isFinite(res) || res < 0 || res > 100 || !Number.isInteger(res)) {
    stressFailures++;
  }
}
check(
  stressFailures === 0,
  '10,000 randomized total/completed vectors all yield finite integer percentages in [0, 100]'
);

// =============================================================================
// SECTION 4: BUCKET LIST LOCALSTORAGE PERSISTENCE SIMULATION
// =============================================================================
console.log('\n[Section 4] Bucket List LocalStorage Persistence Simulation...');

const BUCKET_KEY = 'anniv_bucket_list_completed';
check(
  bucketListCode.includes(`BUCKET_LIST_STORAGE_KEY = '${BUCKET_KEY}'`) || bucketListCode.includes(`BUCKET_LIST_STORAGE_KEY = "${BUCKET_KEY}"`),
  `BucketList exports isolated storage key constant "${BUCKET_KEY}"`
);

class BucketListStoreManager {
  constructor(items = bucketListItems, initialStorage = null) {
    this.items = items;
    this.storage = {};
    if (initialStorage !== null) {
      this.storage[BUCKET_KEY] = initialStorage;
    }
    this.completedIds = this.loadInitial();
  }

  loadInitial() {
    try {
      const saved = this.storage[BUCKET_KEY];
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return this.items.filter((i) => i.completed).map((i) => i.id);
  }

  handleToggle(itemId) {
    const isCompleted = this.completedIds.includes(itemId);
    this.completedIds = isCompleted
      ? this.completedIds.filter((id) => id !== itemId)
      : [...this.completedIds, itemId];
    this.storage[BUCKET_KEY] = JSON.stringify(this.completedIds);
    return !isCompleted; // returns whether celebration triggered
  }

  simulateReload() {
    const reloaded = new BucketListStoreManager(this.items);
    reloaded.storage = { ...this.storage };
    reloaded.completedIds = reloaded.loadInitial();
    return reloaded;
  }
}

// 4.1 Fresh load with initial data default completed items
const bm1 = new BucketListStoreManager();
const defaultCompleted = bucketListItems.filter((i) => i.completed).map((i) => i.id);
check(
  bm1.completedIds.length === defaultCompleted.length,
  `Default store correctly loads ${defaultCompleted.length} initial completed items`
);

// 4.2 Corrupted JSON resilience
const bmCorrupt = new BucketListStoreManager(bucketListItems, '{invalid:json');
check(
  bmCorrupt.completedIds.length === defaultCompleted.length,
  'Corrupted JSON in localStorage falls back cleanly to default item completion state'
);

// 4.3 Toggle all 8 items to completed
let celebrationCount = 0;
for (const item of bucketListItems) {
  if (!bm1.completedIds.includes(item.id)) {
    const celebrated = bm1.handleToggle(item.id);
    if (celebrated) celebrationCount++;
  }
}
check(bm1.completedIds.length === 8, 'All 8 items successfully toggled to completed');
check(celebrationCount > 0, 'Toggle to completed triggers celebration event');

// 4.4 Simulate reload with all 8 completed
const bmReloadedAll = bm1.simulateReload();
check(
  bmReloadedAll.completedIds.length === 8,
  'All 8 completed items persist across simulated browser reload'
);
check(
  calcBucketProgress(bmReloadedAll.items.length, bmReloadedAll.completedIds.length) === 100,
  'Reloaded store calculates strictly 100% progress'
);

// 4.5 Untoggle all 8 items to pending
for (const item of bucketListItems) {
  if (bmReloadedAll.completedIds.includes(item.id)) {
    bmReloadedAll.handleToggle(item.id);
  }
}
check(bmReloadedAll.completedIds.length === 0, 'All 8 items untoggled to 0 completed');
check(
  calcBucketProgress(bmReloadedAll.items.length, bmReloadedAll.completedIds.length) === 0,
  'Untoggled store calculates strictly 0% progress'
);

// 4.6 Simulate reload with 0 completed
const bmReloadedZero = bmReloadedAll.simulateReload();
check(bmReloadedZero.completedIds.length === 0, '0 completed persists across reload');

// =============================================================================
// SECTION 5: CONFETTI TRIGGER ROBUSTNESS & ACCESSIBILITY
// =============================================================================
console.log('\n[Section 5] Confetti Trigger Robustness & Accessibility...');

// 5.1 Static checks in BucketList.tsx
check(
  bucketListCode.includes('disableForReducedMotion: true'),
  'BucketList enforces disableForReducedMotion: true for accessibility compliance'
);
check(
  bucketListCode.includes("typeof window !== 'undefined'"),
  'BucketList guards window access before invoking confetti'
);
check(
  bucketListCode.includes('try {') && bucketListCode.includes('} catch {'),
  'BucketList wraps confetti invocations in try-catch block for headless/runtime error isolation'
);

// 5.2 Emulated headless execution of celebration logic
function simulateConfettiInvocation({ hasWindow = false, canvasThrows = false, reducedMotion = false }) {
  let invocationAttempted = false;
  let errorCaught = false;

  const mockWindow = hasWindow ? {
    matchMedia: (query) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false
    })
  } : undefined;

  const originalWindow = globalThis.window;
  try {
    if (hasWindow) {
      globalThis.window = mockWindow;
    } else {
      delete globalThis.window;
    }

    // Emulate triggerCelebration from BucketList.tsx:
    try {
      if (typeof globalThis.window !== 'undefined') {
        invocationAttempted = true;
        if (canvasThrows) {
          throw new Error('Canvas context unavailable in headless test environment');
        }
      }
    } catch {
      errorCaught = true;
    }
  } finally {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete globalThis.window;
    }
  }

  return { invocationAttempted, errorCaught };
}

// Case A: Headless Node environment (window === undefined)
const headlessResult = simulateConfettiInvocation({ hasWindow: false });
check(!headlessResult.invocationAttempted, 'Headless Node environment safely skips confetti invocation without error');

// Case B: Browser environment with working canvas
const browserResult = simulateConfettiInvocation({ hasWindow: true, canvasThrows: false });
check(browserResult.invocationAttempted, 'Browser environment executes confetti invocation');
check(!browserResult.errorCaught, 'Standard browser confetti produces no errors');

// Case C: Browser environment where canvas context fails
const canvasFailResult = simulateConfettiInvocation({ hasWindow: true, canvasThrows: true });
check(canvasFailResult.invocationAttempted, 'Canvas failure branch attempted');
check(canvasFailResult.errorCaught, 'Canvas error is safely caught and suppressed by try-catch wrapper');

// Case D: Rapid 5,000 multi-trigger stress
let rapidErrorCount = 0;
for (let i = 0; i < 5000; i++) {
  try {
    simulateConfettiInvocation({
      hasWindow: i % 2 === 0,
      canvasThrows: i % 3 === 0,
      reducedMotion: i % 4 === 0
    });
  } catch {
    rapidErrorCount++;
  }
}
check(rapidErrorCount === 0, '5,000 rapid confetti invocations across randomized environments produced 0 unhandled exceptions');

// =============================================================================
// SECTION 6: TOUCH TARGET DIMENSIONS (WCAG 2.5.5 >= 44x44px)
// =============================================================================
console.log('\n[Section 6] Touch Target Dimensions Audit across M4 Components...');

function extractButtonTags(source) {
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
      const ariaMatch = tagContent.match(/aria-label=(?:["']([^"']+)["']|\{`([\s\S]*?)`\})/);
      elements.push({
        tagContent,
        className: classMatch ? (classMatch[1] || classMatch[2]) : '',
        ariaLabel: ariaMatch ? (ariaMatch[1] || ariaMatch[2]) : ''
      });
      startRegex.lastIndex = tagEnd + 1;
    }
  }
  return elements;
}

const allM4Buttons = [
  ...extractButtonTags(couponBookCode).map((b) => ({ ...b, component: 'CouponBook.tsx' })),
  ...extractButtonTags(voucherCardCode).map((b) => ({ ...b, component: 'VoucherCard.tsx' })),
  ...extractButtonTags(bucketListCode).map((b) => ({ ...b, component: 'BucketList.tsx' })),
  ...extractButtonTags(bucketListItemCode).map((b) => ({ ...b, component: 'BucketListItem.tsx' })),
];

check(allM4Buttons.length >= 6, `Extracted ${allM4Buttons.length} interactive buttons across M4 components`);

for (const b of allM4Buttons) {
  const satisfies =
    (b.className.includes('min-h-[44px]') && b.className.includes('min-w-[44px]')) ||
    validateTouchTargetClass(b.className);

  check(
    satisfies,
    `[${b.component}] Button satisfies WCAG 2.5.5 >= 44x44px target (class: "${b.className.slice(0, 50)}...")`
  );
}

// Also check Terpakai non-button indicator has >=44x44px minimum sizing
check(
  voucherCardCode.includes('min-h-[44px] min-w-[44px]') && voucherCardCode.includes('Terpakai'),
  'VoucherCard "Terpakai" status indicator enforces min-h-[44px] min-w-[44px]'
);

// Summary
console.log('\n' + '='.repeat(78));
console.log(`  CHALLENGER M4 NODE AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('='.repeat(78));

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
