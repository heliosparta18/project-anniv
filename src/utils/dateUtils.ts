/**
 * Gregorian Calendar Date Math Utilities
 * Re-exports calendar math primitives and types from useLiveCounter hook
 */

export {
  getDaysInMonth,
  isLeapYear,
  addYearsClamped,
  addMonthsClamped,
  calculateGregorianDifference,
  calculateTimeDifference,
  useLiveCounter,
} from '../hooks/useLiveCounter.ts';

export type { TimeUnits, LiveCounterResult } from '../hooks/useLiveCounter.ts';
