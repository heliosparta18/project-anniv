// Challenger M2 Remediation Deep Adversarial Audit Harness
// Target: src/hooks/useLiveCounter.ts, src/utils/audioSynth.ts, src/components/hero/LiveCounter.tsx, src/components/audio/VinylPlayer.tsx

import fs from 'node:fs';
import path from 'node:path';
import { setupTestEnvironment } from './helpers/dom_mock.js';
import {
  calculateGregorianDifference,
  isLeapYear,
} from '../src/hooks/useLiveCounter.ts';
import {
  RomanticAudioSynth,
} from '../src/utils/audioSynth.ts';

console.log('='.repeat(78));
console.log('  CHALLENGER M2 REMEDIATION DEEP ADVERSARIAL AUDIT');
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
  }
}

// =============================================================================
// SECTION 1: EXHAUSTIVE 4-YEAR LEAP-CYCLE DATE ARITHMETIC AUDIT
// =============================================================================
console.log('\n[Section 1] Exhaustive 4-Year Leap-Cycle Traversal (1,461 days x 10 offsets)...');

// Leap year 2024 base date
const baseDate = new Date(Date.UTC(2024, 0, 1, 12, 0, 0)); // 2024-01-01 12:00:00 UTC

// Test offsets: 1d, 27d, 28d, 29d, 30d, 31d, 1m shy of 1y, 1s shy of 1y, 1y, 4y
const offsetsDays = [1, 27, 28, 29, 30, 31, 364, 365, 366, 1461];

for (let d = 0; d < 1461; d++) {
  const currentStart = new Date(baseDate.getTime() + d * 86400000);
  const startIso = currentStart.toISOString();

  for (const offset of offsetsDays) {
    const currentEnd = new Date(currentStart.getTime() + offset * 86400000);
    const endIso = currentEnd.toISOString();

    const res = calculateGregorianDifference(currentStart, currentEnd);

    check(res.isValid === true, `Valid for ${startIso} -> ${endIso}`);
    check(res.isFuture === false, `Not future for ${startIso} -> ${endIso}`);
    check(res.years >= 0, `Years non-negative for ${startIso} -> ${endIso}`);
    check(res.months >= 0 && res.months <= 11, `Months in [0,11] (got ${res.months}) for ${startIso} -> ${endIso}`);
    check(res.days >= 0 && res.days <= 31, `Days in [0,31] (got ${res.days}) for ${startIso} -> ${endIso}`, {
      start: startIso,
      end: endIso,
      res,
    });
    check(res.hours >= 0 && res.hours <= 23, `Hours in [0,23] for ${startIso} -> ${endIso}`);
    check(res.minutes >= 0 && res.minutes <= 59, `Minutes in [0,59] for ${startIso} -> ${endIso}`);
    check(res.seconds >= 0 && res.seconds <= 59, `Seconds in [0,59] for ${startIso} -> ${endIso}`);
    check(res.totalDays === offset, `totalDays matches offset ${offset} (got ${res.totalDays}) for ${startIso} -> ${endIso}`);
    check(res.milestoneProgress >= 0 && res.milestoneProgress <= 100, `Progress in [0,100] for ${startIso} -> ${endIso}`);
  }
}
console.log(`  ✓ Successfully audited 1,461 calendar days across 10 distinct offset vectors (14,610 intervals)`);

// =============================================================================
// SECTION 2: ADVERSARIAL GREGORIAN EDGE CASES & SUB-SECOND / SUB-DAY ROLLOVERS
// =============================================================================
console.log('\n[Section 2] Sub-second, sub-minute, and century edge cases...');

// 2.1: Exactly 1 millisecond elapsed
const rMs1 = calculateGregorianDifference('2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.001Z');
check(rMs1.isValid && !rMs1.isFuture, '1ms elapsed is valid');
check(rMs1.years === 0 && rMs1.months === 0 && rMs1.days === 0, '1ms elapsed: years/months/days are 0');
check(rMs1.hours === 0 && rMs1.minutes === 0 && rMs1.seconds === 0, '1ms elapsed: h/m/s are 0');
check(rMs1.totalSeconds === 0, '1ms elapsed: totalSeconds = 0');

// 2.2: Exactly 999 milliseconds elapsed
const rMs999 = calculateGregorianDifference('2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.999Z');
check(rMs999.seconds === 0 && rMs999.totalSeconds === 0, '999ms elapsed is truncated to 0s');

// 2.3: Exactly 1000 milliseconds elapsed
const rMs1000 = calculateGregorianDifference('2024-01-01T00:00:00.000Z', '2024-01-01T00:00:01.000Z');
check(rMs1000.seconds === 1 && rMs1000.totalSeconds === 1, '1000ms elapsed is 1s');

// 2.4: 1 millisecond into future
const rFutMs = calculateGregorianDifference('2024-01-01T00:00:00.001Z', '2024-01-01T00:00:00.000Z');
check(rFutMs.isValid && rFutMs.isFuture, '1ms into future isFuture: true');

// 2.5: Century rules (year 2000 vs 1900 vs 2100 vs 2400)
check(isLeapYear(2000) === true, 'Year 2000 is leap year');
check(isLeapYear(1900) === false, 'Year 1900 is not leap year');
check(isLeapYear(2100) === false, 'Year 2100 is not leap year');
check(isLeapYear(2400) === true, 'Year 2400 is leap year');

// 2.6: Dec 31 to Jan 1 across year boundary (1 second)
const rDecToJan = calculateGregorianDifference('2023-12-31T23:59:59Z', '2024-01-01T00:00:00Z');
check(rDecToJan.years === 0 && rDecToJan.months === 0 && rDecToJan.days === 0, 'Dec 31 23:59:59 to Jan 1 00:00:00: 0y 0m 0d');
check(rDecToJan.hours === 0 && rDecToJan.minutes === 0 && rDecToJan.seconds === 1, 'Dec 31 to Jan 1: 1 second');
check(rDecToJan.totalSeconds === 1, 'Dec 31 to Jan 1: totalSeconds = 1');

// 2.7: Exactly 100 years anniversary
const r100y = calculateGregorianDifference('2000-01-01T00:00:00Z', '2100-01-01T00:00:00Z');
check(r100y.years === 100 && r100y.months === 0 && r100y.days === 0, `100 years: expected 100y 0m 0d, got ${r100y.years}y ${r100y.months}m ${r100y.days}d`);
check(r100y.hours === 0 && r100y.minutes === 0 && r100y.seconds === 0, '100 years: 0h 0m 0s');

console.log('  ✓ Sub-second, sub-minute, and century edge cases satisfied');

// =============================================================================
// SECTION 3: AUDIO SYNTHESIZER CONCURRENCY, IDEMPOTENCY & VOLUME CLAMPING
// =============================================================================
console.log('\n[Section 3] Audio Synthesizer Concurrency & Volume Stress Test...');

setupTestEnvironment();
const testSynth = new RomanticAudioSynth();

// 3.1: 50 Concurrent start() invocations (race condition stress)
const startPromises = [];
for (let i = 0; i < 50; i++) {
  startPromises.push(testSynth.start());
}
const startResults = await Promise.all(startPromises);
check(startResults.every((r) => r === true), 'All 50 concurrent start() invocations resolved true');
check(testSynth.getIsPlaying() === true, 'Synth is playing');
check(testSynth.activeVoices.length === 5, `Expected strictly 5 active voices under 50 concurrent starts, got ${testSynth.activeVoices.length}`);
console.log('  ✓ 50 concurrent start() calls safely coalesced into strictly 5 active voices');

// 3.2: Calling start() while already playing (idempotency)
for (let i = 0; i < 10; i++) {
  await testSynth.start();
  check(testSynth.activeVoices.length === 5, `Voice count remains 5 after repeat start #${i}`);
}

// 3.3: Rapid start() / stop() cycling (100 cycles)
for (let i = 0; i < 100; i++) {
  testSynth.stop();
  check(testSynth.getIsPlaying() === false, `Cycle #${i}: isPlaying is false after stop`);
  check(testSynth.activeVoices.length === 0, `Cycle #${i}: activeVoices is 0 after stop`);
  await testSynth.start();
  check(testSynth.getIsPlaying() === true, `Cycle #${i}: isPlaying is true after start`);
  check(testSynth.activeVoices.length === 5, `Cycle #${i}: activeVoices is 5 after start`);
}
testSynth.stop();
check(testSynth.activeVoices.length === 0, 'activeVoices clean after rapid cycling');
console.log('  ✓ 100 rapid start/stop cycles completed with zero voice leakage');

// 3.4: Adversarial volume inputs (fuzzing setVolume)
const fuzzVolumes = [
  { input: NaN, expected: 0.7, desc: 'NaN preserves existing volume' },
  { input: null, expected: 0.7, desc: 'null ignored' },
  { input: undefined, expected: 0.7, desc: 'undefined ignored' },
  { input: '0.9', expected: 0.7, desc: 'string ignored' },
  { input: {}, expected: 0.7, desc: 'object ignored' },
  { input: [0.5], expected: 0.7, desc: 'array ignored' },
  { input: -0.5, expected: 0, desc: '-0.5 clamped to 0' },
  { input: -1e9, expected: 0, desc: '-1e9 clamped to 0' },
  { input: -Infinity, expected: 0, desc: '-Infinity clamped to 0' },
  { input: 1.5, expected: 1, desc: '1.5 clamped to 1' },
  { input: 1e9, expected: 1, desc: '1e9 clamped to 1' },
  { input: Infinity, expected: 1, desc: 'Infinity clamped to 1' },
  { input: 0.35, expected: 0.35, desc: '0.35 set directly' },
];

testSynth.setVolume(0.7);
for (const tc of fuzzVolumes) {
  testSynth.setVolume(tc.input);
  const curVol = testSynth.getVolume();
  check(
    !Number.isNaN(curVol) && Math.abs(curVol - tc.expected) < 0.001,
    `Volume fuzz [${tc.desc}]: expected ${tc.expected}, got ${curVol}`
  );
}
console.log('  ✓ All 13 adversarial volume inputs clamped/handled safely without NaN propagation');

// =============================================================================
// SECTION 4: ACCESSIBILITY & COPYWRITING INVARIANT AUDIT
// =============================================================================
console.log('\n[Section 4] Accessibility & Copywriting Invariant Audits...');

// 4.1: LiveCounter.tsx must have aria-live="off"
const liveCounterContent = fs.readFileSync(
  path.resolve('src/components/hero/LiveCounter.tsx'),
  'utf-8'
);
check(
  liveCounterContent.includes('aria-live="off"'),
  'LiveCounter.tsx explicitly specifies aria-live="off" to prevent speech flooding'
);
check(
  !liveCounterContent.includes('aria-live="polite"'),
  'LiveCounter.tsx does NOT contain aria-live="polite"'
);
check(
  !liveCounterContent.includes('aria-live="assertive"'),
  'LiveCounter.tsx does NOT contain aria-live="assertive"'
);

// 4.2: VinylPlayer.tsx touch target heights & no em-dashes
const vinylPlayerContent = fs.readFileSync(
  path.resolve('src/components/audio/VinylPlayer.tsx'),
  'utf-8'
);
check(
  vinylPlayerContent.includes('h-11 py-[18px] bg-anniv-peach bg-clip-content'),
  'VinylPlayer scrubber slider has 44px (h-11) touch target'
);
check(
  vinylPlayerContent.includes('h-11 py-[19px] bg-anniv-peach bg-clip-content'),
  'VinylPlayer volume slider has 44px (h-11) touch target'
);
check(
  !vinylPlayerContent.includes('&mdash;'),
  'VinylPlayer does not contain HTML entity &mdash;'
);
check(
  !vinylPlayerContent.includes('\u2014'),
  'VinylPlayer does not contain unicode em-dash (—)'
);
check(
  vinylPlayerContent.includes('~ Rama for Alya 💕'),
  'VinylPlayer uses casual handwritten tilde "~ Rama for Alya 💕"'
);

// 4.3: Full src/ sweep for em-dash violations
const srcDir = path.resolve('src');
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx?|jsx?|html|css)$/.test(ent.name)) {
      const code = fs.readFileSync(fullPath, 'utf-8');
      check(!code.includes('&mdash;'), `No &mdash; in ${path.relative(process.cwd(), fullPath)}`);
      check(!code.includes('\u2014'), `No unicode em-dash in ${path.relative(process.cwd(), fullPath)}`);
    }
  }
}
scanDir(srcDir);
console.log('  ✓ Accessibility aria-live="off", touch targets 44px, and 0 em-dash violations confirmed across all source files');

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n' + '='.repeat(78));
console.log(`  CHALLENGER DEEP AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('='.repeat(78));

if (failCount > 0) {
  console.error('\nFAILURES RECORDED:');
  for (const f of failures) {
    console.error(`  ✖ ${f.desc}`, f.meta);
  }
  process.exit(1);
} else {
  console.log('\n>>> EMPIRICAL VERDICT: ALL CHALLENGES PASSED (VERDICT: APPROVE) <<<');
  process.exit(0);
}
