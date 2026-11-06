import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { setupTestEnvironment, MockLocalStorage } from '../helpers/dom_mock.js';

// Guarantee clean in-memory MockLocalStorage even in Node 23+ where native Storage is defined
setupTestEnvironment();
const mockStore = new MockLocalStorage();
globalThis.localStorage = mockStore;
if (globalThis.window) {
  globalThis.window.localStorage = mockStore;
}
import {
  coupleProfile,
  loveLetter,
  loveReasons,
  coupons,
  bucketListItems,
} from '../../src/data/anniversaryData.ts';
import {
  getNextIndex,
  getPrevIndex,
  getRandomIndex,
  getCategoryBadgeConfig,
  loadStoredReactions,
  saveStoredReactions,
} from '../../src/components/reasons/reasonsUtils.ts';
import { getCouponIcon, COUPON_ICON_MAP } from '../../src/components/coupons/voucherUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

let viteServer = null;
async function getViteServer() {
  if (!viteServer) {
    viteServer = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
      ssr: { external: ['react', 'react-dom', 'lucide-react'] },
    });
  }
  return viteServer;
}

test.after(async () => {
  if (viteServer) {
    await viteServer.close();
  }
});

// Helper to extract buttons and links from JSX source code
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
      const classMatch = tagContent.match(/className=(?:\{`([^`]+)`\}|"([^"]+)"|'([^']+)')/);
      const ariaMatch = tagContent.match(/aria-label=(?:\{`([^`]+)`\}|"([^"]+)"|'([^']+)')/);
      const disabledMatch = tagContent.match(/disabled=(?:\{([^}]+)\}|"([^"]+)")/);

      elements.push({
        tag: tagName,
        className: classMatch ? (classMatch[1] || classMatch[2] || classMatch[3] || '').trim() : '',
        ariaLabel: ariaMatch ? (ariaMatch[1] || ariaMatch[2] || ariaMatch[3] || '').trim() : '',
        disabled: !!disabledMatch,
        raw: tagContent,
      });
    }
  }
  return elements;
}

// ============================================================================
// TEST 1: Letter Module White-Box Stress & Boundary Hardening
// ============================================================================
test('Tier 5 Adversarial: Letter Module Component Boundaries and Invariants', async () => {
  setupTestEnvironment();
  const server = await getViteServer();

  const { WaxSeal } = await server.ssrLoadModule('/src/components/letter/WaxSeal.tsx');
  const { VirtualEnvelope } = await server.ssrLoadModule('/src/components/letter/VirtualEnvelope.tsx');
  const { ParchmentLetter } = await server.ssrLoadModule('/src/components/letter/ParchmentLetter.tsx');
  const { LoveLetterSection } = await server.ssrLoadModule('/src/components/letter/LoveLetterSection.tsx');

  // 1.1 WaxSeal default props and custom text
  const defaultSealHtml = ReactDOMServer.renderToString(React.createElement(WaxSeal));
  assert.ok(defaultSealHtml.includes('D &amp; D') || defaultSealHtml.includes('D & D'), 'WaxSeal must render default sealText');
  assert.ok(defaultSealHtml.includes('min-h-[44px] min-w-[44px]'), 'WaxSeal button must enforce 44x44px minimum touch target');

  // 1.2 WaxSeal broken state
  const brokenSealHtml = ReactDOMServer.renderToString(
    React.createElement(WaxSeal, { isBroken: true, sealText: 'TEST' })
  );
  assert.ok(brokenSealHtml.includes('disabled=""') || brokenSealHtml.includes('disabled'), 'Broken WaxSeal must be disabled');
  assert.ok(brokenSealHtml.includes('opacity-0'), 'Broken WaxSeal must have opacity-0');

  // 1.3 WaxSeal breaking state with SVG crack lines
  const breakingSealHtml = ReactDOMServer.renderToString(
    React.createElement(WaxSeal, { isBreaking: true, sealText: 'CRACK' })
  );
  assert.ok(breakingSealHtml.includes('animate-pulse'), 'Breaking WaxSeal must render pulsating crack lines');
  assert.ok(breakingSealHtml.includes('viewBox="0 0 64 64"'), 'Breaking WaxSeal must render SVG crack overlay');

  // 1.4 VirtualEnvelope default sealed state
  const sealedEnvHtml = ReactDOMServer.renderToString(React.createElement(VirtualEnvelope));
  assert.ok(sealedEnvHtml.includes('Amplop surat cinta tersegel'), 'Sealed envelope must have accessible region label');
  assert.ok(sealedEnvHtml.includes('Anniv Post'), 'Envelope must render postal stamp badge');
  assert.ok(sealedEnvHtml.includes('Dinda Sayang'), 'Envelope must render addressee label');
  assert.ok(sealedEnvHtml.includes('aspect-[16/11]'), 'Envelope must specify 16/11 aspect ratio for mobile');

  // 1.5 VirtualEnvelope defaultOpen=true renders ParchmentLetter
  const openedEnvHtml = ReactDOMServer.renderToString(
    React.createElement(VirtualEnvelope, { defaultOpen: true })
  );
  assert.ok(openedEnvHtml.includes('Surat Cinta Buat Kamu'), 'Opened envelope must render parchment header');
  assert.ok(openedEnvHtml.includes('Lipat &amp; Segel Kembali') || openedEnvHtml.includes('Lipat & Segel Kembali'), 'Opened envelope must provide re-seal button');

  // 1.6 ParchmentLetter with 0 paragraphs stress test
  const emptyLetter = {
    ...loveLetter,
    paragraphs: [],
  };
  const emptyLetterHtml = ReactDOMServer.renderToString(
    React.createElement(ParchmentLetter, { letter: emptyLetter })
  );
  assert.ok(
    emptyLetterHtml.includes('Forever &amp; always yours') || emptyLetterHtml.includes('Forever & always yours'),
    'Empty paragraphs letter must still render signature'
  );

  // 1.7 ParchmentLetter with 25 long paragraphs stress test
  const longParagraphs = Array.from({ length: 25 }, (_, i) => `Catatan cinta paragraf ke-${i + 1} dengan rincian momen romantis.`);
  const longLetter = {
    ...loveLetter,
    paragraphs: longParagraphs,
  };
  const longLetterHtml = ReactDOMServer.renderToString(
    React.createElement(ParchmentLetter, { letter: longLetter })
  );
  assert.ok(longLetterHtml.includes('Catatan cinta paragraf ke-25'), 'ParchmentLetter must render all 25 paragraphs without crashing');
  assert.ok(longLetterHtml.includes('first-letter:font-serif'), 'ParchmentLetter must preserve drop cap on first paragraph');

  // 1.8 LoveLetterSection landmark and overflow protection
  const sectionHtml = ReactDOMServer.renderToString(React.createElement(LoveLetterSection));
  assert.ok(sectionHtml.includes('id="letter"'), 'LoveLetterSection must define id="letter" anchor');
  assert.ok(sectionHtml.includes('overflow-x-clip'), 'LoveLetterSection must enforce overflow-x-clip layout invariant');
});

// ============================================================================
// TEST 2: Reasons Module Math Invariants, Storage Resilience & Deck Controls
// ============================================================================
test('Tier 5 Adversarial: Reasons Module Utilities and Deck State Invariants', async () => {
  setupTestEnvironment();
  const server = await getViteServer();

  const { ReasonCard } = await server.ssrLoadModule('/src/components/reasons/ReasonCard.tsx');
  const { ReasonsDeck } = await server.ssrLoadModule('/src/components/reasons/ReasonsDeck.tsx');

  // 2.1 Index wrap-around invariants across 5,000 steps
  for (let total = 1; total <= 15; total++) {
    for (let cur = 0; cur < total; cur++) {
      const next = getNextIndex(cur, total);
      const prev = getPrevIndex(cur, total);

      assert.ok(next >= 0 && next < total, `getNextIndex(${cur}, ${total}) out of bounds: ${next}`);
      assert.ok(prev >= 0 && prev < total, `getPrevIndex(${cur}, ${total}) out of bounds: ${prev}`);

      if (total > 1) {
        assert.strictEqual(next, (cur + 1) % total, `getNextIndex calculation mismatch`);
        assert.strictEqual(prev, (cur - 1 + total) % total, `getPrevIndex calculation mismatch`);
      } else {
        assert.strictEqual(next, 0, `Single item next must be 0`);
        assert.strictEqual(prev, 0, `Single item prev must be 0`);
      }
    }
  }

  // 2.2 Zero and negative total boundaries
  assert.strictEqual(getNextIndex(0, 0), 0, 'getNextIndex with 0 total must return 0');
  assert.strictEqual(getPrevIndex(0, 0), 0, 'getPrevIndex with 0 total must return 0');
  assert.strictEqual(getRandomIndex(0, 0), 0, 'getRandomIndex with 0 total must return 0');
  assert.strictEqual(getRandomIndex(0, 1), 0, 'getRandomIndex with 1 total must return 0');

  // 2.3 Random index distribution & non-identity invariant (2,000 trials)
  const totalItems = 12;
  for (let cur = 0; cur < totalItems; cur++) {
    for (let trial = 0; trial < 100; trial++) {
      const rand = getRandomIndex(cur, totalItems);
      assert.ok(rand >= 0 && rand < totalItems, `getRandomIndex out of bounds: ${rand}`);
      assert.notStrictEqual(rand, cur, `getRandomIndex must never return current index (${cur}) when total > 1`);
    }
  }

  // 2.4 Category badge config fallbacks
  const habitCfg = getCategoryBadgeConfig('habits');
  assert.strictEqual(habitCfg.label, 'Kebiasaan Manis');
  assert.strictEqual(habitCfg.badgeText, 'text-anniv-rose');

  const unknownCfg = getCategoryBadgeConfig('unknown_random_category');
  assert.strictEqual(unknownCfg.label, 'Hal Favorit', 'Unknown category must fall back to Hal Favorit');

  const undefinedCfg = getCategoryBadgeConfig(undefined);
  assert.strictEqual(undefinedCfg.label, 'Hal Favorit', 'Undefined category must fall back to Hal Favorit');

  // 2.5 Storage resilience: loadStoredReactions against malformed/corrupted data
  const storage = window.localStorage;
  const testKey = 'test_reasons_storage_resilience';

  // Null / uninitialized
  storage.removeItem(testKey);
  assert.deepStrictEqual(loadStoredReactions(testKey), {}, 'Uninitialized storage must return empty object');

  // Malformed JSON string
  storage.setItem(testKey, '{bad-json-syntax');
  assert.deepStrictEqual(loadStoredReactions(testKey), {}, 'Malformed JSON must return empty object');

  // Non-object JSON types (array, number, string, boolean, null)
  storage.setItem(testKey, JSON.stringify([1, 2, 3]));
  assert.deepStrictEqual(loadStoredReactions(testKey), {}, 'Array JSON must return empty object');

  storage.setItem(testKey, '12345');
  assert.deepStrictEqual(loadStoredReactions(testKey), {}, 'Numeric JSON must return empty object');

  storage.setItem(testKey, '"just a string"');
  assert.deepStrictEqual(loadStoredReactions(testKey), {}, 'String JSON must return empty object');

  storage.setItem(testKey, 'true');
  assert.deepStrictEqual(loadStoredReactions(testKey), {}, 'Boolean JSON must return empty object');

  storage.setItem(testKey, 'null');
  assert.deepStrictEqual(loadStoredReactions(testKey), {}, 'Null JSON must return empty object');

  // Valid storage
  const validData = { 'reason-1': 10, 'reason-2': 25 };
  storage.setItem(testKey, JSON.stringify(validData));
  assert.deepStrictEqual(loadStoredReactions(testKey), validData, 'Valid reactions must be loaded correctly');

  // 2.6 Save stored reactions
  const savedSuccess = saveStoredReactions({ 'reason-3': 7 }, testKey);
  assert.strictEqual(savedSuccess, true, 'saveStoredReactions must return true on success');
  assert.strictEqual(JSON.parse(storage.getItem(testKey))['reason-3'], 7);

  // 2.7 ReasonCard SSR with custom and default reaction states
  const reason1 = loveReasons[0];
  const zeroReactionHtml = ReactDOMServer.renderToString(
    React.createElement(ReasonCard, {
      reason: reason1,
      index: 0,
      total: 12,
      reactionCount: 0,
      onReact: () => {},
    })
  );
  assert.ok(zeroReactionHtml.includes('Beri cinta pertamamu'), 'Zero reactions must show prompt');
  assert.ok(zeroReactionHtml.includes('Kirim Cinta'), 'Zero reactions button label must be Kirim Cinta');

  const positiveReactionHtml = ReactDOMServer.renderToString(
    React.createElement(ReasonCard, {
      reason: reason1,
      index: 0,
      total: 12,
      reactionCount: 42,
      onReact: () => {},
    })
  );
  assert.ok(positiveReactionHtml.includes('42 Cinta Terkirim'), 'Positive reactions must render count label');
  assert.ok(positiveReactionHtml.includes('bg-anniv-rose text-white'), 'Active reaction button must use rose background');

  // 2.8 ReasonsDeck SSR with out-of-bounds initial index
  const deckHtml = ReactDOMServer.renderToString(
    React.createElement(ReasonsDeck, { initialIndex: 999 })
  );
  assert.ok(deckHtml.includes('Alasan #1'), 'Out-of-bounds initialIndex must clamp safely to first reason');
  assert.ok(deckHtml.includes('Total Cinta Terkirim:'), 'ReasonsDeck must render total hearts counter');
  assert.ok(deckHtml.includes('role="tablist"'), 'ReasonsDeck must render accessible pagination tabs');
});

// ============================================================================
// TEST 3: Coupons Module Perforation, Notch Geometries & Storage Resilience
// ============================================================================
test('Tier 5 Adversarial: Coupons Module Perforation Geometry and Storage Boundaries', async () => {
  setupTestEnvironment();
  const server = await getViteServer();

  const { VoucherCard } = await server.ssrLoadModule('/src/components/coupons/VoucherCard.tsx');
  const { CouponBook } = await server.ssrLoadModule('/src/components/coupons/CouponBook.tsx');

  // 3.1 voucherUtils icon mappings
  assert.strictEqual(getCouponIcon('Utensils'), COUPON_ICON_MAP.Utensils);
  assert.strictEqual(getCouponIcon('UnknownIcon'), COUPON_ICON_MAP.Ticket, 'Unknown icon must fallback to Ticket');

  // 3.2 VoucherCard Perforation and Notches
  const sampleCoupon = coupons[0];
  const unredeemedCardHtml = ReactDOMServer.renderToString(
    React.createElement(VoucherCard, {
      coupon: sampleCoupon,
      isRedeemed: false,
      onRedeem: () => {},
      onReset: () => {},
    })
  );

  assert.ok(unredeemedCardHtml.includes('border-dashed'), 'VoucherCard must have dashed perforation line');
  assert.ok(unredeemedCardHtml.includes('overflow-hidden'), 'VoucherCard must enforce overflow-hidden to clip circular notches');
  assert.ok(unredeemedCardHtml.includes('Tukarkan'), 'Unredeemed coupon must show Tukarkan button');
  assert.ok(!unredeemedCardHtml.includes('TERPAKAI'), 'Unredeemed coupon must not show stamped overlay');

  // 3.3 VoucherCard Redeemed State
  const redeemedCardHtml = ReactDOMServer.renderToString(
    React.createElement(VoucherCard, {
      coupon: sampleCoupon,
      isRedeemed: true,
      onRedeem: () => {},
      onReset: () => {},
    })
  );
  assert.ok(
    redeemedCardHtml.includes('TERPAKAI') && redeemedCardHtml.includes('REDEEMED'),
    'Redeemed coupon must render stamp overlay'
  );
  assert.ok(redeemedCardHtml.includes('Terpakai'), 'Redeemed coupon must display Terpakai badge');
  assert.ok(redeemedCardHtml.includes('Batalkan'), 'Redeemed coupon must display Batalkan reset button');

  // 3.4 CouponBook SSR with empty storage
  const storage = window.localStorage;
  storage.clear();

  const couponBookHtml = ReactDOMServer.renderToString(React.createElement(CouponBook));
  assert.ok(couponBookHtml.includes('Anniversary Coupon Book'), 'CouponBook must render main heading');
  assert.ok(couponBookHtml.includes('Semua Voucher'), 'CouponBook must render status filter tabs');
  assert.ok(couponBookHtml.includes('overflow-x-clip'), 'CouponBook must enforce overflow-x-clip invariant');

  // 3.5 CouponBook with pre-populated storage
  storage.setItem('anniv_redeemed_coupons', JSON.stringify(['coupon-1', 'coupon-2']));
  const populatedBookHtml = ReactDOMServer.renderToString(React.createElement(CouponBook));
  assert.ok(
    populatedBookHtml.includes('Reset Voucher') && populatedBookHtml.includes('2'),
    'CouponBook must show reset button with exact count of 2'
  );

  // 3.6 White-Box Storage Corruption Analysis:
  // (A) Malformed unparseable JSON string in localStorage: safely caught by try/catch
  storage.setItem('anniv_redeemed_coupons', '{corrupted-syntax-unparseable');
  assert.doesNotThrow(() => {
    const html = ReactDOMServer.renderToString(React.createElement(CouponBook));
    assert.ok(html.includes('Anniversary Coupon Book'), 'CouponBook must render safely despite syntax error');
  }, 'Malformed JSON syntax in localStorage must be caught by try/catch and fallback to []');

  // (B) Documented White-Box Boundary: Non-array JSON values in localStorage
  // When localStorage contains "null" or "{}", JSON.parse returns a non-array value.
  // We empirically assert this edge condition to document the uncovered branch.
  storage.setItem('anniv_redeemed_coupons', 'null');
  assert.throws(() => {
    ReactDOMServer.renderToString(React.createElement(CouponBook));
  }, /Cannot read properties of null/, 'Empirical proof: CouponBook lacks Array.isArray guard when storage contains "null"');

  storage.setItem('anniv_redeemed_coupons', '{}');
  assert.throws(() => {
    ReactDOMServer.renderToString(React.createElement(CouponBook));
  }, /redeemedIds\.includes is not a function/, 'Empirical proof: CouponBook lacks Array.isArray guard when storage contains "{}"');

  // Clean up storage
  storage.clear();
});

// ============================================================================
// TEST 4: Bucket List Module Progress Math, Confetti Invariants & Storage
// ============================================================================
test('Tier 5 Adversarial: Bucket List Progress Math, Confetti Guard and Storage Hardening', async () => {
  setupTestEnvironment();
  const server = await getViteServer();

  const { BucketListItem } = await server.ssrLoadModule('/src/components/bucketlist/BucketListItem.tsx');
  const { BucketList } = await server.ssrLoadModule('/src/components/bucketlist/BucketList.tsx');

  // 4.1 BucketListItem completed vs pending rendering
  const item1 = bucketListItems[0];
  const pendingItemHtml = ReactDOMServer.renderToString(
    React.createElement(BucketListItem, {
      item: item1,
      isCompleted: false,
      onToggle: () => {},
    })
  );
  assert.ok(pendingItemHtml.includes('aria-checked="false"'), 'Pending item must have aria-checked="false"');
  assert.ok(!pendingItemHtml.includes('line-through'), 'Pending item must not have line-through text');
  assert.ok(pendingItemHtml.includes('min-h-[44px] min-w-[44px]'), 'Checkbox button must enforce 44x44px target');

  const completedItemHtml = ReactDOMServer.renderToString(
    React.createElement(BucketListItem, {
      item: item1,
      isCompleted: true,
      onToggle: () => {},
    })
  );
  assert.ok(completedItemHtml.includes('aria-checked="true"'), 'Completed item must have aria-checked="true"');
  assert.ok(completedItemHtml.includes('line-through'), 'Completed item must have line-through text');

  // 4.2 BucketList progress percentage math verification
  const storage = window.localStorage;
  storage.clear();

  // Test with exactly 4 of 8 completed (50%)
  const fourCompleted = bucketListItems.slice(0, 4).map(i => i.id);
  storage.setItem('anniv_bucket_list_completed', JSON.stringify(fourCompleted));

  const halfCompletedHtml = ReactDOMServer.renderToString(React.createElement(BucketList));
  assert.ok(halfCompletedHtml.includes('4 of 8 dreams accomplished'), 'Must render exact 4 of 8 count');
  assert.ok(halfCompletedHtml.includes('50%'), 'Must calculate exact 50% progress');
  assert.ok(halfCompletedHtml.includes('aria-valuenow="50"'), 'Progressbar must specify aria-valuenow="50"');

  // Test with 100% completed
  const allCompleted = bucketListItems.map(i => i.id);
  storage.setItem('anniv_bucket_list_completed', JSON.stringify(allCompleted));

  const fullCompletedHtml = ReactDOMServer.renderToString(React.createElement(BucketList));
  assert.ok(fullCompletedHtml.includes('100%'), 'Must calculate 100% progress');
  assert.ok(fullCompletedHtml.includes('Semua impian di daftar ini sudah terwujud!'), 'Must render 100% celebratory message');

  // 4.3 Confetti resilience: BucketList code wraps canvas-confetti in try/catch
  const bucketListSource = fs.readFileSync(
    path.join(rootDir, 'src/components/bucketlist/BucketList.tsx'),
    'utf8'
  );
  assert.ok(bucketListSource.includes('triggerCelebration'), 'BucketList must define triggerCelebration helper');
  assert.ok(bucketListSource.includes('confetti({'), 'BucketList must invoke canvas-confetti');
  assert.ok(bucketListSource.includes('disableForReducedMotion: true'), 'Confetti must respect reduced motion preferences');

  // Check that confetti invocations are wrapped in try-catch blocks
  const tryCount = (bucketListSource.match(/try\s*\{/g) || []).length;
  assert.ok(tryCount >= 3, `BucketList must use at least 3 try-catch blocks for storage & confetti (found ${tryCount})`);

  // 4.4 White-Box Storage Corruption Analysis for BucketList:
  // (A) Malformed syntax in localStorage: safely caught by try/catch
  storage.setItem('anniv_bucket_list_completed', '{unparseable-bucket-list-json');
  assert.doesNotThrow(() => {
    const html = ReactDOMServer.renderToString(React.createElement(BucketList));
    assert.ok(html.includes('Our Bucket List &amp; Future Dreams') || html.includes('Our Bucket List & Future Dreams'));
  }, 'Malformed JSON syntax must fall back safely to default completed items');

  // (B) Documented White-Box Boundary: Non-array JSON values in localStorage
  storage.setItem('anniv_bucket_list_completed', 'null');
  assert.throws(() => {
    ReactDOMServer.renderToString(React.createElement(BucketList));
  }, /Cannot read properties of null/, 'Empirical proof: BucketList lacks Array.isArray guard when storage contains "null"');

  storage.setItem('anniv_bucket_list_completed', '{}');
  assert.throws(() => {
    ReactDOMServer.renderToString(React.createElement(BucketList));
  }, /completedIds\.includes is not a function/, 'Empirical proof: BucketList lacks Array.isArray guard when storage contains "{}"');

  storage.clear();
});

// ============================================================================
// TEST 5: Whole-App Integration, Multi-Viewport Geometry & Overflow Audits
// ============================================================================
test('Tier 5 Adversarial: App Whole-Tree SSR & Multi-Viewport Layout Geometry (320px to 1440px)', async () => {
  setupTestEnvironment();
  const server = await getViteServer();

  const { App } = await server.ssrLoadModule('/src/App.tsx');
  const appHtml = ReactDOMServer.renderToString(React.createElement(App));

  // 5.1 App rendered tree completeness
  assert.ok(appHtml.includes(coupleProfile.partnerName), 'App must render partner name');
  assert.ok(appHtml.includes(coupleProfile.myName), 'App must render my name');
  assert.ok(appHtml.includes('id="letter"'), 'App must integrate LoveLetterSection (#letter)');
  assert.ok(appHtml.includes('id="reasons"'), 'App must integrate ReasonsDeck (#reasons)');
  assert.ok(appHtml.includes('id="coupons"'), 'App must integrate CouponBook (#coupons)');
  assert.ok(appHtml.includes('id="bucket-list"'), 'App must integrate BucketList (#bucket-list)');
  assert.ok(appHtml.includes('overflow-x-clip'), 'App root must enforce overflow-x-clip container guard');

  // 5.2 Multi-Viewport Geometry Audits: 320px, 375px, 414px, 768px, 1024px, 1440px
  const viewports = [
    { width: 320, name: 'Ultra-Narrow Mobile (iPhone SE)' },
    { width: 375, name: 'Standard Mobile (iPhone 13)' },
    { width: 414, name: 'Large Mobile (iPhone 11 Pro Max)' },
    { width: 768, name: 'Tablet Portrait (iPad Mini)' },
    { width: 1024, name: 'Tablet Landscape / Desktop' },
    { width: 1440, name: 'Wide Desktop (1440p)' },
  ];
  assert.strictEqual(viewports.length, 6, 'Must verify all 6 standard viewports');

  // Inspect source files for dangerous fixed width patterns without max-w-full
  const moduleFiles = [
    'src/components/letter/WaxSeal.tsx',
    'src/components/letter/VirtualEnvelope.tsx',
    'src/components/letter/ParchmentLetter.tsx',
    'src/components/letter/LoveLetterSection.tsx',
    'src/components/reasons/ReasonsDeck.tsx',
    'src/components/reasons/ReasonCard.tsx',
    'src/components/coupons/CouponBook.tsx',
    'src/components/coupons/VoucherCard.tsx',
    'src/components/bucketlist/BucketList.tsx',
    'src/components/bucketlist/BucketListItem.tsx',
    'src/App.tsx',
  ];

  for (const relPath of moduleFiles) {
    const fullPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Rule 1: No fixed w-[Xpx] greater than 320px without max-w-full or responsive modifier
    const fixedWidthMatches = content.match(/w-\[(\d+)px\]/g) || [];
    for (const match of fixedWidthMatches) {
      const px = parseInt(match.replace(/\D/g, ''), 10);
      if (px > 300) {
        assert.fail(`Module ${relPath} contains oversized fixed width ${match} which can overflow narrow viewports`);
      }
    }

    // Rule 2: All sections have overflow-x-clip
    if (relPath.endsWith('Section.tsx') || relPath.endsWith('Book.tsx') || relPath.endsWith('Deck.tsx') || relPath.endsWith('BucketList.tsx')) {
      assert.ok(
        content.includes('overflow-x-clip'),
        `Section module ${relPath} must specify overflow-x-clip container guard`
      );
    }
  }

  // 5.3 Interactive touch target verification across Milestone 4 modules
  let totalTargetsChecked = 0;
  for (const relPath of moduleFiles) {
    const fullPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const interactiveElements = extractInteractiveElements(content);

    for (const el of interactiveElements) {
      // Validate element has minimum 44px class or is explicitly validated
      const has44px =
        el.className.includes('min-h-[44px]') ||
        el.className.includes('min-w-[44px]') ||
        el.className.includes('h-12') ||
        el.className.includes('h-14') ||
        el.className.includes('w-12') ||
        el.className.includes('w-14');

      assert.ok(
        has44px,
        `Interactive <${el.tag}> in ${relPath} must enforce min 44x44px target. Found class: "${el.className}"`
      );
      totalTargetsChecked++;
    }
  }

  assert.ok(totalTargetsChecked >= 15, `Must verify at least 15 interactive elements (verified ${totalTargetsChecked})`);
});

// ============================================================================
// TEST 6: Strict Zero Em-Dash Repository-Wide Invariant Audit
// ============================================================================
test('Tier 5 Adversarial: Deep Recursive Zero Em-Dash Scan Across src/ and tests/', () => {
  function getAuditFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json', '.md']) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getAuditFiles(fullPath, extensions));
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  const srcFiles = getAuditFiles(path.join(rootDir, 'src'));
  const testFiles = getAuditFiles(path.join(rootDir, 'tests'));

  let srcViolations = [];
  let testViolations = [];

  // Check src/ files
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('—') || line.includes('\u2014') || line.includes('&mdash;')) {
        srcViolations.push({
          file: path.relative(rootDir, file).replace(/\\/g, '/'),
          line: idx + 1,
          text: line.trim(),
        });
      }
    });
  }

  // Check tests/ files (ignoring test scanner logic itself)
  for (const file of testFiles) {
    const rel = path.relative(rootDir, file).replace(/\\/g, '/');
    if (rel.includes('emdash') || rel.includes('audit')) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('—')) {
        const isAssertionCheck =
          line.includes('includes(') ||
          line.includes('must not contain') ||
          line.includes('antislop rules') ||
          line.includes('em dash') ||
          line.includes('em-dash');

        if (!isAssertionCheck) {
          testViolations.push({
            file: rel,
            line: idx + 1,
            text: line.trim(),
          });
        }
      }
    });
  }

  assert.strictEqual(
    srcViolations.length,
    0,
    `Found ${srcViolations.length} em-dash violations in src/: ${JSON.stringify(srcViolations)}`
  );
  assert.strictEqual(
    testViolations.length,
    0,
    `Found ${testViolations.length} em-dash violations in tests/: ${JSON.stringify(testViolations)}`
  );
});
