import { useState, useMemo } from 'react';
import { Ticket, Sparkles, RotateCcw } from 'lucide-react';
import type { Coupon } from '../../types/anniversary';
import { coupons as defaultCoupons } from '../../data/anniversaryData';
import { VoucherCard } from './VoucherCard';

export interface CouponBookProps {
  coupons?: Coupon[];
  storageKey?: string;
  className?: string;
}

export type CouponFilterStatus = 'all' | 'available' | 'redeemed';

export const COUPONS_STORAGE_KEY = 'anniv_redeemed_coupons';

export function CouponBook({
  coupons = defaultCoupons,
  storageKey = COUPONS_STORAGE_KEY,
  className = '',
}: CouponBookProps) {
  const [redeemedIds, setRedeemedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeFilter, setActiveFilter] = useState<CouponFilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleRedeem = (couponId: string) => {
    setRedeemedIds((prev) => {
      if (prev.includes(couponId)) return prev;
      const next = [...prev, couponId];
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
      } catch {
        // Storage error fallback
      }
      return next;
    });
  };

  const handleReset = (couponId: string) => {
    setRedeemedIds((prev) => {
      const next = prev.filter((id) => id !== couponId);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
      } catch {
        // Storage error fallback
      }
      return next;
    });
  };

  const handleResetAll = () => {
    setRedeemedIds([]);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Storage error fallback
    }
  };

  const availableCount = coupons.filter((c) => !redeemedIds.includes(c.id)).length;
  const redeemedCount = coupons.filter((c) => redeemedIds.includes(c.id)).length;

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const isRedeemed = redeemedIds.includes(coupon.id);
      if (activeFilter === 'available' && isRedeemed) return false;
      if (activeFilter === 'redeemed' && !isRedeemed) return false;
      if (categoryFilter !== 'all' && coupon.category !== categoryFilter) return false;
      return true;
    });
  }, [coupons, redeemedIds, activeFilter, categoryFilter]);

  const STATUS_TABS: { key: CouponFilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'Semua Voucher', count: coupons.length },
    { key: 'available', label: 'Tersedia', count: availableCount },
    { key: 'redeemed', label: 'Terpakai', count: redeemedCount },
  ];

  return (
    <section
      id="coupons"
      aria-label="Anniversary Relationship Voucher Book"
      className={`w-full py-16 sm:py-24 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20 overflow-x-clip ${className}`}
    >
      {/* Section Header */}
      <div className="w-full max-w-4xl text-center mb-10 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
          <Ticket className="w-3.5 h-3.5" />
          <span>Chapter 4 &bull; Relationship Voucher Book</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-anniv-cocoa mb-3">
          Anniversary Coupon Book
        </h2>
        <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Kumpulan voucher cinta spesial yang bisa kamu tukarkan kapan saja. Perforated, berstempel, dan berlaku seumur hidup.
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-4xl px-4">
        {/* Filter Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Status Tabs */}
          <div
            role="tablist"
            aria-label="Filter status voucher"
            className="flex items-center p-1.5 rounded-full bg-anniv-card border border-anniv-borderSubtle shadow-warm-sm overflow-x-auto max-w-full"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeFilter === tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold transition-all duration-200 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-anniv-rose cursor-pointer ${
                  activeFilter === tab.key
                    ? 'bg-anniv-rose text-anniv-card shadow-warm-sm'
                    : 'text-anniv-secondary hover:text-anniv-cocoa hover:bg-anniv-peach/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeFilter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-anniv-peach text-anniv-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Reset All Action */}
          {redeemedCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full text-xs font-medium text-anniv-secondary hover:text-anniv-rose hover:bg-anniv-peach border border-anniv-borderSubtle/60 transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-anniv-rose cursor-pointer"
              aria-label="Kembalikan semua voucher yang terpakai"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{`Reset Voucher (${redeemedCount})`}</span>
            </button>
          )}
        </div>

        {/* Voucher Cards Grid */}
        {filteredCoupons.length === 0 ? (
          <div className="w-full text-center py-16 bg-anniv-card rounded-2xl border border-dashed border-anniv-borderSubtle p-8">
            <Ticket className="w-10 h-10 text-anniv-truffle mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-xl font-bold text-anniv-cocoa mb-1">
              Tidak Ada Voucher di Kategori Ini
            </h3>
            <p className="text-sm text-anniv-secondary mb-4">
              Pilih tab status atau kategori lain untuk melihat koleksi voucher.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setCategoryFilter('all');
              }}
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full bg-anniv-rose text-anniv-card text-xs uppercase tracking-wider font-semibold shadow-warm-sm hover:bg-anniv-roseHover transition-colors focus-visible:outline-2 focus-visible:outline-anniv-rose cursor-pointer"
            >
              Tampilkan Semua
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCoupons.map((coupon) => (
              <VoucherCard
                key={coupon.id}
                coupon={coupon}
                isRedeemed={redeemedIds.includes(coupon.id)}
                onRedeem={handleRedeem}
                onReset={handleReset}
              />
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-anniv-truffle flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-anniv-rose shrink-0" />
          <span>Status voucher tersimpan otomatis di perangkat ini. Bebas digunakan kapan saja.</span>
        </div>
      </div>
    </section>
  );
}

export default CouponBook;
