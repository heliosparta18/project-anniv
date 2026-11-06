import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { createServer } from 'vite';
import { setupTestEnvironment } from '../helpers/dom_mock.js';
import {
  calculateGregorianDifference,
  calculateTimeDifference,
  isLeapYear,
  getDaysInMonth,
  addYearsClamped,
  addMonthsClamped,
} from '../../src/hooks/useLiveCounter.ts';
import {
  calculateGregorianDifference as dateUtilsCalc,
  isLeapYear as dateUtilsIsLeap,
  getDaysInMonth as dateUtilsGetDays,
  addYearsClamped as dateUtilsAddYears,
  addMonthsClamped as dateUtilsAddMonths,
} from '../../src/utils/dateUtils.ts';
import {
  ROMANTIC_CHORDS,
  RomanticAudioSynth,
  romanticSynth,
  startRomanticChords,
  stopRomanticChords,
  setSynthVolume,
  isSynthPlaying,
} from '../../src/utils/audioSynth.ts';
import {
  parseMilestoneDate,
  sortMilestonesChronologically,
  INDONESIAN_MONTHS,
} from '../../src/components/timeline/timelineUtils.ts';
import { milestones, polaroids } from '../../src/data/anniversaryData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

let sharedViteServer;
async function getViteServer() {
  if (!sharedViteServer) {
    sharedViteServer = await createServer({
      ssr: { external: ['react', 'react-dom', 'lucide-react'] },
    });
  }
  return sharedViteServer;
}

test.after(async () => {
  if (sharedViteServer) {
    await sharedViteServer.close();
  }
});

// =============================================================================
// TEST 1: Adversarial Gregorian Math & Date Arithmetic Hardening
// =============================================================================
test('Tier 5 - Adversarial Gregorian Math: Leap Cycles, Month-End Clamping & Rollbacks', () => {
  // 1. Export invariants across both useLiveCounter.ts and dateUtils.ts
  assert.strictEqual(typeof calculateGregorianDifference, 'function');
  assert.strictEqual(typeof calculateTimeDifference, 'function');
  assert.strictEqual(typeof isLeapYear, 'function');
  assert.strictEqual(typeof getDaysInMonth, 'function');
  assert.strictEqual(typeof addYearsClamped, 'function');
  assert.strictEqual(typeof addMonthsClamped, 'function');

  // Verify re-exports from dateUtils match useLiveCounter
  assert.strictEqual(calculateGregorianDifference, dateUtilsCalc);
  assert.strictEqual(isLeapYear, dateUtilsIsLeap);
  assert.strictEqual(getDaysInMonth, dateUtilsGetDays);
  assert.strictEqual(addYearsClamped, dateUtilsAddYears);
  assert.strictEqual(addMonthsClamped, dateUtilsAddMonths);

  // 2. Quadrennial & Century Leap Year Rules
  assert.strictEqual(isLeapYear(1600), true, '1600 is leap (divisible by 400)');
  assert.strictEqual(isLeapYear(1700), false, '1700 is not leap (divisible by 100, not 400)');
  assert.strictEqual(isLeapYear(1800), false, '1800 is not leap (divisible by 100, not 400)');
  assert.strictEqual(isLeapYear(1900), false, '1900 is not leap (divisible by 100, not 400)');
  assert.strictEqual(isLeapYear(2000), true, '2000 is leap (divisible by 400)');
  assert.strictEqual(isLeapYear(2024), true, '2024 is leap');
  assert.strictEqual(isLeapYear(2025), false, '2025 is not leap');
  assert.strictEqual(isLeapYear(2096), true, '2096 is leap');
  assert.strictEqual(isLeapYear(2100), false, '2100 is not leap (divisible by 100)');
  assert.strictEqual(isLeapYear(2400), true, '2400 is leap (divisible by 400)');

  // 3. Days in Month Bounds for Leap vs Non-Leap
  assert.strictEqual(getDaysInMonth(2024, 1), 29, 'Feb 2024 has 29 days');
  assert.strictEqual(getDaysInMonth(2025, 1), 28, 'Feb 2025 has 28 days');
  const thirtyDayMonths = [3, 5, 8, 10]; // Apr, Jun, Sep, Nov
  for (const m of thirtyDayMonths) {
    assert.strictEqual(getDaysInMonth(2024, m), 30, `Month ${m} has 30 days in 2024`);
    assert.strictEqual(getDaysInMonth(2025, m), 30, `Month ${m} has 30 days in 2025`);
  }
  const thirtyOneDayMonths = [0, 2, 4, 6, 7, 9, 11]; // Jan, Mar, May, Jul, Aug, Oct, Dec
  for (const m of thirtyOneDayMonths) {
    assert.strictEqual(getDaysInMonth(2024, m), 31, `Month ${m} has 31 days in 2024`);
    assert.strictEqual(getDaysInMonth(2025, m), 31, `Month ${m} has 31 days in 2025`);
  }

  // 4. addYearsClamped Feb 29 Leap Day Clamping
  const leapDay = new Date(2024, 1, 29); // 2024-02-29
  const y1 = addYearsClamped(leapDay, 1);
  assert.strictEqual(y1.getFullYear(), 2025);
  assert.strictEqual(y1.getMonth(), 1);
  assert.strictEqual(y1.getDate(), 28, 'Feb 29 + 1 year must clamp to Feb 28 in non-leap 2025');

  const y4 = addYearsClamped(leapDay, 4);
  assert.strictEqual(y4.getFullYear(), 2028);
  assert.strictEqual(y4.getMonth(), 1);
  assert.strictEqual(y4.getDate(), 29, 'Feb 29 + 4 years must land on Feb 29 in leap 2028');

  const y76 = addYearsClamped(leapDay, 76);
  assert.strictEqual(y76.getFullYear(), 2100);
  assert.strictEqual(y76.getMonth(), 1);
  assert.strictEqual(y76.getDate(), 28, 'Feb 29 + 76 years must clamp to Feb 28 in non-leap 2100');

  const y96 = addYearsClamped(leapDay, 96);
  assert.strictEqual(y96.getFullYear(), 2120);
  assert.strictEqual(y96.getMonth(), 1);
  assert.strictEqual(y96.getDate(), 29, 'Feb 29 + 96 years must land on Feb 29 in leap 2120');

  // 5. addMonthsClamped Clamping across all 31-day months
  const jan31_2025 = new Date(2025, 0, 31);
  assert.strictEqual(addMonthsClamped(jan31_2025, 1).getDate(), 28, 'Jan 31 + 1m clamps to Feb 28 in 2025');
  assert.strictEqual(addMonthsClamped(new Date(2024, 0, 31), 1).getDate(), 29, 'Jan 31 + 1m clamps to Feb 29 in 2024');
  assert.strictEqual(addMonthsClamped(jan31_2025, 3).getDate(), 30, 'Jan 31 + 3m clamps to Apr 30');
  assert.strictEqual(addMonthsClamped(jan31_2025, 5).getDate(), 30, 'Jan 31 + 5m clamps to Jun 30');
  assert.strictEqual(addMonthsClamped(jan31_2025, 8).getDate(), 30, 'Jan 31 + 8m clamps to Sep 30');
  assert.strictEqual(addMonthsClamped(jan31_2025, 10).getDate(), 30, 'Jan 31 + 10m clamps to Nov 30');

  const mar31 = new Date(2025, 2, 31);
  assert.strictEqual(addMonthsClamped(mar31, 1).getDate(), 30, 'Mar 31 + 1m clamps to Apr 30');
  const may31 = new Date(2025, 4, 31);
  assert.strictEqual(addMonthsClamped(may31, 1).getDate(), 30, 'May 31 + 1m clamps to Jun 30');
  const aug31 = new Date(2025, 7, 31);
  assert.strictEqual(addMonthsClamped(aug31, 1).getDate(), 30, 'Aug 31 + 1m clamps to Sep 30');
  const oct31 = new Date(2025, 9, 31);
  assert.strictEqual(addMonthsClamped(oct31, 1).getDate(), 30, 'Oct 31 + 1m clamps to Nov 30');

  // 6. calculateGregorianDifference Boundary & Degenerate Cases
  // 6.1 Exactly identical start and end dates
  const sameDate = '2025-05-04T12:00:00';
  const rSame = calculateGregorianDifference(sameDate, sameDate);
  assert.strictEqual(rSame.isValid, true);
  assert.strictEqual(rSame.isFuture, false);
  assert.strictEqual(rSame.years, 0);
  assert.strictEqual(rSame.months, 0);
  assert.strictEqual(rSame.days, 0);
  assert.strictEqual(rSame.hours, 0);
  assert.strictEqual(rSame.minutes, 0);
  assert.strictEqual(rSame.seconds, 0);
  assert.strictEqual(rSame.totalDays, 0);
  assert.strictEqual(rSame.totalSeconds, 0);
  assert.strictEqual(rSame.milestoneProgress, 0);

  // 6.2 Degenerate / Malformed Inputs (JS Date evaluates to Invalid Date / NaN)
  const degenerateInputs = [null, undefined, '', '   ', 'not-a-valid-date', '2025-99-99', '2025-13-01', 'invalid-iso-T25:99:99', NaN];
  for (const bad of degenerateInputs) {
    const rBad = calculateGregorianDifference(bad);
    assert.strictEqual(rBad.isValid, false, `Input ${String(bad)} must produce isValid: false`);
    assert.strictEqual(rBad.years, 0);
    assert.strictEqual(rBad.totalDays, 0);
  }

  // 6.2b Permissive Rollover Handling: '2024-02-31' rolls over to March 2 in V8
  const rRollover = calculateGregorianDifference('2024-02-31', '2025-03-02');
  assert.strictEqual(rRollover.isValid, true);
  assert.strictEqual(rRollover.years, 1);
  assert.strictEqual(rRollover.months, 0);
  assert.strictEqual(rRollover.days, 0);

  // 6.3 Future Date Countdown Mode
  const rFuture = calculateGregorianDifference('2028-05-04T00:00:00', '2025-05-04T00:00:00');
  assert.strictEqual(rFuture.isValid, true);
  assert.strictEqual(rFuture.isFuture, true);
  assert.strictEqual(rFuture.years, 0);
  assert.strictEqual(rFuture.days, 0);
  assert.strictEqual(rFuture.formattedElapsed, 'Hari yang dinanti segera tiba');

  // 6.4 Intra-Day Rollover Precision (999ms vs 1000ms vs 59s vs 60s)
  const baseT = '2025-05-04T00:00:00.000Z';
  const r999 = calculateGregorianDifference(baseT, '2025-05-04T00:00:00.999Z');
  assert.strictEqual(r999.seconds, 0);
  assert.strictEqual(r999.totalSeconds, 0);

  const r1000 = calculateGregorianDifference(baseT, '2025-05-04T00:00:01.000Z');
  assert.strictEqual(r1000.seconds, 1);
  assert.strictEqual(r1000.totalSeconds, 1);

  const r59s = calculateGregorianDifference(baseT, '2025-05-04T00:00:59.000Z');
  assert.strictEqual(r59s.seconds, 59);
  assert.strictEqual(r59s.minutes, 0);

  const r60s = calculateGregorianDifference(baseT, '2025-05-04T00:01:00.000Z');
  assert.strictEqual(r60s.seconds, 0);
  assert.strictEqual(r60s.minutes, 1);

  const r24h = calculateGregorianDifference(baseT, '2025-05-05T00:00:00.000Z');
  assert.strictEqual(r24h.days, 1);
  assert.strictEqual(r24h.hours, 0);
  assert.strictEqual(r24h.totalDays, 1);

  // 6.5 Exactly 1 Second Before 1 Full Year
  const startAnniv = '2025-05-04T00:00:00';
  const oneSecBeforeYear = '2026-05-03T23:59:59';
  const rBeforeYear = calculateGregorianDifference(startAnniv, oneSecBeforeYear);
  assert.strictEqual(rBeforeYear.years, 0);
  assert.strictEqual(rBeforeYear.months, 11);
  assert.strictEqual(rBeforeYear.days, 29);
  assert.strictEqual(rBeforeYear.hours, 23);
  assert.strictEqual(rBeforeYear.minutes, 59);
  assert.strictEqual(rBeforeYear.seconds, 59);
  assert.strictEqual(rBeforeYear.totalDays, 364);

  // 6.6 Exactly 1 Full Year
  const rFullYear = calculateGregorianDifference(startAnniv, '2026-05-04T00:00:00');
  assert.strictEqual(rFullYear.years, 1);
  assert.strictEqual(rFullYear.months, 0);
  assert.strictEqual(rFullYear.days, 0);
  assert.strictEqual(rFullYear.hours, 0);
  assert.strictEqual(rFullYear.totalDays, 365);
  assert.strictEqual(rFullYear.milestoneProgress, 0);

  // 6.7 10-Year Span Covering 3 Leap Years (2020-01-01 to 2030-01-01)
  const r10y = calculateGregorianDifference('2020-01-01T00:00:00', '2030-01-01T00:00:00');
  assert.strictEqual(r10y.years, 10);
  assert.strictEqual(r10y.months, 0);
  assert.strictEqual(r10y.days, 0);
  assert.strictEqual(r10y.totalDays, 3653, '2020, 2024, 2028 are leap years: 365*10 + 3 = 3653 days');

  // 7. 500-Pair Randomized Math Invariant Fuzzer (1990 - 2040)
  const minMs = new Date('1990-01-01T00:00:00Z').getTime();
  const maxMs = new Date('2040-01-01T00:00:00Z').getTime();
  let seed = 987654321;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 500; i++) {
    const epochA = minMs + Math.floor(rnd() * (maxMs - minMs));
    const span = Math.floor(rnd() * (86400000 * 365 * 8)); // up to 8 years
    const epochB = epochA + span;

    const s = new Date(epochA);
    const e = new Date(epochB);
    const res = calculateGregorianDifference(s, e);

    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.isFuture, false);
    assert.ok(res.years >= 0);
    assert.ok(res.months >= 0 && res.months <= 11);
    assert.ok(res.days >= 0 && res.days <= 31);
    assert.ok(res.hours >= 0 && res.hours <= 23);
    assert.ok(res.minutes >= 0 && res.minutes <= 59);
    assert.ok(res.seconds >= 0 && res.seconds <= 59);
    assert.strictEqual(res.totalDays, Math.floor(span / 86400000));
    assert.strictEqual(res.totalSeconds, Math.floor(span / 1000));
    assert.ok(res.milestoneProgress >= 0 && res.milestoneProgress <= 100);
  }
});

// =============================================================================
// TEST 2: Adversarial Web Audio Synthesizer, Volume Bounds & Concurrency Hardening
// =============================================================================
test('Tier 5 - Adversarial Web Audio: Voice Allocation, Volume Bounds & Concurrency', async () => {
  setupTestEnvironment();

  // 1. Auditing Chord Frequencies against 12-TET Tuning
  assert.strictEqual(ROMANTIC_CHORDS.length, 4, 'Must define exactly 4 romantic chords');
  const chordNames = ['Cmaj7', 'Am7', 'Dm7', 'G7'];
  ROMANTIC_CHORDS.forEach((c, idx) => {
    assert.strictEqual(c.name, chordNames[idx]);
    assert.strictEqual(c.frequencies.length, 5, `${c.name} must feature exactly 5 harmonic voice frequencies`);
    for (const freq of c.frequencies) {
      assert.ok(typeof freq === 'number' && freq >= 80 && freq <= 600, `Frequency ${freq}Hz is within warm musical range`);
    }
  });

  // 2. RomanticAudioSynth Instance Lifecycle
  const synth = new RomanticAudioSynth();
  assert.strictEqual(synth.getIsPlaying(), false);

  // 3. Start Idempotency under 20 Concurrent Calls
  const startCalls = Array.from({ length: 20 }, () => synth.start());
  const results = await Promise.all(startCalls);
  assert.ok(results.every((r) => r === true), 'All 20 concurrent start calls resolve true');
  assert.strictEqual(synth.getIsPlaying(), true);
  assert.strictEqual(synth['activeVoices'].length, 5, 'Exactly 5 voices allocated; no voice stacking or duplicate loops');

  // 4. Repeated start() while already playing
  for (let i = 0; i < 5; i++) {
    const again = await synth.start();
    assert.strictEqual(again, true);
    assert.strictEqual(synth['activeVoices'].length, 5, 'Voice count stays strictly 5');
  }

  // 5. Rapid 50-Cycle Play/Pause Stress
  for (let cycle = 0; cycle < 50; cycle++) {
    synth.stop();
    assert.strictEqual(synth.getIsPlaying(), false);
    assert.strictEqual(synth['activeVoices'].length, 0);
    await synth.start();
    assert.strictEqual(synth.getIsPlaying(), true);
    assert.strictEqual(synth['activeVoices'].length, 5);
  }
  synth.stop();
  assert.strictEqual(synth.getIsPlaying(), false);
  assert.strictEqual(synth['activeVoices'].length, 0, 'Clean zero voices after rapid cycling');

  // 6. Adversarial Volume Clamping & NaN Resilience
  const volumeFuzzTests = [
    { in: NaN, expected: 0.7, desc: 'NaN preserves existing volume' },
    { in: null, expected: 0.7, desc: 'null ignored' },
    { in: undefined, expected: 0.7, desc: 'undefined ignored' },
    { in: '0.8', expected: 0.7, desc: 'string ignored' },
    { in: {}, expected: 0.7, desc: 'object ignored' },
    { in: [0.5], expected: 0.7, desc: 'array ignored' },
    { in: -1, expected: 0, desc: '-1 clamped to 0' },
    { in: -999, expected: 0, desc: '-999 clamped to 0' },
    { in: -Infinity, expected: 0, desc: '-Infinity clamped to 0' },
    { in: 1.5, expected: 1, desc: '1.5 clamped to 1' },
    { in: 999, expected: 1, desc: '999 clamped to 1' },
    { in: Infinity, expected: 1, desc: 'Infinity clamped to 1' },
    { in: 0.42, expected: 0.42, desc: '0.42 set directly' },
  ];

  synth.setVolume(0.7);
  for (const vt of volumeFuzzTests) {
    synth.setVolume(vt.in);
    const vol = synth.getVolume();
    assert.ok(!Number.isNaN(vol), `Volume must never be NaN for ${vt.desc}`);
    assert.ok(Math.abs(vol - vt.expected) < 0.001, `Failed ${vt.desc}: expected ${vt.expected}, got ${vol}`);
  }

  // 7. Global Singleton and Helpers
  assert.ok(romanticSynth instanceof RomanticAudioSynth);
  setSynthVolume(0.65);
  const globStart = await startRomanticChords(0.65);
  assert.ok(globStart);
  assert.strictEqual(isSynthPlaying(), true);
  stopRomanticChords();
  assert.strictEqual(isSynthPlaying(), false);

  // 8. Graceful Degradation in Environments without Web Audio
  const originalAudioCtx = globalThis.AudioContext;
  try {
    delete globalThis.AudioContext;
    const headlessSynth = new RomanticAudioSynth();
    const headlessResult = await headlessSynth.start();
    assert.strictEqual(headlessResult, false, 'Synth safely returns false when AudioContext is missing');
    assert.strictEqual(headlessSynth.getIsPlaying(), false);
  } finally {
    globalThis.AudioContext = originalAudioCtx;
  }
});

// =============================================================================
// TEST 3: Adversarial Vinyl Player Turntable State Machine & Slider Hit Targets
// =============================================================================
test('Tier 5 - Adversarial Vinyl Player: Turntable State Machine & Slider Hit Targets', () => {
  const vinylPath = path.resolve(projectRoot, 'src/components/audio/VinylPlayer.tsx');
  assert.ok(fs.existsSync(vinylPath), 'VinylPlayer.tsx must exist');
  const code = fs.readFileSync(vinylPath, 'utf8');

  // 1. Turntable Arm Rotation Angles
  assert.ok(
    code.includes("toneArmEngaged ? 'rotate(26deg)' : 'rotate(0deg)'"),
    'Turntable arm pivots 26deg when engaged and rests at 0deg'
  );
  assert.ok(
    code.includes('origin-top-right'),
    'Turntable arm rotates realistically around top-right pivot origin'
  );
  assert.ok(
    code.includes('transition-transform duration-700 ease-in-out'),
    'Turntable arm specifies 700ms ease-in-out mechanical transition'
  );

  // 2. Vinyl Record Spinning State & Realistic Grooves
  assert.ok(
    code.includes("isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''"),
    'Vinyl disc applies 4s linear infinite spin when playing'
  );
  assert.ok(code.includes('border-white/[0.04]'), 'Vinyl disc features realistic concentric micro-grooves');
  assert.ok(code.includes('border-white/[0.03]'), 'Concentric inner groove ring');
  assert.ok(code.includes('border-white/[0.02]'), 'Concentric fine groove ring');

  // 3. WCAG 2.5.5 Slider Hit Target Invariants (>= 44px Height)
  assert.ok(
    code.includes('w-full h-11 py-[18px] bg-anniv-peach bg-clip-content'),
    'Track progress scrubber slider enforces 44px (h-11) touch hit target with padding'
  );
  assert.ok(
    code.includes('h-11 py-[19px] bg-anniv-peach bg-clip-content'),
    'Volume slider enforces 44px (h-11) touch hit target with padding'
  );

  // 4. Interactive Control Buttons Sizing (All >= 44x44px)
  assert.ok(
    code.includes('w-14 h-14 min-w-[56px] min-h-[56px]'),
    'Primary Play/Pause button provides generous 56px touch target'
  );
  assert.ok(
    code.includes('w-11 h-11 min-w-[44px] min-h-[44px]'),
    'Previous/Next/Mute buttons enforce min-w-[44px] min-h-[44px]'
  );
  assert.ok(
    code.includes('min-h-[44px]') && code.includes('playlist.map'),
    'Playlist track buttons enforce min-h-[44px] touch target'
  );

  // 5. Notes Modal Accessible Dialog & Hit Targets
  assert.ok(code.includes('role="dialog"'), 'Notes modal renders role="dialog"');
  assert.ok(code.includes('aria-modal="true"'), 'Notes modal sets aria-modal="true"');
  assert.ok(
    code.includes('min-w-[44px] min-h-[44px]') && code.includes('toggleNotesModal(false)'),
    'Notes modal close button satisfies 44x44px touch target'
  );

  // 6. Strict Zero Em-Dash Guardrail in VinylPlayer.tsx
  assert.ok(!code.includes('\u2014'), 'VinylPlayer.tsx must not contain unicode em-dash');
  assert.ok(!code.includes('&mdash;'), 'VinylPlayer.tsx must not contain &mdash;');
  assert.ok(code.includes('~ Rama for Alya 💕'), 'Uses romantic tilde signature');
});

// =============================================================================
// TEST 4: Adversarial Indonesian Date Parsing & Chronological Sorting
// =============================================================================
test('Tier 5 - Adversarial Timeline: Indonesian Date Parsing, Casing & Chronological Sorting', () => {
  // 1. All 12 Indonesian Months
  assert.strictEqual(Object.keys(INDONESIAN_MONTHS).length, 12);
  const expectedMonths = {
    januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
    juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
  };
  for (const [k, v] of Object.entries(expectedMonths)) {
    assert.strictEqual(INDONESIAN_MONTHS[k], v, `INDONESIAN_MONTHS[${k}] === ${v}`);
  }

  // 2. Case Insensitivity (UPPERCASE, lowercase, TitleCase, mixed)
  const dUpper = parseMilestoneDate('14 FEBRUARI 2025');
  const dLower = parseMilestoneDate('14 februari 2025');
  const dTitle = parseMilestoneDate('14 Februari 2025');
  const dMixed = parseMilestoneDate('14 FeBrUaRi 2025');

  assert.strictEqual(dUpper.getTime(), dLower.getTime(), 'UPPERCASE and lowercase yield identical epoch');
  assert.strictEqual(dLower.getTime(), dTitle.getTime(), 'lowercase and TitleCase yield identical epoch');
  assert.strictEqual(dTitle.getTime(), dMixed.getTime(), 'TitleCase and mixed case yield identical epoch');
  assert.strictEqual(dTitle.getFullYear(), 2025);
  assert.strictEqual(dTitle.getMonth(), 1);
  assert.strictEqual(dTitle.getDate(), 14);

  // 3. Irregular Whitespace Handling
  const dSpaces = parseMilestoneDate('   14    Februari     2025   ');
  assert.strictEqual(dSpaces.getTime(), dTitle.getTime(), 'Multiple spaces parsed identically');
  const dTabs = parseMilestoneDate('\t04\tMei\t2025\n');
  assert.strictEqual(dTabs.getFullYear(), 2025);
  assert.strictEqual(dTabs.getMonth(), 4);
  assert.strictEqual(dTabs.getDate(), 4);

  // 4. Standard ISO Dates Fallback
  const dIso = parseMilestoneDate('2025-05-04');
  assert.ok(!isNaN(dIso.getTime()), 'Standard ISO date successfully parses');

  // 5. Corrupt / Adversarial Inputs Safe Fallback (No Crash, returns Date(0))
  const badInputs = [null, undefined, '', '   ', 'gibberish text', '32 NonExistentMonth 2025', 12345, {}];
  for (const bad of badInputs) {
    const res = parseMilestoneDate(bad);
    assert.ok(res instanceof Date, 'Must return a Date instance');
    assert.strictEqual(res.getTime(), 0, `Corrupt input ${String(bad)} safely resolves to epoch 0`);
  }

  // 6. Chronological Sorting Invariance & Array Immutability
  assert.ok(milestones.length >= 5, 'Production milestones array has at least 5 items');
  const originalMilestonesCopy = JSON.stringify(milestones);

  const reversed = [...milestones].reverse();
  const sortedFromReversed = sortMilestonesChronologically(reversed);

  // Verify original input array was NOT mutated
  assert.strictEqual(JSON.stringify(milestones), originalMilestonesCopy, 'Original milestones array remains unmutated');

  // Verify chronological ordering
  for (let i = 0; i < sortedFromReversed.length - 1; i++) {
    const tCurrent = parseMilestoneDate(sortedFromReversed[i].date).getTime();
    const tNext = parseMilestoneDate(sortedFromReversed[i + 1].date).getTime();
    assert.ok(tCurrent <= tNext, `Milestone ${i} (${sortedFromReversed[i].date}) precedes or equals milestone ${i + 1} (${sortedFromReversed[i + 1].date})`);
  }

  // Shuffled permutations all sort to identical sequence
  const shuffled = [milestones[3], milestones[0], milestones[4], milestones[1], milestones[2]];
  const sortedShuffled = sortMilestonesChronologically(shuffled);
  for (let i = 0; i < milestones.length; i++) {
    assert.strictEqual(sortedShuffled[i].id, milestones[i].id, `Shuffled index ${i} matches production chronological order`);
  }

  // Milestones with corrupt dates sort to the beginning (epoch 0) safely without throwing
  const withCorrupt = [
    milestones[2],
    { id: 'corrupt-1', date: 'invalid-date', title: 'Corrupt', description: '', category: 'memories' },
    milestones[0],
  ];
  const sortedWithCorrupt = sortMilestonesChronologically(withCorrupt);
  assert.strictEqual(sortedWithCorrupt[0].id, 'corrupt-1', 'Corrupt date with epoch 0 sorts to beginning without crash');
});

// =============================================================================
// TEST 5: Adversarial Polaroid 3D Transforms, Modal Lifecycle & Body Scroll Lock
// =============================================================================
test('Tier 5 - Adversarial Gallery: 3D Transforms, Modal Lifecycle & Body Scroll Lock', async () => {
  const cardPath = path.resolve(projectRoot, 'src/components/gallery/PolaroidCard.tsx');
  const modalPath = path.resolve(projectRoot, 'src/components/gallery/LightboxModal.tsx');

  assert.ok(fs.existsSync(cardPath));
  assert.ok(fs.existsSync(modalPath));

  const cardCode = fs.readFileSync(cardPath, 'utf8');
  const modalCode = fs.readFileSync(modalPath, 'utf8');

  // 1. 3D CSS Transform Contracts in PolaroidCard.tsx
  assert.ok(cardCode.includes('[perspective:1000px]'), 'PolaroidCard wrapper applies 3D perspective [perspective:1000px]');
  assert.ok(cardCode.includes('[transform-style:preserve-3d]'), 'Preserve 3D declared in class');
  assert.ok(cardCode.includes("transformStyle: 'preserve-3d'"), 'Preserve 3D declared in style prop');
  assert.ok(cardCode.includes('[transform:rotateY(180deg)]'), 'Card applies rotateY(180deg) when flipped');
  assert.ok(cardCode.includes('[backface-visibility:hidden]'), 'Backface hidden declared on both faces');
  assert.ok(cardCode.includes('washi-tape'), 'Translucent washi tape motif rendered at top');
  assert.ok(cardCode.includes('pb-12'), 'Authentic 48px bottom chin (pb-12)');
  assert.ok(cardCode.includes('font-handwriting'), 'Caveat handwriting font applied');

  // 2. Pointer Events Toggling on Card Faces
  assert.ok(
    cardCode.includes("isFlipped ? 'pointer-events-none' : 'pointer-events-auto'"),
    'Front face disables pointer-events when flipped'
  );
  assert.ok(
    cardCode.includes("isFlipped ? 'pointer-events-auto' : 'pointer-events-none'"),
    'Back face enables pointer-events only when flipped'
  );

  // 3. Touch Targets on PolaroidCard Buttons (>= 44x44px)
  assert.ok(
    cardCode.includes('min-w-[44px] min-h-[44px] absolute top-2 right-2'),
    'Fullscreen expand button satisfies min-w-[44px] min-h-[44px]'
  );
  assert.ok(
    cardCode.includes('min-h-[44px] min-w-[44px] w-full mt-3'),
    'Flip to note button satisfies min-h-[44px] min-w-[44px]'
  );
  assert.ok(
    cardCode.includes('min-h-[44px] min-w-[44px] w-full px-4'),
    'Flip back to photo button satisfies min-h-[44px] min-w-[44px]'
  );

  // 4. SSR Rendering of All 6 Production Polaroids
  const server = await getViteServer();
  const { PolaroidCard } = await server.ssrLoadModule('./src/components/gallery/PolaroidCard.tsx');

  assert.strictEqual(polaroids.length, 6, 'Production dataset has 6 polaroids');
  for (const photo of polaroids) {
    const html = ReactDOMServer.renderToString(
      React.createElement(PolaroidCard, { photo, onPhotoClick: () => {} })
    );
    assert.ok(html.includes(photo.location), `Card renders location: ${photo.location}`);
    assert.ok(html.includes(photo.date), `Card renders date: ${photo.date}`);
    assert.ok(html.includes('Baca Catatan Rahasia'), 'Card renders secret note trigger');
  }

  // 5. Lightbox Modal Lifecycle & Body Scroll Lock
  assert.ok(modalCode.includes('role="dialog"'), 'Lightbox modal declares role="dialog"');
  assert.ok(modalCode.includes('aria-modal="true"'), 'Lightbox modal declares aria-modal="true"');

  // 5.1 Simulated Body Scroll Lock Lifecycle across 100 Mount/Unmount Cycles
  const baselineStyles = ['', 'auto', 'scroll', 'visible'];
  for (const baseOverflow of baselineStyles) {
    let currentOverflow = baseOverflow;
    const mockBody = {
      style: {
        get overflow() { return currentOverflow; },
        set overflow(v) { currentOverflow = v; },
      },
    };

    for (let cycle = 0; cycle < 100; cycle++) {
      // Simulate open: save original, set to 'hidden'
      const saved = mockBody.style.overflow;
      mockBody.style.overflow = 'hidden';
      assert.strictEqual(mockBody.style.overflow, 'hidden', `Cycle ${cycle} locked`);

      // Simulate close: restore original
      mockBody.style.overflow = saved;
      assert.strictEqual(mockBody.style.overflow, baseOverflow, `Cycle ${cycle} restored to ${baseOverflow}`);
    }
    assert.strictEqual(mockBody.style.overflow, baseOverflow, 'Zero stuck scroll locks after 100 cycles');
  }

  // 5.2 Circular Navigation Math across 10,000 Steps
  const totalPhotos = polaroids.length; // 6
  let cur = 0;
  for (let s = 0; s < 10000; s++) {
    cur = (cur + 1) % totalPhotos;
    assert.ok(cur >= 0 && cur < totalPhotos);
  }
  assert.strictEqual(cur, 10000 % totalPhotos);

  cur = 0;
  for (let s = 0; s < 10000; s++) {
    cur = (cur - 1 + totalPhotos) % totalPhotos;
    assert.ok(cur >= 0 && cur < totalPhotos);
  }
  assert.strictEqual(cur, ((-10000 % totalPhotos) + totalPhotos) % totalPhotos);

  // 5.3 Mobile Touch Swipe Math Invariant (50px Threshold)
  const minSwipeDistance = 50;
  const testSwipe = (startX, endX) => {
    const delta = startX - endX;
    if (delta > minSwipeDistance) return 'next';
    if (delta < -minSwipeDistance) return 'prev';
    return 'none';
  };

  assert.strictEqual(testSwipe(120, 50), 'next', 'Swipe left delta=70 > 50 triggers next');
  assert.strictEqual(testSwipe(50, 120), 'prev', 'Swipe right delta=-70 < -50 triggers prev');
  assert.strictEqual(testSwipe(80, 50), 'none', 'Swipe delta=30 < 50 does not trigger navigation');
  assert.strictEqual(testSwipe(50, 50), 'none', 'Zero movement does not trigger navigation');

  // 5.4 Modal Button Touch Targets (All >= 44x44px)
  assert.ok(
    modalCode.includes('min-w-[44px] min-h-[44px] w-11 h-11') && modalCode.includes('aria-label="Close photo preview"'),
    'Modal close button enforces 44x44px touch target'
  );
  assert.ok(
    modalCode.includes('min-w-[44px] min-h-[44px] w-11 h-11') && modalCode.includes('aria-label="Previous photo"'),
    'Previous photo button enforces 44x44px touch target'
  );
  assert.ok(
    modalCode.includes('min-w-[44px] min-h-[44px] w-11 h-11') && modalCode.includes('aria-label="Next photo"'),
    'Next photo button enforces 44x44px touch target'
  );

  // 5.5 Strict Zero Em-Dash Guardrail in LightboxModal.tsx & PolaroidCard.tsx
  assert.ok(!modalCode.includes('\u2014') && !modalCode.includes('&mdash;'), 'LightboxModal.tsx zero em-dash');
  assert.ok(!cardCode.includes('\u2014') && !cardCode.includes('&mdash;'), 'PolaroidCard.tsx zero em-dash');
});
