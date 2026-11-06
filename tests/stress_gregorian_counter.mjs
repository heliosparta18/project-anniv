// Standalone Empirical Challenger Stress Test for Gregorian Date Arithmetic
// Target: src/hooks/useLiveCounter.ts
import {
  calculateGregorianDifference,
  calculateTimeDifference,
  getDaysInMonth,
  isLeapYear,
} from '../src/hooks/useLiveCounter.ts';

console.log('='.repeat(72));
console.log('  CHALLENGER GREGORIAN DATE ARITHMETIC EMPIRICAL STRESS TEST');
console.log('='.repeat(72));

let totalAssertions = 0;
let failedAssertions = [];

function check(condition, message, metadata = {}) {
  totalAssertions++;
  if (!condition) {
    failedAssertions.push({ message, metadata });
    console.error(`  ✖ FAIL: ${message}`);
  } else {
    // Passed
  }
}

// -----------------------------------------------------------------------------
// Suite 1: Leap-Year Edge Cases
// -----------------------------------------------------------------------------
console.log('\n[Suite 1] Testing leap-year edge cases & anniversaries...');

// 1.1: Leap day (Feb 29, 2024) to 1st anniversary in non-leap year (Feb 28, 2025)
const r1 = calculateGregorianDifference('2024-02-29T00:00:00', '2025-02-28T00:00:00');
check(r1.isValid, 'Feb 29 2024 -> Feb 28 2025: must be valid');
check(!r1.isFuture, 'Feb 29 2024 -> Feb 28 2025: isFuture must be false');
check(r1.years === 1, `Feb 29 2024 -> Feb 28 2025: expected years=1, got ${r1.years}`);
check(r1.months === 0, `Feb 29 2024 -> Feb 28 2025: expected months=0, got ${r1.months}`);
check(r1.days === 0, `Feb 29 2024 -> Feb 28 2025: expected days=0, got ${r1.days}`);
check(r1.totalDays === 365, `Feb 29 2024 -> Feb 28 2025: expected totalDays=365, got ${r1.totalDays}`);
console.log('  ✓ Feb 29, 2024 -> Feb 28, 2025: exactly 1 year (365 days)');

// 1.2: Leap day (Feb 29, 2024) to 4th anniversary in leap year (Feb 29, 2028)
const r2 = calculateGregorianDifference('2024-02-29T00:00:00', '2028-02-29T00:00:00');
check(r2.isValid, 'Feb 29 2024 -> Feb 29 2028: must be valid');
check(r2.years === 4, `Feb 29 2024 -> Feb 29 2028: expected years=4, got ${r2.years}`);
check(r2.months === 0, `Feb 29 2024 -> Feb 29 2028: expected months=0, got ${r2.months}`);
check(r2.days === 0, `Feb 29 2024 -> Feb 29 2028: expected days=0, got ${r2.days}`);
check(r2.totalDays === 1461, `Feb 29 2024 -> Feb 29 2028: expected totalDays=1461, got ${r2.totalDays}`);
console.log('  ✓ Feb 29, 2024 -> Feb 29, 2028: exactly 4 years (1461 days with 1 leap day)');

// 1.3: Leap day (Feb 29, 2024) to next day (March 1, 2024)
const r3 = calculateGregorianDifference('2024-02-29T00:00:00', '2024-03-01T00:00:00');
check(r3.years === 0 && r3.months === 0 && r3.days === 1, `Feb 29 -> March 1 2024: expected 1 day, got ${r3.days}`);
check(r3.totalDays === 1, `Feb 29 -> March 1 2024: expected totalDays=1, got ${r3.totalDays}`);
console.log('  ✓ Feb 29, 2024 -> March 1, 2024: exactly 1 day');

// 1.4: Leap day (Feb 29, 2024) to March 1, 2025 (1 year and 1 day)
const r4 = calculateGregorianDifference('2024-02-29T00:00:00', '2025-03-01T00:00:00');
check(r4.years === 1 && r4.months === 0 && r4.days === 1, `Feb 29 2024 -> March 1 2025: expected 1y 0m 1d, got ${r4.years}y ${r4.months}m ${r4.days}d`);
check(r4.totalDays === 366, `Feb 29 2024 -> March 1 2025: expected totalDays=366, got ${r4.totalDays}`);
console.log('  ✓ Feb 29, 2024 -> March 1, 2025: exactly 1 year and 1 day (366 days)');

// 1.5: Non-leap Feb 28, 2023 to leap Feb 29, 2024
const r5 = calculateGregorianDifference('2023-02-28T00:00:00', '2024-02-29T00:00:00');
check(r5.years === 1 && r5.months === 0 && r5.days === 1, `Feb 28 2023 -> Feb 29 2024: expected 1y 0m 1d, got ${r5.years}y ${r5.months}m ${r5.days}d`);
check(r5.totalDays === 366, `Feb 28 2023 -> Feb 29 2024: expected totalDays=366, got ${r5.totalDays}`);
console.log('  ✓ Feb 28, 2023 -> Feb 29, 2024: exactly 1 year and 1 day');

// 1.6: Century leap years rules (isLeapYear helper verification)
check(isLeapYear(2000) === true, '2000 is a leap year (divisible by 400)');
check(isLeapYear(2024) === true, '2024 is a leap year (divisible by 4)');
check(isLeapYear(2025) === false, '2025 is not a leap year');
check(isLeapYear(2100) === false, '2100 is not a leap year (divisible by 100, not 400)');
check(isLeapYear(1900) === false, '1900 is not a leap year (divisible by 100, not 400)');
check(getDaysInMonth(2024, 1) === 29, 'Feb 2024 has 29 days');
check(getDaysInMonth(2025, 1) === 28, 'Feb 2025 has 28 days');
check(getDaysInMonth(2100, 1) === 28, 'Feb 2100 has 28 days');
console.log('  ✓ Century leap-year rules and days-in-month verified');

// -----------------------------------------------------------------------------
// Suite 2: Month Rollbacks and Month-End Clamping
// -----------------------------------------------------------------------------
console.log('\n[Suite 2] Testing month rollbacks (Jan 31->Feb 28, Mar 31->Apr 30, May 31->Jun 30)...');

// 2.1: Jan 31 to Feb 28 in non-leap year (2023)
const m1 = calculateGregorianDifference('2023-01-31T00:00:00', '2023-02-28T00:00:00');
check(m1.years === 0 && m1.months === 1 && m1.days === 0, `Jan 31 2023 -> Feb 28 2023: expected 1m 0d, got ${m1.months}m ${m1.days}d`);
check(m1.totalDays === 28, `Jan 31 -> Feb 28: expected 28 days, got ${m1.totalDays}`);
console.log('  ✓ Jan 31 -> Feb 28 (2023, non-leap): exactly 1 month, 0 days (28 total days)');

// 2.2: Jan 31 to Feb 29 in leap year (2024)
const m2 = calculateGregorianDifference('2024-01-31T00:00:00', '2024-02-29T00:00:00');
check(m2.years === 0 && m2.months === 1 && m2.days === 0, `Jan 31 2024 -> Feb 29 2024: expected 1m 0d, got ${m2.months}m ${m2.days}d`);
check(m2.totalDays === 29, `Jan 31 -> Feb 29: expected 29 days, got ${m2.totalDays}`);
console.log('  ✓ Jan 31 -> Feb 29 (2024, leap): exactly 1 month, 0 days (29 total days)');

// 2.3: March 31 to April 30 (31-day month to 30-day month)
const m3 = calculateGregorianDifference('2024-03-31T00:00:00', '2024-04-30T00:00:00');
check(m3.years === 0 && m3.months === 1 && m3.days === 0, `Mar 31 -> Apr 30: expected 1m 0d, got ${m3.months}m ${m3.days}d`);
check(m3.totalDays === 30, `Mar 31 -> Apr 30: expected 30 days, got ${m3.totalDays}`);
console.log('  ✓ March 31 -> April 30: exactly 1 month, 0 days (30 total days)');

// 2.4: May 31 to June 30 (31-day month to 30-day month)
const m4 = calculateGregorianDifference('2024-05-31T00:00:00', '2024-06-30T00:00:00');
check(m4.years === 0 && m4.months === 1 && m4.days === 0, `May 31 -> Jun 30: expected 1m 0d, got ${m4.months}m ${m4.days}d`);
check(m4.totalDays === 30, `May 31 -> Jun 30: expected 30 days, got ${m4.totalDays}`);
console.log('  ✓ May 31 -> June 30: exactly 1 month, 0 days (30 total days)');

// 2.5: August 31 to September 30 (31-day month to 30-day month)
const m5 = calculateGregorianDifference('2024-08-31T00:00:00', '2024-09-30T00:00:00');
check(m5.years === 0 && m5.months === 1 && m5.days === 0, `Aug 31 -> Sep 30: expected 1m 0d, got ${m5.months}m ${m5.days}d`);
check(m5.totalDays === 30, `Aug 31 -> Sep 30: expected 30 days, got ${m5.totalDays}`);
console.log('  ✓ August 31 -> September 30: exactly 1 month, 0 days (30 total days)');

// 2.6: Month rollback 1 second before rollover
const mb1 = calculateGregorianDifference('2023-01-31T00:00:00', '2023-02-27T23:59:59');
check(mb1.months === 0 && mb1.days === 27, `Jan 31 -> Feb 27 23:59:59: expected 0m 27d, got ${mb1.months}m ${mb1.days}d`);
check(mb1.hours === 23 && mb1.minutes === 59 && mb1.seconds === 59, 'Intra-day rollback hours/min/sec');
console.log('  ✓ 1 second before Feb 28: 0m 27d 23h 59m 59s');

const mb2 = calculateGregorianDifference('2024-03-31T00:00:00', '2024-04-29T23:59:59');
check(mb2.months === 0 && mb2.days === 29, `Mar 31 -> Apr 29 23:59:59: expected 0m 29d, got ${mb2.months}m ${mb2.days}d`);
console.log('  ✓ 1 second before April 30: 0m 29d 23h 59m 59s');

// -----------------------------------------------------------------------------
// Suite 3: Adversarial Year-End / Month-End Sub-Day Rollover Edge Cases
// -----------------------------------------------------------------------------
console.log('\n[Suite 3] Testing month-end 31st dates approaching anniversary...');

const adversarialPairs = [
  { s: '2020-12-31T12:00:00', e: '2021-12-31T08:00:00', label: 'Dec 31 to Dec 31 (4h shy of 1 year)' },
  { s: '2022-12-31T12:00:00', e: '2023-12-31T08:00:00', label: 'Dec 31 to Dec 31 (non-leap)' },
  { s: '2023-01-31T12:00:00', e: '2024-01-31T08:00:00', label: 'Jan 31 to Jan 31 (leap destination)' },
  { s: '2023-08-31T12:00:00', e: '2024-08-31T08:00:00', label: 'Aug 31 to Aug 31' },
];

for (const ap of adversarialPairs) {
  const aRes = calculateGregorianDifference(ap.s, ap.e);
  // Days must never exceed 31
  check(aRes.days <= 31, `${ap.label}: days must be <= 31, but got ${aRes.days} (Summary: ${aRes.formattedSummary})`, { start: ap.s, end: ap.e, result: aRes });
}

// -----------------------------------------------------------------------------
// Suite 4: 1,500 Randomized Date Pairs Stress Harness
// -----------------------------------------------------------------------------
console.log('\n[Suite 4] Running 1,500 randomized date pairs stress test (1970 - 2060)...');

const MIN_EPOCH = new Date('1970-01-01T00:00:00Z').getTime();
const MAX_EPOCH = new Date('2060-01-01T00:00:00Z').getTime();

let seed = 123456789;
function pseudoRandom() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

const TOTAL_RANDOM_PAIRS = 1500;
let randPassCount = 0;

for (let i = 0; i < TOTAL_RANDOM_PAIRS; i++) {
  const epochA = MIN_EPOCH + Math.floor(pseudoRandom() * (MAX_EPOCH - MIN_EPOCH));
  const spanMs = Math.floor(pseudoRandom() * (86400000 * 365 * 15)); // up to 15 years span
  const epochB = epochA + spanMs;

  const startDate = new Date(epochA);
  const targetDate = new Date(epochB);

  const res = calculateGregorianDifference(startDate, targetDate);

  // Invariant 1: Valid & Not Future
  check(res.isValid === true, `Random #${i}: isValid must be true`);
  check(res.isFuture === false, `Random #${i}: isFuture must be false`);

  // Invariant 2: Non-negative breakdown & correct bounds
  check(res.years >= 0, `Random #${i}: years >= 0`);
  check(res.months >= 0 && res.months <= 11, `Random #${i}: months in [0, 11] (got ${res.months})`);
  check(res.days >= 0 && res.days <= 31, `Random #${i}: days in [0, 31] (got ${res.days})`, { start: startDate.toISOString(), end: targetDate.toISOString(), res });
  check(res.hours >= 0 && res.hours <= 23, `Random #${i}: hours in [0, 23] (got ${res.hours})`);
  check(res.minutes >= 0 && res.minutes <= 59, `Random #${i}: minutes in [0, 59] (got ${res.minutes})`);
  check(res.seconds >= 0 && res.seconds <= 59, `Random #${i}: seconds in [0, 59] (got ${res.seconds})`);

  // Invariant 3: Aggregate totals
  const expectedTotalSeconds = Math.floor(spanMs / 1000);
  const expectedTotalDays = Math.floor(spanMs / 86400000);
  check(res.totalSeconds === expectedTotalSeconds, `Random #${i}: totalSeconds match`);
  check(res.totalDays === expectedTotalDays, `Random #${i}: totalDays match`);

  // Invariant 4: Milestone progress
  check(res.milestoneProgress >= 0 && res.milestoneProgress <= 100, `Random #${i}: milestoneProgress in [0, 100]`);

  // Invariant 5: Units object contract alignment
  check(res.units.years === res.years, `Random #${i}: units.years matches`);
  check(res.units.months === res.months, `Random #${i}: units.months matches`);
  check(res.units.days === res.days, `Random #${i}: units.days matches`);
  check(res.units.hours === res.hours, `Random #${i}: units.hours matches`);
  check(res.units.minutes === res.minutes, `Random #${i}: units.minutes matches`);
  check(res.units.seconds === res.seconds, `Random #${i}: units.seconds matches`);

  randPassCount++;
}
console.log(`  ✓ Evaluated ${randPassCount} randomized date pairs`);

// -----------------------------------------------------------------------------
// Suite 5: Future Dates Countdown Mode
// -----------------------------------------------------------------------------
console.log('\n[Suite 5] Testing future dates (targetDate < startDate)...');

const futureTestCases = [
  { start: '2030-01-01T00:00:00', end: '2025-01-01T00:00:00', desc: '5 years in future' },
  { start: '2026-05-04T12:00:00', end: '2026-05-04T11:59:59', desc: '1 second in future' },
  { start: '2050-12-31T23:59:59', end: '2020-01-01T00:00:00', desc: '30 years in future' },
];

for (const tc of futureTestCases) {
  const fRes = calculateGregorianDifference(tc.start, tc.end);
  check(fRes.isValid === true, `${tc.desc}: isValid must be true`);
  check(fRes.isFuture === true, `${tc.desc}: isFuture must be true`);
  check(fRes.years === 0 && fRes.months === 0 && fRes.days === 0, `${tc.desc}: units must be non-negative zero`);
  check(fRes.hours === 0 && fRes.minutes === 0 && fRes.seconds === 0, `${tc.desc}: hours/min/sec must be 0`);
  check(fRes.totalDays === 0 && fRes.totalSeconds === 0, `${tc.desc}: totalDays and totalSeconds must be 0`);
  check(fRes.formattedElapsed === 'Hari yang dinanti segera tiba', `${tc.desc}: romantic future message displayed`);
  console.log(`  ✓ ${tc.desc}: isFuture: true, zeroed breakdown, romantic fallback message`);
}

// -----------------------------------------------------------------------------
// Suite 6: Empty, Malformed, and Adversarial Inputs (No-Crash Fallback)
// -----------------------------------------------------------------------------
console.log('\n[Suite 6] Testing empty, malformed, null, and adversarial inputs...');

const invalidInputs = [
  { input: '', desc: 'Empty string' },
  { input: '   ', desc: 'Whitespace string' },
  { input: null, desc: 'Null value' },
  { input: undefined, desc: 'Undefined value' },
  { input: 'not-a-valid-date', desc: 'Malformed non-date text' },
  { input: '2024-99-99', desc: 'Impossible date format' },
  { input: 'invalid-iso-T25:99:99', desc: 'Invalid time components' },
  { input: NaN, desc: 'NaN numeric value' },
  { input: new Date('invalid'), desc: 'Invalid Date instance' },
];

for (const tc of invalidInputs) {
  try {
    const invRes = calculateGregorianDifference(tc.input);
    check(invRes.isValid === false, `${tc.desc}: isValid must be false`);
    check(invRes.isFuture === false, `${tc.desc}: isFuture must be false`);
    check(invRes.years === 0 && invRes.months === 0 && invRes.days === 0, `${tc.desc}: units must be zero`);
    check(invRes.totalDays === 0 && invRes.totalSeconds === 0, `${tc.desc}: totals must be zero`);
    check(typeof invRes.formattedElapsed === 'string', `${tc.desc}: formattedElapsed must be string`);
    check(typeof invRes.formattedSummary === 'string', `${tc.desc}: formattedSummary must be string`);
    console.log(`  ✓ [${tc.desc}]: gracefully caught with isValid: false`);
  } catch (err) {
    failedAssertions.push({ message: `Fatal exception thrown for "${tc.desc}": ${err.message}` });
  }
}

// Alias contract check
check(calculateTimeDifference === calculateGregorianDifference, 'calculateTimeDifference must be strict alias of calculateGregorianDifference');

console.log('\n' + '='.repeat(72));
if (failedAssertions.length === 0) {
  console.log(`  CHALLENGER GREGORIAN STRESS TEST PASSED: ${totalAssertions} assertions satisfied!`);
  console.log('='.repeat(72));
} else {
  console.error(`  CHALLENGER GREGORIAN STRESS TEST FAILED!`);
  console.error(`  Total assertions evaluated: ${totalAssertions}`);
  console.error(`  Violations detected: ${failedAssertions.length}`);
  console.error('='.repeat(72));
  for (const fa of failedAssertions) {
    console.error(`  ✖ ${fa.message}`);
  }
  console.error('='.repeat(72));
  process.exit(1);
}
