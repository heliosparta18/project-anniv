import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass, MIN_TOUCH_TARGET_SIZE } from '../helpers/responsive_checker.js';
import { setupTestEnvironment } from '../helpers/dom_mock.js';
import { loveReasons } from '../../src/data/anniversaryData.ts';
import {
  getNextIndex,
  getPrevIndex,
  getRandomIndex,
  getCategoryBadgeConfig,
  loadStoredReactions,
  saveStoredReactions,
  REASONS_STORAGE_KEY,
} from '../../src/components/reasons/reasonsUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reasonsDeckPath = path.resolve(__dirname, '../../src/components/reasons/ReasonsDeck.tsx');
const reasonCardPath = path.resolve(__dirname, '../../src/components/reasons/ReasonCard.tsx');
const reasonsUtilsPath = path.resolve(__dirname, '../../src/components/reasons/reasonsUtils.ts');
const interactiveReasonsDeckPath = path.resolve(__dirname, '../../src/components/interactive/ReasonsDeck.tsx');

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
      const ariaLabelMatch = tagContent.match(/aria-label="([^"]+)"/) || tagContent.match(/aria-label=\{`([^`]+)`\}/);
      elements.push({
        tagName,
        ariaLabel: ariaLabelMatch ? (ariaLabelMatch[1] || ariaLabelMatch[2]) : null,
        className: classMatch ? (classMatch[1] || classMatch[2]) : '',
        snippet: tagContent,
      });
      startRegex.lastIndex = tagEnd + 1;
    }
  }
  return elements;
}

test('Feature 12 - Reasons Deck: Sequential and Shuffle Card Navigation', () => {
  // 1. Verify required source files exist
  assert.ok(fs.existsSync(reasonsDeckPath), 'ReasonsDeck.tsx must exist in src/components/reasons/');
  assert.ok(fs.existsSync(reasonCardPath), 'ReasonCard.tsx must exist in src/components/reasons/');
  assert.ok(fs.existsSync(reasonsUtilsPath), 'reasonsUtils.ts must exist in src/components/reasons/');
  assert.ok(fs.existsSync(interactiveReasonsDeckPath), 'ReasonsDeck.tsx must exist in src/components/interactive/');

  const deckCode = fs.readFileSync(reasonsDeckPath, 'utf8');
  const cardCode = fs.readFileSync(reasonCardPath, 'utf8');
  const interactiveDeckCode = fs.readFileSync(interactiveReasonsDeckPath, 'utf8');

  // 2. Component exports
  assert.ok(
    deckCode.includes('export function ReasonsDeck') || deckCode.includes('export const ReasonsDeck'),
    'ReasonsDeck.tsx must export ReasonsDeck component'
  );
  assert.ok(
    cardCode.includes('export function ReasonCard') || cardCode.includes('export const ReasonCard'),
    'ReasonCard.tsx must export ReasonCard component'
  );
  assert.ok(
    interactiveDeckCode.includes('ReasonsDeck'),
    'src/components/interactive/ReasonsDeck.tsx must re-export ReasonsDeck'
  );

  // 3. Landmark container and accessibility
  assert.ok(deckCode.includes('id="reasons"'), 'ReasonsDeck must define landmark container with id="reasons"');
  assert.ok(deckCode.includes('aria-label='), 'ReasonsDeck must define descriptive aria-label');
  assert.ok(
    deckCode.includes('overflow-x-clip') || deckCode.includes('overflow-x-hidden'),
    'ReasonsDeck must enforce overflow protection against mobile horizontal blowout'
  );

  // 4. Navigation controls and accessibility
  assert.ok(
    deckCode.includes('aria-label="Next reason"') || deckCode.includes('Next'),
    'ReasonsDeck must render next card control'
  );
  assert.ok(
    deckCode.includes('aria-label="Previous reason"') || deckCode.includes('Prev'),
    'ReasonsDeck must render previous card control'
  );
  assert.ok(
    deckCode.includes('aria-label="Shuffle random reason"') || deckCode.includes('Shuffle') || deckCode.includes('Acak'),
    'ReasonsDeck must render shuffle / random card control'
  );

  // 5. Card counter and indicators
  assert.ok(
    cardCode.includes('total') && cardCode.includes('index'),
    'ReasonCard must display card index and total count'
  );

  // 6. Keyboard navigation support
  assert.ok(
    deckCode.includes('ArrowLeft') && deckCode.includes('ArrowRight') && deckCode.includes('Space'),
    'ReasonsDeck must implement keyboard navigation with ArrowLeft, ArrowRight, and Space'
  );

  // 7. Mobile swipe touch support
  assert.ok(
    deckCode.includes('onTouchStart') && deckCode.includes('onTouchEnd'),
    'ReasonsDeck must support mobile touch swipe navigation'
  );

  // 8. Strict WCAG 2.5.5 touch target size (>= 44x44px)
  assert.strictEqual(MIN_TOUCH_TARGET_SIZE, 44, 'WCAG 2.5.5 minimum touch target requirement is 44px');
  const deckButtons = extractInteractiveElements(deckCode);
  const cardButtons = extractInteractiveElements(cardCode);
  assert.ok(deckButtons.length >= 3, `Expected at least 3 interactive controls in ReasonsDeck, found ${deckButtons.length}`);
  assert.ok(cardButtons.length >= 1, `Expected at least 1 interactive button in ReasonCard, found ${cardButtons.length}`);

  for (const el of [...deckButtons, ...cardButtons]) {
    assert.ok(
      el.className.includes('min-h-[44px]') ||
      el.className.includes('min-w-[44px]') ||
      validateTouchTargetClass(el.className),
      `Element <${el.tagName}> (aria-label="${el.ariaLabel}") must enforce >=44px touch target (found: "${el.className}")`
    );
  }

  // 9. Antislop R-02 Copywriting hygiene: strict 0 em-dash violations
  assert.ok(!deckCode.includes('\u2014') && !deckCode.includes('&mdash;'), 'ReasonsDeck must not contain em-dashes');
  assert.ok(!cardCode.includes('\u2014') && !cardCode.includes('&mdash;'), 'ReasonCard must not contain em-dashes');

  // 10. Navigation index math invariant verification
  assert.strictEqual(getNextIndex(0, 12), 1, 'Next from 0 is 1');
  assert.strictEqual(getNextIndex(11, 12), 0, 'Next from 11 wraps around to 0');
  assert.strictEqual(getPrevIndex(0, 12), 11, 'Prev from 0 wraps around to 11');
  assert.strictEqual(getPrevIndex(5, 12), 4, 'Prev from 5 is 4');
  for (let i = 0; i < 50; i++) {
    const r = getRandomIndex(4, 12);
    assert.ok(r >= 0 && r < 12, 'Random index must be within range');
    assert.notStrictEqual(r, 4, 'Random index must differ from current index when total > 1');
  }

  // 11. Category badge configurations
  const categories = ['habits', 'memories', 'quirks', 'feelings'];
  for (const cat of categories) {
    const cfg = getCategoryBadgeConfig(cat);
    assert.ok(typeof cfg.label === 'string' && cfg.label.length > 0, `Category ${cat} must have label`);
    assert.ok(typeof cfg.badgeBg === 'string' && cfg.badgeBg.length > 0, `Category ${cat} must have badgeBg`);
    assert.ok(typeof cfg.badgeText === 'string' && cfg.badgeText.length > 0, `Category ${cat} must have badgeText`);
  }
});

test('Feature 12 - Reasons Deck: Heart Reaction Counter Persistence', () => {
  const cardCode = fs.readFileSync(reasonCardPath, 'utf8');
  const deckCode = fs.readFileSync(reasonsDeckPath, 'utf8');

  // 1. Interactive heart reaction button
  assert.ok(
    cardCode.includes('handleHeartClick') || cardCode.includes('onReact'),
    'ReasonCard must bind heart reaction click handler'
  );
  assert.ok(
    cardCode.includes('reactionCount') || cardCode.includes('Cinta'),
    'ReasonCard must display live reaction count'
  );
  assert.ok(
    cardCode.includes('particles') || cardCode.includes('isPulsing'),
    'ReasonCard must execute micro-animation feedback on heart reaction'
  );

  // 2. LocalStorage persistence logic
  assert.ok(
    deckCode.includes('loadStoredReactions') && deckCode.includes('saveStoredReactions'),
    'ReasonsDeck must utilize loadStoredReactions and saveStoredReactions'
  );
  assert.strictEqual(REASONS_STORAGE_KEY, 'anniversary_reason_reactions', 'Must use standard storage key');

  // 3. Runtime persistence testing with MockLocalStorage
  const { localStorage } = setupTestEnvironment();
  localStorage.clear();

  // Test initial empty state
  const initial = loadStoredReactions(REASONS_STORAGE_KEY);
  assert.deepStrictEqual(initial, {}, 'Initial load on clean storage returns empty object');

  // Test save and reload
  const testReactions = { 'reason-1': 5, 'reason-2': 12, 'reason-3': 1 };
  const savedOk = saveStoredReactions(testReactions, REASONS_STORAGE_KEY);
  assert.ok(savedOk, 'saveStoredReactions must return true on success');

  const loaded = loadStoredReactions(REASONS_STORAGE_KEY);
  assert.strictEqual(loaded['reason-1'], 5, 'Persisted count for reason-1 must match');
  assert.strictEqual(loaded['reason-2'], 12, 'Persisted count for reason-2 must match');
  assert.strictEqual(loaded['reason-3'], 1, 'Persisted count for reason-3 must match');

  // Test resilience against corrupted localStorage data
  localStorage.setItem(REASONS_STORAGE_KEY, 'invalid json {[');
  const fallback = loadStoredReactions(REASONS_STORAGE_KEY);
  assert.deepStrictEqual(fallback, {}, 'Corrupted JSON must gracefully return empty object without throwing');

  // 4. Dataset invariant check: all 12 reasons in anniversaryData
  assert.ok(Array.isArray(loveReasons), 'loveReasons must be an array');
  assert.strictEqual(loveReasons.length, 12, 'Must have exactly 12 love reasons');
  for (const r of loveReasons) {
    assert.ok(typeof r.id === 'string' && r.id.length > 0, `Reason ID must exist: ${r.id}`);
    assert.ok(typeof r.number === 'number' && r.number >= 1, `Reason number must be valid: ${r.number}`);
    assert.ok(typeof r.text === 'string' && r.text.length > 0, `Reason text must be non-empty: ${r.id}`);
    assert.ok(['habits', 'memories', 'quirks', 'feelings'].includes(r.category), `Valid category: ${r.category}`);
  }
});
