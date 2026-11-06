import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { LoveReason } from '../../types/anniversary';
import { loveReasons as defaultReasons } from '../../data/anniversaryData';
import { ReasonCard } from './ReasonCard';
import {
  getNextIndex,
  getPrevIndex,
  getRandomIndex,
  loadStoredReactions,
  saveStoredReactions,
  REASONS_STORAGE_KEY,
} from './reasonsUtils';

export interface ReasonsDeckProps {
  reasons?: LoveReason[];
  initialIndex?: number;
  className?: string;
  onCardChange?: (index: number) => void;
  storageKey?: string;
}

export function ReasonsDeck({
  reasons = defaultReasons,
  initialIndex = 0,
  className = '',
  onCardChange,
  storageKey = REASONS_STORAGE_KEY,
}: ReasonsDeckProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialIndex >= 0 && initialIndex < reasons.length) {
      return initialIndex;
    }
    return 0;
  });

  const [, setDirection] = useState<'next' | 'prev' | 'shuffle' | null>(null);
  const [reactions, setReactions] = useState<Record<string, number>>(() => {
    return loadStoredReactions(storageKey);
  });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Total hearts accumulated across all reasons
  const totalHearts = useMemo(() => {
    return Object.values(reactions).reduce((sum, n) => sum + n, 0);
  }, [reactions]);

  const activeReason = reasons[currentIndex] || reasons[0];

  const handleNext = useCallback(() => {
    if (reasons.length <= 1) return;
    const nextIdx = getNextIndex(currentIndex, reasons.length);
    setDirection('next');
    setCurrentIndex(nextIdx);
    onCardChange?.(nextIdx);
  }, [currentIndex, reasons.length, onCardChange]);

  const handlePrev = useCallback(() => {
    if (reasons.length <= 1) return;
    const prevIdx = getPrevIndex(currentIndex, reasons.length);
    setDirection('prev');
    setCurrentIndex(prevIdx);
    onCardChange?.(prevIdx);
  }, [currentIndex, reasons.length, onCardChange]);

  const handleShuffle = useCallback(() => {
    if (reasons.length <= 1) return;
    const randIdx = getRandomIndex(currentIndex, reasons.length);
    setDirection('shuffle');
    setCurrentIndex(randIdx);
    onCardChange?.(randIdx);
  }, [currentIndex, reasons.length, onCardChange]);

  const handleJump = useCallback(
    (index: number) => {
      if (index === currentIndex || index < 0 || index >= reasons.length) return;
      setDirection(index > currentIndex ? 'next' : 'prev');
      setCurrentIndex(index);
      onCardChange?.(index);
    },
    [currentIndex, reasons.length, onCardChange]
  );

  const handleReact = useCallback(
    (reasonId: string) => {
      setReactions((prev) => {
        const nextCount = (prev[reasonId] || 0) + 1;
        const updated = {
          ...prev,
          [reasonId]: nextCount,
        };
        saveStoredReactions(updated, storageKey);
        return updated;
      });
    },
    [storageKey]
  );

  // Global Keyboard Navigation (ArrowLeft, ArrowRight, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (typeof document === 'undefined') return;
      const activeEl = document.activeElement;
      const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        if (activeReason) {
          e.preventDefault();
          handleReact(activeReason.id);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleNext, handlePrev, handleReact, activeReason]);

  // Mobile Swipe Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStart(null);
  };

  return (
    <section
      id="reasons"
      role="region"
      aria-label="Reasons Why I Love You Card Deck"
      className={`w-full py-16 sm:py-24 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20 overflow-x-clip relative ${className}`}
    >
      {/* Section Header */}
      <div className="w-full max-w-4xl text-center mb-10 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
          <Heart className="w-3.5 h-3.5 fill-anniv-rose" />
          <span>Chapter 4 &bull; Reasons Why I Love You</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-anniv-cocoa mb-3 tracking-tight">
          12 Alasan Kenapa Aku Sayang Kamu
        </h2>
        <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Koleksi kebiasaan manis, tingkah gemes, dan momen random bareng kamu yang selalu bikin jatuh cinta lagi.
        </p>

        {/* Total Love Sent Counter Pill */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-anniv-card border border-anniv-borderSubtle shadow-warm-sm text-xs sm:text-sm font-medium text-anniv-cocoa">
          <Sparkles className="w-3.5 h-3.5 text-anniv-rose" />
          <span>Total Cinta Terkirim:</span>
          <span className="font-bold text-anniv-rose flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-anniv-rose text-anniv-rose inline" />
            {totalHearts}
          </span>
        </div>
      </div>

      {/* Tactile Card Deck Viewport */}
      <div
        className="w-full max-w-xl px-4 relative min-h-[380px] sm:min-h-[420px] flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Deck Card 2 (Deepest subtle tilt) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-8 inset-y-2 rounded-3xl bg-anniv-card/40 border border-anniv-borderSubtle/40 -rotate-2 scale-90 translate-y-3 pointer-events-none transition-transform duration-300"
        />

        {/* Background Deck Card 1 (Middle subtle tilt) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-6 inset-y-1 rounded-3xl bg-anniv-card/75 border border-anniv-borderSubtle/70 rotate-1 scale-95 translate-y-1.5 pointer-events-none transition-transform duration-300 shadow-warm-sm"
        />

        {/* Active Front Card */}
        {activeReason && (
          <div
            key={activeReason.id}
            aria-live="polite"
            className="w-full relative z-10 transition-all duration-300 ease-out transform"
          >
            <ReasonCard
              reason={activeReason}
              index={currentIndex}
              total={reasons.length}
              reactionCount={reactions[activeReason.id] || 0}
              onReact={handleReact}
              isCurrent={true}
            />
          </div>
        )}
      </div>

      {/* Deck Navigation Controls Toolbar */}
      <div className="w-full max-w-xl px-4 mt-8 flex flex-col items-center gap-5">
        <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
          {/* Previous Button (WCAG 2.5.5 touch target >= 44x44px) */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous reason"
            className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-full border border-anniv-borderSubtle bg-anniv-card text-anniv-cocoa hover:bg-anniv-peach hover:text-anniv-rose flex items-center justify-center transition-all shadow-warm-sm hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Shuffle / Random Button (WCAG 2.5.5 touch target >= 44x44px) */}
          <button
            type="button"
            onClick={handleShuffle}
            aria-label="Shuffle random reason"
            className="min-w-[44px] min-h-[44px] px-5 py-2.5 rounded-full border border-anniv-borderSubtle bg-anniv-card text-anniv-secondary hover:text-anniv-cocoa hover:bg-anniv-peach flex items-center justify-center gap-2 transition-all shadow-warm-sm hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer text-xs sm:text-sm font-semibold"
          >
            <Shuffle className="w-4 h-4 text-anniv-rose" />
            <span>Acak Kartu</span>
          </button>

          {/* Next Button (WCAG 2.5.5 touch target >= 44x44px) */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next reason"
            className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-full border border-anniv-borderSubtle bg-anniv-card text-anniv-cocoa hover:bg-anniv-peach hover:text-anniv-rose flex items-center justify-center transition-all shadow-warm-sm hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Continuous Progress Bar & Pagination Pills */}
        <div className="w-full max-w-md flex flex-col items-center gap-2">
          {/* Linear Progress Indicator */}
          <div className="w-full h-1.5 rounded-full bg-anniv-borderSubtle/60 overflow-hidden">
            <div
              className="h-full bg-anniv-rose rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${((currentIndex + 1) / reasons.length) * 100}%`,
              }}
            />
          </div>

          {/* Interactive Pagination Dots (WCAG 2.5.5 touch target >= 44x44px) */}
          <div
            role="tablist"
            aria-label="Reasons pagination"
            className="flex items-center justify-center flex-wrap gap-1 mt-1"
          >
            {reasons.map((r, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to reason ${idx + 1}: ${r.text.slice(0, 24)}...`}
                  onClick={() => handleJump(idx)}
                  className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose rounded-full cursor-pointer"
                >
                  <span
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-6 bg-anniv-rose'
                        : 'w-2 bg-anniv-borderSubtle hover:bg-anniv-dusty'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="text-[11px] sm:text-xs text-anniv-truffle flex items-center gap-2 font-medium">
            <Layers className="w-3 h-3 text-anniv-rose" />
            <span>Gunakan panah keyboard &larr; &rarr; atau usap layar &bull; Spasi untuk cinta</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Interoperability and naming alias matching PROJECT.md
export { ReasonsDeck as ReasonsSection };
export default ReasonsDeck;
