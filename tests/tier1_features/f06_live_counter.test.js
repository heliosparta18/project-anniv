import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateGregorianDifference,
  calculateTimeDifference,
  useLiveCounter,
  getDaysInMonth,
  isLeapYear,
} from '../../src/hooks/useLiveCounter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hookPath = path.resolve(__dirname, '../../src/hooks/useLiveCounter.ts');
const liveCounterComponentPath = path.resolve(__dirname, '../../src/components/hero/LiveCounter.tsx');

test('Feature 6 - Live Gregorian Counter: Basic Elapsed Calculation', () => {
  // 1. Export invariants
  assert.strictEqual(typeof calculateGregorianDifference, 'function', 'calculateGregorianDifference must be exported');
  assert.strictEqual(typeof calculateTimeDifference, 'function', 'calculateTimeDifference alias must be exported');
  assert.strictEqual(typeof useLiveCounter, 'function', 'useLiveCounter hook must be exported');

  // 2. Exactly 1 year elapsed calculation
  const startIso = '2025-05-04T00:00:00';
  const oneYearLater = '2026-05-04T00:00:00';
  const result1Y = calculateGregorianDifference(startIso, oneYearLater);

  assert.strictEqual(result1Y.isValid, true, 'Result should be valid');
  assert.strictEqual(result1Y.isFuture, false, 'Result should not be future');
  assert.strictEqual(result1Y.years, 1, 'Years elapsed should be 1');
  assert.strictEqual(result1Y.months, 0, 'Months elapsed should be 0');
  assert.strictEqual(result1Y.days, 0, 'Days elapsed should be 0');
  assert.strictEqual(result1Y.hours, 0, 'Hours elapsed should be 0');
  assert.strictEqual(result1Y.minutes, 0, 'Minutes elapsed should be 0');
  assert.strictEqual(result1Y.seconds, 0, 'Seconds elapsed should be 0');
  assert.strictEqual(result1Y.totalDays, 365, 'Total days for 2025-2026 non-leap year should be 365');
  assert.ok(result1Y.formattedElapsed.includes('365'), 'Formatted string should mention 365 days');

  // 3. Exactly 6 months elapsed calculation
  const sixMonthsLater = '2025-11-04T00:00:00';
  const result6M = calculateGregorianDifference(startIso, sixMonthsLater);
  assert.strictEqual(result6M.years, 0, 'Years should be 0');
  assert.strictEqual(result6M.months, 6, 'Months should be 6');
  assert.strictEqual(result6M.days, 0, 'Days should be 0');
  assert.strictEqual(result6M.totalDays, 184, 'Total elapsed days from May 4 to Nov 4 is 184');
  assert.strictEqual(result6M.milestoneProgress, 50, 'Progress towards 1-year milestone should be 50%');

  // 4. Exact intra-day hours, minutes, and seconds breakdown
  const targetWithTime = '2025-05-05T14:30:45';
  const resultTime = calculateGregorianDifference(startIso, targetWithTime);
  assert.strictEqual(resultTime.days, 1, 'Days should be 1');
  assert.strictEqual(resultTime.hours, 14, 'Hours should be 14');
  assert.strictEqual(resultTime.minutes, 30, 'Minutes should be 30');
  assert.strictEqual(resultTime.seconds, 45, 'Seconds should be 45');

  // 5. Units sub-object contract validation
  assert.deepStrictEqual(resultTime.units, {
    years: 0,
    months: 0,
    days: 1,
    hours: 14,
    minutes: 30,
    seconds: 45
  }, 'units property must match top-level time units');
});

test('Feature 6 - Live Gregorian Counter: Gregorian Month-End Rollback', () => {
  // 1. Month-end rollback: 1 second before 1 full year
  const startIso = '2025-05-04T00:00:00';
  const oneSecondBeforeYear = '2026-05-03T23:59:59';
  const rollbackResult = calculateGregorianDifference(startIso, oneSecondBeforeYear);
  assert.strictEqual(rollbackResult.years, 0, 'Should not yet reach 1 full year');
  assert.strictEqual(rollbackResult.months, 11, 'Should be 11 months');
  assert.strictEqual(rollbackResult.days, 29, 'Should borrow April (30 days) - 1 = 29 days');
  assert.strictEqual(rollbackResult.hours, 23);
  assert.strictEqual(rollbackResult.minutes, 59);
  assert.strictEqual(rollbackResult.seconds, 59);
  assert.strictEqual(rollbackResult.totalDays, 364);

  // 2. Non-leap year February rollover (28 days in Feb 2023)
  const nonLeapStart = '2023-01-31T00:00:00';
  const nonLeapFebEnd = '2023-02-28T00:00:00';
  const nonLeapResult = calculateGregorianDifference(nonLeapStart, nonLeapFebEnd);
  assert.strictEqual(nonLeapResult.months, 1, 'Jan 31 to Feb 28 in non-leap year is exactly 1 month');
  assert.strictEqual(nonLeapResult.days, 0, 'Days should be 0');
  assert.strictEqual(nonLeapResult.totalDays, 28);

  // 3. Leap year February rollover (29 days in Feb 2024)
  const leapStart = '2024-01-31T00:00:00';
  const leapFebEnd = '2024-02-29T00:00:00';
  const leapResult = calculateGregorianDifference(leapStart, leapFebEnd);
  assert.strictEqual(leapResult.months, 1, 'Jan 31 to Feb 29 in leap year is exactly 1 month');
  assert.strictEqual(leapResult.days, 0, 'Days should be 0');
  assert.strictEqual(leapResult.totalDays, 29);

  // 4. Leap day anniversary (Feb 29, 2024) to non-leap anniversary (Feb 28, 2025)
  const leapDayAnniv = '2024-02-29T00:00:00';
  const nextNonLeapAnniv = '2025-02-28T00:00:00';
  const leapAnnivResult = calculateGregorianDifference(leapDayAnniv, nextNonLeapAnniv);
  assert.strictEqual(leapAnnivResult.years, 1, 'Feb 29 to Feb 28 next non-leap year counts as 1st anniversary');
  assert.strictEqual(leapAnnivResult.months, 0);
  assert.strictEqual(leapAnnivResult.days, 0);
  assert.strictEqual(leapAnnivResult.totalDays, 365);

  // 5. 30-day month (April) vs 31-day month (May) rollover
  const aprStart = '2025-04-15T00:00:00';
  const may14 = '2025-05-14T00:00:00';
  const aprMayResult = calculateGregorianDifference(aprStart, may14);
  assert.strictEqual(aprMayResult.months, 0);
  assert.strictEqual(aprMayResult.days, 29, 'April has 30 days, so Apr 15 to May 14 is 29 days');

  const may15 = '2025-05-15T00:00:00';
  const fullMonthResult = calculateGregorianDifference(aprStart, may15);
  assert.strictEqual(fullMonthResult.months, 1);
  assert.strictEqual(fullMonthResult.days, 0);

  // 6. Helper calendar primitives
  assert.strictEqual(isLeapYear(2024), true, '2024 is a leap year');
  assert.strictEqual(isLeapYear(2025), false, '2025 is not a leap year');
  assert.strictEqual(isLeapYear(2000), true, '2000 is a leap year (divisible by 400)');
  assert.strictEqual(isLeapYear(1900), false, '1900 is not a leap year (divisible by 100)');
  assert.strictEqual(getDaysInMonth(2024, 1), 29, 'Feb 2024 has 29 days');
  assert.strictEqual(getDaysInMonth(2025, 1), 28, 'Feb 2025 has 28 days');
});

test('Feature 6 - Live Gregorian Counter: Ticking Seconds Increment', () => {
  const startIso = '2025-05-04T00:00:00';

  // 1. Monotonic ticking math at 1-second intervals
  const t58 = '2025-05-04T00:00:58';
  const t59 = '2025-05-04T00:00:59';
  const t60 = '2025-05-04T00:01:00';

  const r58 = calculateGregorianDifference(startIso, t58);
  const r59 = calculateGregorianDifference(startIso, t59);
  const r60 = calculateGregorianDifference(startIso, t60);

  assert.strictEqual(r58.seconds, 58);
  assert.strictEqual(r58.minutes, 0);
  assert.strictEqual(r59.seconds, 59);
  assert.strictEqual(r59.minutes, 0);
  assert.strictEqual(r60.seconds, 0, 'Second 60 should roll over to second 0');
  assert.strictEqual(r60.minutes, 1, 'Minutes should increment to 1');

  // 2. Source inspection of useLiveCounter hook implementation
  assert.ok(fs.existsSync(hookPath), 'useLiveCounter.ts must exist');
  const hookSource = fs.readFileSync(hookPath, 'utf8');

  assert.ok(hookSource.includes('useState'), 'Hook must use useState');
  assert.ok(hookSource.includes('useEffect'), 'Hook must use useEffect for subscription');
  assert.ok(
    hookSource.includes('setInterval') && hookSource.includes('1000'),
    'Hook must schedule updates every 1000ms using setInterval'
  );
  assert.ok(
    hookSource.includes('clearInterval'),
    'Hook must cleanly invoke clearInterval on component unmount'
  );
  assert.ok(
    hookSource.includes('[startDate]'),
    'Hook useEffect must declare [startDate] as dependency'
  );

  // 3. Robustness guards: invalid and future inputs handling
  const invalidResult = calculateGregorianDifference('');
  assert.strictEqual(invalidResult.isValid, false, 'Empty date should produce isValid: false');
  assert.strictEqual(invalidResult.years, 0);

  const malformedResult = calculateGregorianDifference('not-a-valid-date');
  assert.strictEqual(malformedResult.isValid, false, 'Malformed date should produce isValid: false');

  const futureResult = calculateGregorianDifference('2099-01-01T00:00:00', '2025-01-01T00:00:00');
  assert.strictEqual(futureResult.isFuture, true, 'Future date should have isFuture: true');
  assert.strictEqual(futureResult.years, 0, 'Future countdown should not output negative years');
});

test('Feature 6 - Live Gregorian Counter: 6-Unit Metric Grid Layout', () => {
  assert.ok(fs.existsSync(liveCounterComponentPath), 'LiveCounter.tsx component must exist in src/components/hero/');
  const code = fs.readFileSync(liveCounterComponentPath, 'utf8');

  assert.ok(
    code.includes('useLiveCounter'),
    'LiveCounter.tsx must consume useLiveCounter custom hook'
  );

  const requiredLabels = ['Tahun', 'Bulan', 'Hari', 'Jam', 'Menit', 'Detik'];
  for (const label of requiredLabels) {
    assert.ok(
      code.includes(label),
      `LiveCounter.tsx must present the "${label}" time unit metric`
    );
  }

  assert.ok(
    code.includes('grid-cols-3') && code.includes('grid-cols-6'),
    'LiveCounter.tsx must provide responsive grid (grid-cols-3 on mobile reflowing to grid-cols-6 on desktop)'
  );

  assert.ok(
    code.includes('anniv-wine') || code.includes('anniv-rose') || code.includes('anniv-blush'),
    'LiveCounter.tsx must use warm feminine design system tokens'
  );

  assert.ok(
    code.includes('tabular-nums'),
    'LiveCounter.tsx numbers must use tabular-nums to prevent visual jitter on second updates'
  );

  assert.ok(
    code.includes('milestoneProgress') || code.includes('formattedElapsed') || code.includes('totalDays'),
    'LiveCounter.tsx must render milestone progress or total days elapsed badge'
  );
});
