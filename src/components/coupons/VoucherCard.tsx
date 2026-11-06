import {
  Sparkles,
  Ticket,
  CheckCircle2,
} from 'lucide-react';
import type { Coupon } from '../../types/anniversary';
import { COUPON_ICON_MAP } from './voucherUtils';

export interface VoucherCardProps {
  coupon: Coupon;
  isRedeemed: boolean;
  onRedeem: (couponId: string) => void;
  onReset: (couponId: string) => void;
  className?: string;
}

const CATEGORY_STYLES: Record<Coupon['category'], { badge: string; border: string }> = {
  treat: {
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    border: 'border-pink-200/60',
  },
  activity: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    border: 'border-amber-200/60',
  },
  pass: {
    badge: 'bg-rose-50 text-anniv-rose border-rose-200',
    border: 'border-rose-200/60',
  },
};

export function VoucherCard({
  coupon,
  isRedeemed,
  onRedeem,
  onReset,
  className = '',
}: VoucherCardProps) {
  const IconComponent = COUPON_ICON_MAP[coupon.icon] || Ticket;
  const styleConfig = CATEGORY_STYLES[coupon.category] || CATEGORY_STYLES.pass;

  return (
    <div
      className={`relative w-full rounded-2xl bg-anniv-card border border-anniv-borderSubtle shadow-warm-md hover:shadow-warm-lg transition-all duration-300 overflow-hidden flex flex-col md:flex-row ${
        isRedeemed ? 'opacity-90 saturate-85' : ''
      } ${className}`}
    >
      {/* Main Coupon Body (Left on Desktop, Top on Mobile) */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${styleConfig.badge}`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{coupon.category}</span>
            </span>
            <span className="text-xs font-medium text-anniv-secondary bg-anniv-peach px-2.5 py-0.5 rounded-full border border-anniv-borderSubtle/60">
              Valid: {coupon.expires}
            </span>
          </div>

          {/* Voucher Title */}
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-anniv-cocoa mb-2">
            {coupon.title}
          </h3>

          {/* Voucher Description */}
          <p className="text-sm text-anniv-secondary leading-relaxed mb-4">
            {coupon.description}
          </p>
        </div>

        {/* Voucher Terms / Conditions */}
        <div className="pt-3 border-t border-anniv-borderSubtle/60 text-xs text-anniv-truffle italic flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-anniv-rose shrink-0" />
          <span>{coupon.terms}</span>
        </div>
      </div>

      {/* Perforation Seam with Circular Notch Cutouts */}
      <div className="relative flex md:flex-col items-center justify-center">
        {/* Dashed Cut Line */}
        <div className="w-full h-0 md:w-0 md:h-full border-t-2 md:border-t-0 md:border-l-2 border-dashed border-anniv-borderAction/30" />

        {/* Desktop Perforation Notches (Top and Bottom) */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-anniv-base border border-anniv-borderSubtle shadow-inner pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="hidden md:block absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-anniv-base border border-anniv-borderSubtle shadow-inner pointer-events-none"
        />

        {/* Mobile Perforation Notches (Left and Right) */}
        <div
          aria-hidden="true"
          className="md:hidden absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-anniv-base border border-anniv-borderSubtle shadow-inner pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="md:hidden absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-anniv-base border border-anniv-borderSubtle shadow-inner pointer-events-none"
        />
      </div>

      {/* Ticket Stub (Right on Desktop, Bottom on Mobile) */}
      <div className="w-full md:w-48 bg-anniv-peach/40 p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-3 border-t md:border-t-0 border-anniv-borderSubtle/60">
        <div className="text-[11px] font-mono tracking-widest text-anniv-truffle uppercase">
          VOUCHER STUB
        </div>
        <div className="w-12 h-12 rounded-full bg-anniv-card border border-anniv-borderSubtle flex items-center justify-center text-anniv-rose shadow-warm-sm">
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="text-[10px] text-anniv-secondary font-mono">
          NO. {coupon.id.toUpperCase().replace('-', ' ')}
        </div>

        {/* Action Controls */}
        {isRedeemed ? (
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="w-full min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-anniv-peach text-anniv-wax font-semibold text-xs uppercase tracking-wider border border-anniv-wax/40 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-anniv-wax" />
              <span>Terpakai</span>
            </div>
            <button
              type="button"
              onClick={() => onReset(coupon.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[11px] text-anniv-secondary underline hover:text-anniv-rose transition-colors py-1 px-2 focus-visible:outline-2 focus-visible:outline-anniv-rose rounded-lg cursor-pointer"
              aria-label={`Batalkan penukaran voucher ${coupon.title}`}
            >
              Batalkan
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onRedeem(coupon.id)}
            className="w-full min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-anniv-rose hover:bg-anniv-roseHover text-anniv-card font-semibold text-xs uppercase tracking-wider shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-anniv-rose cursor-pointer"
            aria-label={`Tukarkan voucher ${coupon.title}`}
          >
            <Ticket className="w-4 h-4" />
            <span>Tukarkan</span>
          </button>
        )}
      </div>

      {/* TERPAKAI / REDEEMED Stamp Overlay */}
      {isRedeemed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="border-4 border-dashed border-anniv-wax text-anniv-wax font-serif font-black text-lg sm:text-2xl px-5 py-2 rounded-xl -rotate-12 tracking-widest uppercase bg-anniv-card/90 shadow-warm-md select-none">
            TERPAKAI &bull; REDEEMED
          </div>
        </div>
      )}
    </div>
  );
}

export default VoucherCard;
