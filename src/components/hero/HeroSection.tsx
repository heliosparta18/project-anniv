import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart } from 'lucide-react';
import { coupleProfile } from '../../data/anniversaryData';
import type { CoupleProfile } from '../../types/anniversary';
import { LiveCounter } from './LiveCounter';

export interface HeroSectionProps {
  profile?: CoupleProfile;
  onCelebrate?: () => void;
  timelineTargetId?: string;
  className?: string;
}

/**
 * HeroSection Component
 * Feature 5: Hero Section with Romantic Header
 *
 * Visual & Design Invariants:
 * - Editorial serif typography for couple names and main anniversary tagline.
 * - Heartfelt, natural Gen-Z subtagline celebrating love without melodrama or cliches.
 * - Integration of LiveCounter with 6-unit Gregorian breakdown.
 * - Confetti celebration trigger with warm romantic palette and smooth scroll to #timeline.
 * - Mobile-first responsive reflow with overflow-x-clip safety.
 * - Strict antislop compliance (zero em dash, WCAG AA contrast, touch target >= 44px).
 */
export function HeroSection({
  profile = coupleProfile,
  onCelebrate,
  timelineTargetId = 'timeline',
  className = '',
}: HeroSectionProps) {
  const handleCelebrate = useCallback(() => {
    // 1. Trigger Canvas Confetti with warm romantic palette
    confetti({
      particleCount: 100,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#9E4759', '#E8D8C8', '#F7EBEB', '#8C2D3A', '#D4A5A5', '#FDF1EB'],
    });

    // 2. Custom celebration callback if provided
    if (onCelebrate) {
      onCelebrate();
    }

    // 3. Smooth scroll down to timeline section
    const target = document.getElementById(timelineTargetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [onCelebrate, timelineTargetId]);

  return (
    <section
      id="hero"
      aria-label="Anniversary Hero Welcome"
      className={`w-full pt-10 pb-16 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24 flex flex-col items-center text-center scroll-mt-20 overflow-x-clip ${className}`}
    >
      {/* 1. Soft Romantic Pill Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-6 shadow-warm-sm">
        <Sparkles className="w-3.5 h-3.5 text-anniv-rose" aria-hidden="true" />
        <span>Chapter One &bull; Our Story</span>
      </div>

      {/* 2. Couple Names with Editorial Serif Typography */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-3 sm:mb-4 select-none">
        <span className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-anniv-cocoa">
          {profile.myName}
        </span>
        <span
          className="font-handwriting text-3xl sm:text-4xl md:text-5xl text-anniv-rose font-bold -rotate-6"
          aria-hidden="true"
        >
          &amp;
        </span>
        <span className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-anniv-cocoa">
          {profile.partnerName}
        </span>
      </div>

      {/* 3. Romantic Editorial Tagline (H1) */}
      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-anniv-cocoa tracking-tight max-w-4xl leading-[1.1] mb-5">
        {profile.tagline}
      </h1>

      {/* 4. Intimate Gen-Z Subtagline */}
      <p className="font-sans text-base sm:text-lg md:text-xl text-anniv-secondary max-w-2xl leading-relaxed mb-8 sm:mb-10 px-4">
        {profile.subtagline}
      </p>

      {/* 5. Integrated Live Gregorian Counter */}
      <div className="w-full max-w-2xl mb-8 sm:mb-10 px-2">
        <LiveCounter startDate={profile.anniversaryDate} />
      </div>

      {/* 6. Interactive Celebration CTA Button (>=44x44px touch target) */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleCelebrate}
          aria-label="Celebrate our anniversary and view our story"
          className="min-h-[48px] min-w-[48px] px-8 py-3.5 rounded-full bg-anniv-rose text-anniv-card font-semibold shadow-warm-md hover:bg-anniv-roseHover hover:shadow-warm-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anniv-rose select-none"
        >
          <Heart className="w-4 h-4 fill-current text-anniv-card" aria-hidden="true" />
          <span>Celebrate Our Love</span>
        </button>
      </div>
    </section>
  );
}

export default HeroSection;
