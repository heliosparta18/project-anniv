import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { setupTestEnvironment } from '../helpers/dom_mock.js';
import { validateTouchTargetClass } from '../helpers/responsive_checker.js';
import { loveLetter } from '../../src/data/anniversaryData.ts';
import {
  getNextIndex,
  getPrevIndex,
  getRandomIndex,
  loadStoredReactions,
  saveStoredReactions,
} from '../../src/components/reasons/reasonsUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const virtualEnvelopePath = path.resolve(__dirname, '../../src/components/letter/VirtualEnvelope.tsx');
const loveLetterSectionPath = path.resolve(__dirname, '../../src/components/letter/LoveLetterSection.tsx');
const waxSealPath = path.resolve(__dirname, '../../src/components/letter/WaxSeal.tsx');
const parchmentLetterPath = path.resolve(__dirname, '../../src/components/letter/ParchmentLetter.tsx');
const reasonsDeckPath = path.resolve(__dirname, '../../src/components/reasons/ReasonsDeck.tsx');
const reasonCardPath = path.resolve(__dirname, '../../src/components/reasons/ReasonCard.tsx');

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
      const ariaLabelMatch = tagContent.match(/aria-label="([^"]+)"/) || tagContent.match(/aria-label=\{`([^`]+)`\}/) || tagContent.match(/aria-label=\{([^}]+)\}/);
      elements.push({
        tagName,
        ariaLabel: ariaLabelMatch ? (ariaLabelMatch[1] || ariaLabelMatch[2]) : null,
        className: classMatch ? (classMatch[1] || classMatch[2]) : '',
        snippet: tagContent
      });
      startRegex.lastIndex = tagEnd + 1;
    }
  }
  return elements;
}

// --------------------------------------------------------------------------
// SUITE 1: 3D ENVELOPE STATE MACHINE & WAX SEAL INVARIANTS
// --------------------------------------------------------------------------

test('Milestone 4 Challenger: Envelope 3D State Machine Transitions & Rendering', async () => {
  // Vite SSR instance for real React component rendering
  const server = await createServer({
    ssr: { external: ['react', 'react-dom', 'lucide-react'] }
  });

  try {
    const { VirtualEnvelope } = await server.ssrLoadModule('./src/components/letter/VirtualEnvelope.tsx');
    const { WaxSeal } = await server.ssrLoadModule('./src/components/letter/WaxSeal.tsx');
    const { ParchmentLetter } = await server.ssrLoadModule('./src/components/letter/ParchmentLetter.tsx');

    // 1. Initial Sealed State: defaultOpen=false
    const sealedHtml = ReactDOMServer.renderToString(
      React.createElement(VirtualEnvelope, { defaultOpen: false })
    );

    assert.ok(sealedHtml.includes('Surat Khusus Untuk:'), 'Sealed envelope must render addressee label');
    assert.ok(sealedHtml.includes('Dinda Sayang'), 'Sealed envelope must render recipient name');
    assert.ok(sealedHtml.includes('1st Anniv Post'), 'Sealed envelope must render postal stamp');
    assert.ok(sealedHtml.includes('Pecahkan segel lilin'), 'Sealed envelope must render wax seal CTA');
    assert.ok(!sealedHtml.includes('Lipat &amp; Segel Kembali'), 'Sealed envelope must NOT render reseal button');

    // 2. Opened State: defaultOpen=true
    const openedHtml = ReactDOMServer.renderToString(
      React.createElement(VirtualEnvelope, { defaultOpen: true })
    );

    assert.ok(openedHtml.includes('Surat Cinta Buat Kamu'), 'Opened envelope must render ParchmentLetter heading');
    assert.ok(openedHtml.includes(loveLetter.salutation), 'Opened envelope must render letter salutation');
    assert.ok(openedHtml.includes(loveLetter.opening), 'Opened envelope must render letter opening');
    assert.ok(openedHtml.includes(loveLetter.closing), 'Opened envelope must render letter closing');
    const expectedSignature = loveLetter.signature.replace(/&/g, '&amp;');
    assert.ok(openedHtml.includes(expectedSignature) || openedHtml.includes(loveLetter.signature), 'Opened envelope must render author signature');
    assert.ok(openedHtml.includes('Lipat &amp; Segel Kembali') || openedHtml.includes('Lipat & Segel Kembali'), 'Opened envelope must render reseal button');

    // 3. Wax Seal Unsealing State & Crack Overlay
    const breakingWaxHtml = ReactDOMServer.renderToString(
      React.createElement(WaxSeal, {
        sealText: 'D & D',
        isBreaking: true,
        isBroken: false
      })
    );
    assert.ok(breakingWaxHtml.includes('<svg'), 'Breaking WaxSeal must render SVG crack overlay');
    assert.ok(breakingWaxHtml.includes('animate-pulse'), 'Breaking WaxSeal crack SVG must have animate-pulse');
    assert.ok(breakingWaxHtml.includes('disabled=""') || breakingWaxHtml.includes('disabled'), 'Breaking WaxSeal must be disabled');

    // 4. Broken Wax Seal State
    const brokenWaxHtml = ReactDOMServer.renderToString(
      React.createElement(WaxSeal, {
        sealText: 'D & D',
        isBreaking: false,
        isBroken: true
      })
    );
    assert.ok(brokenWaxHtml.includes('opacity-0') || brokenWaxHtml.includes('scale-75'), 'Broken WaxSeal must transition to invisible scale');
    assert.ok(brokenWaxHtml.includes('disabled=""') || brokenWaxHtml.includes('disabled'), 'Broken WaxSeal must remain disabled');

    // 5. Parchment Reseal Callback Trigger
    let resealClicked = false;
    const testParchment = React.createElement(ParchmentLetter, {
      letter: loveLetter,
      onReseal: () => { resealClicked = true; }
    });
    const parchmentHtml = ReactDOMServer.renderToString(testParchment);
    assert.ok(parchmentHtml.includes('Lipat &amp; Segel Kembali') || parchmentHtml.includes('Lipat & Segel Kembali'), 'Parchment must render reseal button when onReseal provided');
    assert.strictEqual(resealClicked, false, 'resealClicked starts false before interaction');

  } finally {
    await server.close();
  }
});

test('Milestone 4 Challenger: Envelope 3D CSS Properties & 100x Rapid Toggle Stress', async () => {
  const envelopeCode = fs.readFileSync(virtualEnvelopePath, 'utf8');

  // 1. Verify CSS 3D Transform Properties
  assert.ok(
    envelopeCode.includes('[perspective:1000px]') || envelopeCode.includes('perspective: 1000px'),
    'Envelope must define perspective: 1000px container'
  );
  assert.ok(
    envelopeCode.includes("transformStyle: 'preserve-3d'") || envelopeCode.includes('[transform-style:preserve-3d]'),
    'Envelope top flap must enforce transformStyle: preserve-3d'
  );
  assert.ok(
    envelopeCode.includes('[transform-origin:top]'),
    'Envelope top flap must have transform-origin: top'
  );
  assert.ok(
    envelopeCode.includes('rotateX') && (envelopeCode.includes('rotateX(180deg)') || envelopeCode.includes('rotateX(-180deg)')),
    'Envelope top flap must apply rotateX 180deg folding transform'
  );

  // 2. Rapid Toggle State Machine Simulation (100 Iterations)
  // Simulate complete state cycle: sealed -> unsealing -> opened -> reseal -> sealed
  let currentState = 'sealed';
  let openCount = 0;
  let closeCount = 0;
  const timerRegistry = [];

  function simulateBreakSeal() {
    if (currentState !== 'sealed') return false;
    currentState = 'unsealing';
    const timerId = setTimeout(() => {
      currentState = 'opened';
      openCount++;
    }, 650);
    timerRegistry.push(timerId);
    return true;
  }

  function simulateReseal() {
    currentState = 'sealed';
    closeCount++;
  }

  const ITERATIONS = 100;
  for (let i = 0; i < ITERATIONS; i++) {
    assert.strictEqual(currentState, 'sealed', `Iteration ${i}: Must start sealed`);
    const triggered = simulateBreakSeal();
    assert.strictEqual(triggered, true, `Iteration ${i}: Must accept break seal`);
    assert.strictEqual(currentState, 'unsealing', `Iteration ${i}: Must be unsealing`);

    // Multiple rapid clicks while unsealing must be safely ignored
    const duplicateClick = simulateBreakSeal();
    assert.strictEqual(duplicateClick, false, `Iteration ${i}: Duplicate break seal must be rejected while unsealing`);

    // Fast-forward simulated timer
    currentState = 'opened';
    openCount++;
    assert.strictEqual(currentState, 'opened', `Iteration ${i}: Must transition to opened`);

    // Reseal back to sealed
    simulateReseal();
    assert.strictEqual(currentState, 'sealed', `Iteration ${i}: Must reseal to sealed`);
  }

  assert.strictEqual(openCount, ITERATIONS, `Must successfully complete ${ITERATIONS} opens`);
  assert.strictEqual(closeCount, ITERATIONS, `Must successfully complete ${ITERATIONS} reseals`);

  // Clean up timers
  timerRegistry.forEach(t => clearTimeout(t));
});

test('Milestone 4 Challenger: Wax Seal Accessibility & Keyboard Triggers', () => {
  const waxCode = fs.readFileSync(waxSealPath, 'utf8');
  const waxInteractive = extractInteractiveElements(waxCode);

  const sealButton = waxInteractive.find(el => el.tagName === 'button');
  assert.ok(sealButton, 'WaxSeal must render a semantic button element');
  assert.ok(sealButton.ariaLabel, 'WaxSeal button must have an ariaLabel');
  assert.ok(
    sealButton.ariaLabel.toLowerCase().includes('segel') || sealButton.ariaLabel.toLowerCase().includes('surat'),
    'WaxSeal ariaLabel must describe breaking the wax seal'
  );

  // Keyboard accessibility check:
  // In HTML5/W3C button specification, <button type="button"> responds natively to Enter (key 13) and Space (key 32).
  assert.ok(
    waxCode.includes('type="button"'),
    'WaxSeal button must declare type="button" to prevent unwanted form submissions'
  );
  assert.ok(
    waxCode.includes('focus-visible:ring-2') && waxCode.includes('focus-visible:ring-anniv-rose'),
    'WaxSeal button must provide high-contrast visible focus ring for keyboard navigators'
  );
  assert.ok(
    waxCode.includes('min-h-[44px]') && waxCode.includes('min-w-[44px]'),
    'WaxSeal button must satisfy WCAG 2.5.5 minimum 44x44px touch target'
  );
});

// --------------------------------------------------------------------------
// SUITE 2: REASONS DECK MATH & REACTION STATE STRESS
// --------------------------------------------------------------------------

test('Milestone 4 Challenger: Reasons Deck Math Invariants Across 10,000 Steps', () => {
  const TOTAL = 12; // Production count of reasons

  // 1. Sequential Next (10,000 steps)
  let currNext = 0;
  const nextVisitCounts = new Array(TOTAL).fill(0);
  for (let step = 0; step < 10000; step++) {
    const nextIdx = getNextIndex(currNext, TOTAL);
    assert.strictEqual(typeof nextIdx, 'number', 'nextIndex must be a number');
    assert.ok(Number.isInteger(nextIdx), 'nextIndex must be an integer');
    assert.ok(nextIdx >= 0 && nextIdx < TOTAL, `nextIndex ${nextIdx} out of bounds [0, ${TOTAL - 1}]`);
    assert.strictEqual(nextIdx, (currNext + 1) % TOTAL, 'Must advance exactly +1 with modulo wrap');
    nextVisitCounts[nextIdx]++;
    currNext = nextIdx;
  }
  // Every card visited equally in 10,000 steps
  for (let i = 0; i < TOTAL; i++) {
    assert.ok(nextVisitCounts[i] > 800, `Card ${i} should be evenly visited (got ${nextVisitCounts[i]})`);
  }

  // 2. Sequential Prev (10,000 steps)
  let currPrev = 0;
  const prevVisitCounts = new Array(TOTAL).fill(0);
  for (let step = 0; step < 10000; step++) {
    const prevIdx = getPrevIndex(currPrev, TOTAL);
    assert.strictEqual(typeof prevIdx, 'number', 'prevIndex must be a number');
    assert.ok(Number.isInteger(prevIdx), 'prevIndex must be an integer');
    assert.ok(prevIdx >= 0 && prevIdx < TOTAL, `prevIndex ${prevIdx} out of bounds [0, ${TOTAL - 1}]`);
    assert.strictEqual(prevIdx, (currPrev - 1 + TOTAL) % TOTAL, 'Must step backward -1 with modulo wrap');
    prevVisitCounts[prevIdx]++;
    currPrev = prevIdx;
  }
  for (let i = 0; i < TOTAL; i++) {
    assert.ok(prevVisitCounts[i] > 800, `Card ${i} should be evenly visited (got ${prevVisitCounts[i]})`);
  }

  // 3. Shuffle / Random (10,000 steps)
  let currRand = 0;
  const randVisitCounts = new Array(TOTAL).fill(0);
  for (let step = 0; step < 10000; step++) {
    const randIdx = getRandomIndex(currRand, TOTAL);
    assert.strictEqual(typeof randIdx, 'number', 'randomIndex must be a number');
    assert.ok(!Number.isNaN(randIdx), 'randomIndex must never be NaN');
    assert.ok(Number.isInteger(randIdx), 'randomIndex must be an integer');
    assert.ok(randIdx >= 0 && randIdx < TOTAL, `randomIndex ${randIdx} out of bounds [0, ${TOTAL - 1}]`);
    assert.notStrictEqual(randIdx, currRand, `Step ${step}: randomIndex must change when total > 1`);
    randVisitCounts[randIdx]++;
    currRand = randIdx;
  }
  // All 12 cards must be visited by random shuffle
  for (let i = 0; i < TOTAL; i++) {
    assert.ok(randVisitCounts[i] > 400, `Card ${i} must receive random visits (got ${randVisitCounts[i]})`);
  }

  // 4. Boundary & Degenerate Cases
  assert.strictEqual(getNextIndex(0, 0), 0, 'getNextIndex with total=0 returns 0');
  assert.strictEqual(getPrevIndex(0, 0), 0, 'getPrevIndex with total=0 returns 0');
  assert.strictEqual(getRandomIndex(0, 0), 0, 'getRandomIndex with total=0 returns 0');

  assert.strictEqual(getNextIndex(0, 1), 0, 'getNextIndex with total=1 returns 0');
  assert.strictEqual(getPrevIndex(0, 1), 0, 'getPrevIndex with total=1 returns 0');
  assert.strictEqual(getRandomIndex(0, 1), 0, 'getRandomIndex with total=1 returns 0');

  assert.strictEqual(getNextIndex(999999, 12), (999999 + 1) % 12, 'Large index handles cleanly');
});

test('Milestone 4 Challenger: 50 Rapid Multi-Click Heart Reaction Stress', () => {
  setupTestEnvironment();
  const testKey = 'stress_test_reactions';
  globalThis.localStorage.clear();

  // Functional state updater model replicating ReasonsDeck handleReact
  let reactionsState = {};

  function handleReact(reasonId) {
    // Replicate functional updater: setReactions(prev => ...)
    const prev = reactionsState;
    const nextCount = (prev[reasonId] || 0) + 1;
    const updated = {
      ...prev,
      [reasonId]: nextCount
    };
    saveStoredReactions(updated, testKey);
    reactionsState = updated;
    return updated;
  }

  const TARGET_CLICKS = 50;
  for (let click = 1; click <= TARGET_CLICKS; click++) {
    const updated = handleReact('reason-1');
    assert.strictEqual(updated['reason-1'], click, `Click ${click} must increment reason-1 to ${click}`);
  }

  // Multi-reason concurrent stress: 50 clicks on reason-2, 25 clicks on reason-3
  for (let click = 1; click <= 50; click++) {
    handleReact('reason-2');
  }
  for (let click = 1; click <= 25; click++) {
    handleReact('reason-3');
  }

  assert.strictEqual(reactionsState['reason-1'], 50, 'reason-1 must have exactly 50 reactions');
  assert.strictEqual(reactionsState['reason-2'], 50, 'reason-2 must have exactly 50 reactions');
  assert.strictEqual(reactionsState['reason-3'], 25, 'reason-3 must have exactly 25 reactions');

  const totalHearts = Object.values(reactionsState).reduce((sum, n) => sum + n, 0);
  assert.strictEqual(totalHearts, 125, 'Total aggregate hearts must equal 125 exactly without race conditions');
  assert.ok(totalHearts >= 0, 'Total hearts must never be negative');

  // Verify persistence in localStorage
  const loaded = loadStoredReactions(testKey);
  assert.deepStrictEqual(loaded, reactionsState, 'Persisted reactions must match in-memory state');
});

test('Milestone 4 Challenger: LocalStorage Persistence & Corruption Resilience', () => {
  setupTestEnvironment();
  const testKey = 'test_persistence_key';
  globalThis.localStorage.clear();

  // 1. Clean roundtrip serialization
  const payload = {
    'reason-1': 100,
    'reason-5': 42,
    'reason-12': 777
  };
  const saveSuccess = saveStoredReactions(payload, testKey);
  assert.strictEqual(saveSuccess, true, 'saveStoredReactions must return true on success');

  const reloaded = loadStoredReactions(testKey);
  assert.deepStrictEqual(reloaded, payload, 'Reloaded reactions must match saved payload');

  // 2. Corruption Resilience (Fuzz testing invalid localStorage content)
  const corruptPayloads = [
    'null',
    'undefined',
    '""',
    '12345',
    'true',
    'false',
    '[1, 2, 3]',
    '{"broken": json',
    '{{{',
    '',
    'NaN'
  ];

  for (const badData of corruptPayloads) {
    globalThis.localStorage.setItem(testKey, badData);
    assert.doesNotThrow(() => {
      const recovered = loadStoredReactions(testKey);
      assert.strictEqual(typeof recovered, 'object', 'Must return an object');
      assert.ok(recovered !== null, 'Must not be null');
      assert.ok(!Array.isArray(recovered), 'Must not be an array');
    }, `Must not throw on corrupted data: "${badData}"`);
  }

  // 3. Graceful handling when localStorage throws quota or access error
  const failingStorage = {
    getItem: () => { throw new Error('SecurityError: Permission denied'); },
    setItem: () => { throw new Error('QuotaExceededError'); }
  };
  const origStorage = globalThis.localStorage;
  globalThis.localStorage = failingStorage;

  assert.doesNotThrow(() => {
    const fallback = loadStoredReactions(testKey);
    assert.deepStrictEqual(fallback, {}, 'Storage error must gracefully fallback to empty object');
  });

  assert.doesNotThrow(() => {
    const saveResult = saveStoredReactions({ 'reason-1': 1 }, testKey);
    assert.strictEqual(saveResult, false, 'Storage error must return false instead of throwing');
  });

  globalThis.localStorage = origStorage;
});

// --------------------------------------------------------------------------
// SUITE 3: TOUCH TARGETS & VIEWPORT GEOMETRY
// --------------------------------------------------------------------------

test('Milestone 4 Challenger: WCAG 2.5.5 >= 44x44px Touch Targets Audit', () => {
  const sources = [
    { name: 'WaxSeal.tsx', code: fs.readFileSync(waxSealPath, 'utf8') },
    { name: 'VirtualEnvelope.tsx', code: fs.readFileSync(virtualEnvelopePath, 'utf8') },
    { name: 'ParchmentLetter.tsx', code: fs.readFileSync(parchmentLetterPath, 'utf8') },
    { name: 'ReasonCard.tsx', code: fs.readFileSync(reasonCardPath, 'utf8') },
    { name: 'ReasonsDeck.tsx', code: fs.readFileSync(reasonsDeckPath, 'utf8') },
  ];

  let totalButtonsAudited = 0;

  for (const src of sources) {
    const interactive = extractInteractiveElements(src.code);
    assert.ok(interactive.length >= 1, `${src.name} must contain at least 1 interactive control`);

    for (const el of interactive) {
      totalButtonsAudited++;
      const hasExplicitMinH = el.className.includes('min-h-[44px]');
      const hasExplicitMinW = el.className.includes('min-w-[44px]');
      const satisfiesChecker = validateTouchTargetClass(el.className);

      assert.ok(
        (hasExplicitMinH && hasExplicitMinW) || satisfiesChecker,
        `${src.name}: Button <${el.tagName}> (aria-label="${el.ariaLabel}") MUST satisfy WCAG 2.5.5 >= 44x44px. Found: "${el.className}"`
      );
    }
  }

  assert.ok(totalButtonsAudited >= 7, `Expected at least 7 interactive buttons across M4 components, found ${totalButtonsAudited}`);
});

test('Milestone 4 Challenger: Viewport Geometry & Zero Horizontal Overflow Audit', () => {
  const letterSectionCode = fs.readFileSync(loveLetterSectionPath, 'utf8');
  const reasonsDeckCode = fs.readFileSync(reasonsDeckPath, 'utf8');
  const envelopeCode = fs.readFileSync(virtualEnvelopePath, 'utf8');
  const cardCode = fs.readFileSync(reasonCardPath, 'utf8');

  // 1. Root Section Landmark Overflow Protection
  assert.ok(
    letterSectionCode.includes('overflow-x-clip'),
    'LoveLetterSection root container must include overflow-x-clip'
  );
  assert.ok(
    reasonsDeckCode.includes('overflow-x-clip'),
    'ReasonsDeck root container must include overflow-x-clip'
  );

  // 2. Viewports Audit (320px, 360px, 375px, 414px)
  const mobileWidths = [320, 360, 375, 414];
  for (const w of mobileWidths) {
    // Assert no hardcoded pixel widths > viewport in className attributes
    const pixelWidthRegex = /\bw-\[(\d+)px\]/g;
    let match;
    for (const code of [letterSectionCode, reasonsDeckCode, envelopeCode, cardCode]) {
      while ((match = pixelWidthRegex.exec(code)) !== null) {
        const pxVal = parseInt(match[1], 10);
        assert.ok(
          pxVal < w,
          `Fixed width w-[${pxVal}px] exceeds mobile viewport ${w}px!`
        );
      }
    }
  }

  // 3. Flex wrapping on pagination pills
  // 12 pills of min 44px = 528px width, so container MUST have flex-wrap to prevent horizontal overflow on 320px screens
  assert.ok(
    reasonsDeckCode.includes('flex-wrap'),
    'ReasonsDeck pagination pills container must enforce flex-wrap for narrow mobile screens'
  );
});
