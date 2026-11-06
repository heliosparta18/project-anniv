/**
 * Utility functions and configuration for Feature 12: Reasons Deck
 * WCAG AA compliant color palettes and safe storage helpers.
 */

import type { LoveReason } from '../../types/anniversary';

export const REASONS_STORAGE_KEY = 'anniversary_reason_reactions';

export interface CategoryBadgeConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  iconBg: string;
}

export const CATEGORY_CONFIG: Record<LoveReason['category'], CategoryBadgeConfig> = {
  habits: {
    label: 'Kebiasaan Manis',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-anniv-rose',
    badgeBorder: 'border-rose-200/80',
    accentColor: '#9E4759',
    iconBg: 'bg-rose-100/70',
  },
  memories: {
    label: 'Momen Berkesan',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-[#8C4A32]',
    badgeBorder: 'border-amber-200/80',
    accentColor: '#8C4A32',
    iconBg: 'bg-amber-100/70',
  },
  quirks: {
    label: 'Tingkah Gemes',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-[#9E4759]',
    badgeBorder: 'border-pink-200/80',
    accentColor: '#9E4759',
    iconBg: 'bg-pink-100/70',
  },
  feelings: {
    label: 'Ungkapan Hati',
    badgeBg: 'bg-stone-50',
    badgeText: 'text-anniv-cocoa',
    badgeBorder: 'border-stone-200/80',
    accentColor: '#3B2F2F',
    iconBg: 'bg-stone-100/70',
  },
};

export function getCategoryBadgeConfig(category?: LoveReason['category']): CategoryBadgeConfig {
  if (category && CATEGORY_CONFIG[category]) {
    return CATEGORY_CONFIG[category];
  }
  return {
    label: 'Hal Favorit',
    badgeBg: 'bg-anniv-peach',
    badgeText: 'text-anniv-rose',
    badgeBorder: 'border-anniv-borderSubtle',
    accentColor: '#9E4759',
    iconBg: 'bg-anniv-blush',
  };
}

export function getNextIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  return (current + 1) % total;
}

export function getPrevIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  return (current - 1 + total) % total;
}

export function getRandomIndex(current: number, total: number): number {
  if (total <= 1) return 0;
  let next = Math.floor(Math.random() * total);
  if (next === current) {
    next = (current + 1) % total;
  }
  return next;
}

export function loadStoredReactions(key: string = REASONS_STORAGE_KEY): Record<string, number> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, number>;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveStoredReactions(
  reactions: Record<string, number>,
  key: string = REASONS_STORAGE_KEY
): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(reactions));
    return true;
  } catch {
    return false;
  }
}
