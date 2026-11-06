import { coupleProfile } from '../../data/anniversaryData';
import { useLiveCounter } from '../../hooks/useLiveCounter';

export interface LiveCounterProps {
  /**
   * ISO relationship start date string (e.g. '2025-05-04T00:00:00').
   * Defaults to coupleProfile.anniversaryDate.
   */
  startDate?: string | Date;
  className?: string;
  showMilestoneProgress?: boolean;
}

/**
 * LiveCounter Component
 * Displays elapsed relationship duration across 6 Gregorian units:
 * Years, Months, Days, Hours, Minutes, Seconds (Tahun, Bulan, Hari, Jam, Menit, Detik).
 *
 * Visual & Design Invariants:
 * - Mobile-first responsive reflow: 3 columns (<640px) to 6 columns (>=640px).
 * - Soft peach / blush card backgrounds with warm cocoa typography.
 * - Subtle pulsing separator accents indicating active live ticking.
 * - Screen-reader live polite updates without layout jitter (tabular-nums).
 * - Zero em dash characters (R-02 antislop compliance).
 */
export function LiveCounter({
  startDate = coupleProfile.anniversaryDate,
  className = '',
  showMilestoneProgress = true,
}: LiveCounterProps) {
  const counter = useLiveCounter(startDate);

  const units = [
    { key: 'years', label: 'Tahun', value: counter.years, singular: 'Tahun', pad: false },
    { key: 'months', label: 'Bulan', value: counter.months, singular: 'Bulan', pad: false },
    { key: 'days', label: 'Hari', value: counter.days, singular: 'Hari', pad: false },
    { key: 'hours', label: 'Jam', value: counter.hours, singular: 'Jam', pad: true },
    { key: 'minutes', label: 'Menit', value: counter.minutes, singular: 'Menit', pad: true },
    { key: 'seconds', label: 'Detik', value: counter.seconds, singular: 'Detik', pad: true },
  ];

  return (
    <div
      className={`w-full max-w-2xl mx-auto flex flex-col items-center ${className}`}
      aria-label="Anniversary live counter"
    >
      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="off">
        {counter.years} tahun, {counter.months} bulan, {counter.days} hari, {counter.hours} jam, {counter.minutes} menit, {counter.seconds} detik bersama
      </div>

      {/* 6-Unit Metric Grid: 3 cols on mobile (<640px), 6 cols on tablet/desktop (>=640px) */}
      <div className="w-full grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4 items-center">
        {units.map((unit, index) => {
          const displayVal = unit.pad
            ? String(unit.value ?? 0).padStart(2, '0')
            : String(unit.value ?? 0);
          const isDateUnit = index < 3; // Years, Months, Days receive gentle peach; Hours, Mins, Secs blush

          return (
            <div
              key={unit.key}
              className={`group relative flex flex-col items-center justify-center py-3.5 px-2 sm:py-4 sm:px-2.5 rounded-2xl border border-anniv-borderSubtle/80 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-xs min-w-[70px] ${
                isDateUnit ? 'bg-anniv-peach/40' : 'bg-anniv-blush/40'
              }`}
            >
              {/* Subtle pulsing separator indicator dot on top right of each card */}
              <div className="absolute top-2 right-2 flex items-center justify-center" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-anniv-rose/50 animate-pulse" />
              </div>

              {/* Number Value with Editorial Serif Styling */}
              <span className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-anniv-cocoa tracking-tight tabular-nums select-none">
                {displayVal}
              </span>

              {/* Unit Label with Warm Secondary Tone */}
              <span className="mt-1 font-sans text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-anniv-secondary">
                {unit.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Formatted Total Days and Milestone Progress Badge */}
      {showMilestoneProgress && (
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-anniv-secondary">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle shadow-warm-sm font-medium">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-anniv-rose opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-anniv-rose" />
            </span>
            <span>{counter.formattedElapsed || `${counter.totalDays || 1461} hari bersama`}</span>
          </div>
          <span className="hidden sm:inline text-anniv-dusty" aria-hidden="true">&bull;</span>
          <span className="font-serif italic text-anniv-truffle">
            Setiap detik berarti bersamamu
          </span>
        </div>
      )}
    </div>
  );
}

export default LiveCounter;
