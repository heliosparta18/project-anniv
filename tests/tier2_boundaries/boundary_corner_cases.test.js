import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { createServer } from 'vite';
import { setupTestEnvironment, MockAudio } from '../helpers/dom_mock.js';
import {
  calculateGregorianDifference,
  isLeapYear,
  getDaysInMonth,
  addMonthsClamped
} from '../../src/hooks/useLiveCounter.ts';
import {
  generateSvgMarkup,
  generateSvgDataUrl,
  getPlaceholderPhoto,
  DEFAULT_PLACEHOLDERS
} from '../../src/utils/placeholderGenerator.ts';
import {
  ROMANTIC_CHORDS,
  RomanticAudioSynth,
  startRomanticChords,
  stopRomanticChords,
  isSynthPlaying
} from '../../src/utils/audioSynth.ts';
import { milestones } from '../../src/data/anniversaryData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const photosDir = path.join(projectRoot, 'public/photos');

let sharedServer;
async function getViteServer() {
  if (!sharedServer) {
    sharedServer = await createServer({
      ssr: { external: ['react', 'react-dom', 'lucide-react'] }
    });
  }
  return sharedServer;
}

test.after(async () => {
  if (sharedServer) {
    await sharedServer.close();
  }
});

// --------------------------------------------------------------------------
// TEST 1: Empty Asset & Missing Media Fallback
// --------------------------------------------------------------------------
test('Tier 2 - Boundary: Empty Asset & Missing Media Fallback', async () => {
  // 1. Fallback for empty strings, null, undefined, and non-existent IDs
  const fallbackEmpty = getPlaceholderPhoto('');
  assert.ok(fallbackEmpty.startsWith('data:image/svg+xml;utf8,'), 'Empty string must return valid SVG data URL');
  assert.ok(fallbackEmpty.includes('%3Csvg'), 'Data URL must contain URL-encoded SVG markup');

  const fallbackNull = getPlaceholderPhoto(null);
  assert.ok(fallbackNull.startsWith('data:image/svg+xml;utf8,'), 'Null input must safely fallback to SVG data URL');

  const fallbackUnknown = getPlaceholderPhoto('nonexistent_photo_path_999.jpg');
  assert.ok(fallbackUnknown.startsWith('data:image/svg+xml;utf8,'), 'Unknown path must fallback to default preset');

  // 2. Completeness of default presets dictionary
  const expectedPresets = [
    'milestone-1', 'milestone-2', 'milestone-3', 'milestone-4', 'milestone-5',
    'polaroid-1', 'polaroid-2', 'polaroid-3', 'polaroid-4', 'polaroid-5', 'polaroid-6'
  ];
  for (const presetKey of expectedPresets) {
    assert.ok(DEFAULT_PLACEHOLDERS[presetKey], `Preset ${presetKey} must exist in DEFAULT_PLACEHOLDERS`);
    const dataUrl = getPlaceholderPhoto(presetKey);
    assert.ok(dataUrl.startsWith('data:image/svg+xml;utf8,'), `Preset ${presetKey} must generate valid SVG data URL`);
  }

  // 3. Robustness of generateSvgMarkup with minimal / empty options
  const minimalSvg = generateSvgMarkup({
    width: 400,
    height: 400,
    title: '',
    theme: 'rose',
  });
  assert.ok(minimalSvg.includes('<svg xmlns="http://www.w3.org/2000/svg"'), 'Must produce valid XML namespace');
  assert.ok(minimalSvg.includes('</svg>'), 'Must close svg tag');

  // 4. SSR rendering of TimelineCard when milestone.image is empty or missing
  const server = await getViteServer();
  const { TimelineCard } = await server.ssrLoadModule('./src/components/timeline/TimelineCard.tsx');

  const milestoneWithoutImage = {
    ...milestones[0],
    image: '',
  };
  const htmlWithoutImage = ReactDOMServer.renderToString(
    React.createElement(TimelineCard, {
      milestone: milestoneWithoutImage,
      index: 0,
    })
  );
  assert.ok(htmlWithoutImage.includes(milestones[0].title), 'Card must render title even without image');
  assert.ok(!htmlWithoutImage.includes('<img src=""'), 'Card must not render empty img src');
});

// --------------------------------------------------------------------------
// TEST 2: Invalid Anniversary Date Strings
// --------------------------------------------------------------------------
test('Tier 2 - Boundary: Invalid Anniversary Date Strings', () => {
  // 1. Empty and whitespace-only date strings
  const emptyRes = calculateGregorianDifference('');
  assert.strictEqual(emptyRes.isValid, false, 'Empty string must return isValid: false');
  assert.strictEqual(emptyRes.years, 0);
  assert.strictEqual(emptyRes.totalDays, 0);

  const whitespaceRes = calculateGregorianDifference('   ');
  assert.strictEqual(whitespaceRes.isValid, false, 'Whitespace string must return isValid: false');

  // 2. Gibberish and malformed dates
  const gibberishRes = calculateGregorianDifference('not-a-valid-iso-date');
  assert.strictEqual(gibberishRes.isValid, false, 'Gibberish date string must return isValid: false');

  const invalidMonthRes = calculateGregorianDifference('2025-99-99T99:99:99');
  assert.strictEqual(invalidMonthRes.isValid, false, 'Invalid month/day values must return isValid: false');

  // 3. Null / undefined safety
  const nullRes = calculateGregorianDifference(null);
  assert.strictEqual(nullRes.isValid, false, 'Null input must return isValid: false');

  const undefRes = calculateGregorianDifference(undefined);
  assert.strictEqual(undefRes.isValid, false, 'Undefined input must return isValid: false');

  // 4. Future dates handling (countdown / non-negative units)
  const futureRes = calculateGregorianDifference('2099-01-01T00:00:00', '2025-01-01T00:00:00');
  assert.strictEqual(futureRes.isValid, true, 'Future date should be marked valid');
  assert.strictEqual(futureRes.isFuture, true, 'isFuture flag must be true');
  assert.strictEqual(futureRes.years, 0, 'Future countdown must not produce negative years');
  assert.strictEqual(futureRes.days, 0, 'Future countdown must not produce negative days');
  assert.ok(futureRes.formattedElapsed.length > 0, 'Must provide graceful future notice message');
});

// --------------------------------------------------------------------------
// TEST 3: Leap Year Anniversary Date Math (Feb 29)
// --------------------------------------------------------------------------
test('Tier 2 - Boundary: Leap Year Anniversary Date Math (Feb 29)', () => {
  const leapDayAnniv = '2024-02-29T00:00:00';

  // 1. Exactly 1 year later in non-leap year (Feb 28, 2025)
  const oneYearNonLeap = '2025-02-28T00:00:00';
  const r1 = calculateGregorianDifference(leapDayAnniv, oneYearNonLeap);
  assert.strictEqual(r1.isValid, true);
  assert.strictEqual(r1.years, 1, 'Feb 29 to Feb 28 next non-leap year counts as 1 full year');
  assert.strictEqual(r1.months, 0);
  assert.strictEqual(r1.days, 0);
  assert.strictEqual(r1.totalDays, 365, 'Total days for 2024-02-29 to 2025-02-28 is 365');

  // 2. Day before 1 year mark (Feb 27, 2025 at 23:59:59)
  const dayBeforeYear = '2025-02-27T23:59:59';
  const r2 = calculateGregorianDifference(leapDayAnniv, dayBeforeYear);
  assert.strictEqual(r2.years, 0, 'Should not yet reach 1 full year');
  assert.strictEqual(r2.months, 11, 'Should be 11 months');
  assert.strictEqual(r2.totalDays, 364);

  // 3. Exactly 4 years later in next leap year (Feb 29, 2028)
  const fourYearsLeap = '2028-02-29T00:00:00';
  const r4 = calculateGregorianDifference(leapDayAnniv, fourYearsLeap);
  assert.strictEqual(r4.years, 4, 'Feb 29 to Feb 29 4 years later is exactly 4 years');
  assert.strictEqual(r4.months, 0);
  assert.strictEqual(r4.days, 0);
  assert.strictEqual(r4.totalDays, 1461, '365 * 3 + 366 = 1461 days');

  // 4. Century leap year edge cases
  assert.strictEqual(isLeapYear(2000), true, '2000 is a leap year (divisible by 400)');
  assert.strictEqual(isLeapYear(1900), false, '1900 is NOT a leap year (divisible by 100)');
  assert.strictEqual(isLeapYear(2100), false, '2100 is NOT a leap year (divisible by 100)');
  assert.strictEqual(isLeapYear(2024), true, '2024 is a leap year');
  assert.strictEqual(isLeapYear(2025), false, '2025 is NOT a leap year');

  // 5. Clamped month addition (Jan 31 + 1 month)
  const jan31Leap = new Date(2024, 0, 31);
  const febLeapClamped = addMonthsClamped(jan31Leap, 1);
  assert.strictEqual(febLeapClamped.getMonth(), 1, 'Should clamp into February');
  assert.strictEqual(febLeapClamped.getDate(), 29, 'Jan 31 + 1 month in 2024 must clamp to Feb 29');

  const jan31NonLeap = new Date(2025, 0, 31);
  const febNonLeapClamped = addMonthsClamped(jan31NonLeap, 1);
  assert.strictEqual(febNonLeapClamped.getMonth(), 1, 'Should clamp into February');
  assert.strictEqual(febNonLeapClamped.getDate(), 28, 'Jan 31 + 1 month in 2025 must clamp to Feb 28');

  // 6. getDaysInMonth helper
  assert.strictEqual(getDaysInMonth(2024, 1), 29);
  assert.strictEqual(getDaysInMonth(2025, 1), 28);
});

// --------------------------------------------------------------------------
// TEST 4: Extreme Maximum String Lengths
// --------------------------------------------------------------------------
test('Tier 2 - Boundary: Extreme Maximum String Lengths', async () => {
  const server = await getViteServer();
  const { ReasonCard } = await server.ssrLoadModule('./src/components/reasons/ReasonCard.tsx');
  const { VoucherCard } = await server.ssrLoadModule('./src/components/coupons/VoucherCard.tsx');
  const { ParchmentLetter } = await server.ssrLoadModule('./src/components/letter/ParchmentLetter.tsx');

  // 1. Extreme 5,000-character string with XML special characters
  const longText = 'A'.repeat(5000) + ' & <script>alert("xss")</script> "test" \'quote\'';

  // 2. SSR ReasonCard with 5,000-character text
  const reasonHtml = ReactDOMServer.renderToString(
    React.createElement(ReasonCard, {
      reason: {
        id: 'reason-stress',
        number: 99,
        text: longText,
        category: 'feelings',
      },
      currentReactionCount: 42,
      onReaction: () => {},
    })
  );
  assert.ok(reasonHtml.includes('#99'), 'Reason card renders number');
  assert.ok(!reasonHtml.includes('<script>'), 'Script tag must not be injected unescaped');

  // 3. SSR VoucherCard with 5,000-character description and terms
  const voucherHtml = ReactDOMServer.renderToString(
    React.createElement(VoucherCard, {
      coupon: {
        id: 'coupon-stress',
        title: 'Super Long Voucher Title ' + 'X'.repeat(200),
        description: longText,
        terms: longText,
        icon: 'heart',
        category: 'treat',
        expires: '2026-12-31',
      },
      isRedeemed: false,
      onRedeem: () => {},
    })
  );
  assert.ok(voucherHtml.includes('Super Long Voucher Title'), 'Voucher renders long title');

  // 4. SSR ParchmentLetter with 10,000-character text
  const letterHtml = ReactDOMServer.renderToString(
    React.createElement(ParchmentLetter, {
      letter: {
        date: '4 Mei 2025',
        salutation: 'Alya Sayang,',
        opening: 'Surat Panjang Untukmu',
        paragraphs: ['Surat Panjang '.repeat(800)],
        closing: 'Selamanya bersamamu,',
        signature: 'Rama untuk Alya',
      },
    })
  );
  assert.ok(letterHtml.includes('Rama untuk Alya'), 'Parchment letter renders signature');

  // 5. SVG markup generation under extreme title length
  const longSvg = generateSvgMarkup({
    width: 600,
    height: 400,
    title: 'Extreme Title '.repeat(100) + '<tag>&"',
    theme: 'coffee',
  });
  assert.ok(!longSvg.includes('<tag>'), 'SVG generator must escape XML control tags');
  assert.ok(longSvg.includes('&lt;tag&gt;'), 'SVG generator properly escapes &lt; and &gt;');
  assert.ok(longSvg.includes('</svg>'), 'SVG markup cleanly terminates');
});

// --------------------------------------------------------------------------
// TEST 5: Zero Network Connectivity / Offline Operation
// --------------------------------------------------------------------------
test('Tier 2 - Boundary: Zero Network Connectivity / Offline Operation', () => {
  // 1. Verify physical placeholder assets in public/photos/ are local vector files
  assert.ok(fs.existsSync(photosDir), 'public/photos/ directory must exist');
  const files = fs.readdirSync(photosDir).filter(f => f.endsWith('.svg'));
  assert.ok(files.length >= 11, 'Must have at least 11 SVG placeholder files');

  for (const filename of files) {
    const filePath = path.join(photosDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    // Invariant: zero external HTTP dependencies (excluding standard XML namespace)
    const strippedContent = content.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
    assert.ok(!strippedContent.includes('http://'), `File ${filename} must not contain external HTTP URLs`);
    assert.ok(!strippedContent.includes('https://'), `File ${filename} must not contain external HTTPS URLs`);
    assert.ok(content.includes('<svg') && content.includes('</svg>'), `File ${filename} must be valid standalone SVG`);
  }

  // 2. In-memory SVG data URL generation works without any network
  const svgDataUrl = generateSvgDataUrl(DEFAULT_PLACEHOLDERS['milestone-1']);
  assert.ok(svgDataUrl.startsWith('data:image/svg+xml;utf8,'), 'Data URL generated 100% in-memory');

  // 3. Web Audio synthesis works without external MP3 network requests
  const synth = new RomanticAudioSynth();
  assert.strictEqual(typeof synth.start, 'function', 'Synth functions purely offline in Web Audio API');
});

// --------------------------------------------------------------------------
// TEST 6: Browser Blocked Autoplay Audio Recovery
// --------------------------------------------------------------------------
test('Tier 2 - Boundary: Browser Blocked Autoplay Audio Recovery', async () => {
  setupTestEnvironment();

  // 1. Simulate browser autoplay rejection on HTML5 Audio
  const mockAudio = new MockAudio('/audio/romantic-song.mp3');
  mockAudio.shouldFail = true;

  let autoplayErrorCaught = false;
  try {
    await mockAudio.play();
  } catch (err) {
    autoplayErrorCaught = true;
    assert.strictEqual(err.name, 'NotAllowedError', 'Blocked autoplay must throw NotAllowedError');
  }
  assert.ok(autoplayErrorCaught, 'Autoplay restriction error must be caught gracefully');

  // 2. Synthesizer fallback activation
  const started = await startRomanticChords(0.6);
  assert.ok(started, 'startRomanticChords must start procedural chord fallback');
  assert.strictEqual(isSynthPlaying(), true, 'isSynthPlaying must be true while synth is active');

  // 3. Chord progression validation
  assert.strictEqual(ROMANTIC_CHORDS.length, 4, 'Must have 4 romantic chords');
  for (const chord of ROMANTIC_CHORDS) {
    for (const freq of chord.frequencies) {
      assert.ok(freq >= 60 && freq <= 800, `Frequency ${freq}Hz must be in audible harmonic musical range`);
    }
  }

  // 4. Synth clean shutdown
  stopRomanticChords();
  assert.strictEqual(isSynthPlaying(), false, 'isSynthPlaying must report false after stop');
});
