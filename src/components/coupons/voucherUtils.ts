import {
  Utensils,
  CupSoda,
  Sparkles,
  Heart,
  Film,
  ShieldCheck,
  Crown,
  Car,
  Ticket,
  Gift,
  Clock,
  type LucideIcon,
} from 'lucide-react';

export const COUPON_ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  CupSoda,
  Sparkles,
  Heart,
  Film,
  ShieldCheck,
  Crown,
  Car,
  Ticket,
  Gift,
  Clock,
};

export function getCouponIcon(iconName: string): LucideIcon {
  return COUPON_ICON_MAP[iconName] || Ticket;
}
