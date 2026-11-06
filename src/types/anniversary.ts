/**
 * Anniversary Website TypeScript Contracts
 * Single source of truth interface declarations matching PROJECT.md.
 */

export interface CoupleProfile {
  partnerName: string;
  myName: string;
  anniversaryDate: string; // ISO date 'YYYY-MM-DDTHH:mm:ss'
  tagline: string;
  subtagline: string;
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'firsts' | 'trips' | 'memories' | 'milestones';
  location?: string;
  image?: string;
}

export interface PolaroidPhoto {
  id: string;
  url: string;
  thumbnail: string;
  caption: string;
  date: string;
  location: string;
  category: 'all' | 'dates' | 'travel' | 'candid' | 'favorites';
  rotation: number; // degrees e.g. -2.5 to 2.5
  note?: string; // handwritten note on back
}

export interface LoveLetter {
  title?: string;
  salutation: string;
  opening: string;
  paragraphs: string[];
  closing: string;
  signature: string;
  date: string;
  sealText?: string;
}

export interface LoveReason {
  id: string;
  number: number;
  text: string;
  category: 'habits' | 'memories' | 'quirks' | 'feelings';
  icon?: string;
  title?: string;
  description?: string;
}

export interface Coupon {
  id: string;
  title: string;
  description: string;
  terms: string;
  icon: string;
  category: 'treat' | 'activity' | 'pass';
  expires: string;
}

export interface BucketListItem {
  id: string;
  text: string;
  completed: boolean;
  targetYear?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src?: string;
  notes?: string;
  youtubeId?: string;
  duration?: string;
  personalNote?: string;
}

export interface AnniversaryData {
  profile: CoupleProfile;
  milestones: Milestone[];
  polaroids: PolaroidPhoto[];
  loveLetter: LoveLetter;
  reasons: LoveReason[];
  coupons: Coupon[];
  bucketList: BucketListItem[];
  musicTracks: MusicTrack[];
}

// Convenience Category Enums & Type Aliases
export type MilestoneCategory = Milestone['category'];
export type PolaroidCategory = PolaroidPhoto['category'];
export type LoveReasonCategory = LoveReason['category'];
export type CouponCategory = Coupon['category'];

// Architectural & survey interoperability aliases
export type MilestoneItem = Milestone;
export type PolaroidMoment = PolaroidPhoto;
export type RelationshipCoupon = Coupon;
export type LoveLetterConfig = LoveLetter;
export type AnniversaryDataConfig = AnniversaryData;
