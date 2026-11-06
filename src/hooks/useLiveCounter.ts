/**
 * useLiveCounter Custom Hook & Gregorian Calendar Math Utilities
 * Feature 6: Live Anniversary Gregorian Counter
 *
 * Provides exact calendar delta calculations (years, months, days, hours, minutes, seconds)
 * accounting for leap years, 28-31 day months, month-end rollbacks, and clean 1-second interval ticking.
 */

import { useState, useEffect } from 'react';

export interface TimeUnits {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface LiveCounterResult {
  units: TimeUnits;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalSeconds: number;
  formattedElapsed: string;
  formattedSummary: string;
  milestoneProgress: number;
  isValid: boolean;
  isFuture: boolean;
}

/**
 * Returns number of days in a given Gregorian month (0-indexed month: 0=Jan, 1=Feb, etc.)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Checks whether a given year is a Gregorian leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Adds full calendar years to a date, clamping the day to the maximum days
 * in the destination month (handles Feb 29 -> Feb 28 in non-leap years).
 */
export function addYearsClamped(date: Date, years: number): Date {
  const d = new Date(date.getTime());
  const origDay = date.getDate();
  const origMonth = date.getMonth();
  d.setDate(1);
  d.setFullYear(date.getFullYear() + years);
  d.setMonth(origMonth);
  const maxDay = getDaysInMonth(d.getFullYear(), origMonth);
  d.setDate(Math.min(origDay, maxDay));
  return d;
}

/**
 * Adds full calendar months to a date, clamping the day to the maximum days
 * in the destination month (e.g. Jan 31 + 1 month -> Feb 28 or 29).
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const origDay = date.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const maxDay = getDaysInMonth(d.getFullYear(), d.getMonth());
  d.setDate(Math.min(origDay, maxDay));
  return d;
}

/**
 * Creates a safe fallback return object when inputs are invalid or empty.
 */
function createFallbackResult(isValid: boolean, isFuture = false): LiveCounterResult {
  return {
    units: { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 },
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 0,
    totalSeconds: 0,
    formattedElapsed: isFuture ? 'Hari yang dinanti segera tiba' : '0 hari bersama',
    formattedSummary: '0y 0m 0d 00:00:00',
    milestoneProgress: 0,
    isValid,
    isFuture,
  };
}

/**
 * Pure calculation engine: computes Gregorian calendar delta between start and target timestamp.
 */
export function calculateGregorianDifference(
  startDate: string | Date | undefined | null,
  targetDate: string | Date | number = new Date()
): LiveCounterResult {
  if (!startDate || (typeof startDate === 'string' && startDate.trim() === '')) {
    return createFallbackResult(false);
  }

  const start = new Date(startDate);
  const end = new Date(targetDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return createFallbackResult(false);
  }

  const isFuture = end.getTime() < start.getTime();
  if (isFuture) {
    return createFallbackResult(true, true);
  }

  const totalElapsedMs = end.getTime() - start.getTime();
  const totalSeconds = Math.floor(totalElapsedMs / 1000);
  const totalDays = Math.floor(totalElapsedMs / (1000 * 60 * 60 * 24));

  // Determine full calendar years with leap-year clamping
  let years = end.getFullYear() - start.getFullYear();
  let candidate = addYearsClamped(start, years);
  if (candidate.getTime() > end.getTime()) {
    years--;
    candidate = addYearsClamped(start, years);
  }

  // Anchor candidate after years calculation so month additions preserve original anniversary day
  const yearAnchor = candidate;

  // Determine full calendar months (capped at 11) using yearAnchor
  let months = 0;
  while (months < 11) {
    const nextMonth = addMonthsClamped(yearAnchor, months + 1);
    if (nextMonth.getTime() <= end.getTime()) {
      candidate = nextMonth;
      months++;
    } else {
      break;
    }
  }

  // Remaining time in milliseconds broken into days, hours, minutes, seconds
  let remMs = end.getTime() - candidate.getTime();
  const days = Math.floor(remMs / (1000 * 60 * 60 * 24));
  remMs %= (1000 * 60 * 60 * 24);

  const hours = Math.floor(remMs / (1000 * 60 * 60));
  remMs %= (1000 * 60 * 60);

  const minutes = Math.floor(remMs / (1000 * 60));
  remMs %= (1000 * 60);

  const seconds = Math.floor(remMs / 1000);

  const formattedElapsed = `${totalDays} hari bersama`;
  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedSummary = `${years}y ${months}m ${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  // Milestone calculation: percentage progress towards next annual anniversary
  const nextAnnivDate = addYearsClamped(start, years + 1);
  const lastAnnivDate = addYearsClamped(start, years);
  const yearSpanMs = nextAnnivDate.getTime() - lastAnnivDate.getTime();
  const elapsedSinceLastAnnivMs = end.getTime() - lastAnnivDate.getTime();
  const milestoneProgress = Math.min(
    100,
    Math.max(0, Math.round((elapsedSinceLastAnnivMs / yearSpanMs) * 100))
  );

  const units: TimeUnits = {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
  };

  return {
    units,
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalSeconds,
    formattedElapsed,
    formattedSummary,
    milestoneProgress,
    isValid: true,
    isFuture: false,
  };
}

/**
 * Interoperability alias
 */
export const calculateTimeDifference = calculateGregorianDifference;

/**
 * useLiveCounter React Hook
 * Ticks every 1,000ms with clean unmount cleanup via clearInterval.
 */
export function useLiveCounter(startDate: string | Date | undefined | null): LiveCounterResult {
  const [difference, setDifference] = useState<LiveCounterResult>(() =>
    calculateGregorianDifference(startDate)
  );

  useEffect(() => {
    if (!startDate) return;

    const intervalId = setInterval(() => {
      setDifference(calculateGregorianDifference(startDate));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startDate]);

  return difference;
}

export default useLiveCounter;
