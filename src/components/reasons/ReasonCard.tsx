import { useState } from 'react';
import {
  Smile,
  Sparkles,
  Shield,
  Heart,
  Sun,
  Eye,
  Coffee,
  Moon,
  Feather,
  TrendingUp,
  Flame,
  HeartHandshake,
  Quote,
} from 'lucide-react';
import type { LoveReason } from '../../types/anniversary';
import { getCategoryBadgeConfig } from './reasonsUtils';

export interface FloatingParticle {
  id: number;
  xOffset: number;
}

export interface ReasonCardProps {
  reason: LoveReason;
  index: number;
  total: number;
  reactionCount: number;
  onReact: (reasonId: string) => void;
  isCurrent?: boolean;
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Smile,
  Sparkles,
  Shield,
  Heart,
  Sun,
  Eye,
  Coffee,
  Moon,
  Feather,
  TrendingUp,
  Flame,
  HeartHandshake,
};

export function ReasonCard({
  reason,
  index,
  total,
  reactionCount,
  onReact,
  className = '',
}: ReasonCardProps) {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  const badgeConfig = getCategoryBadgeConfig(reason.category);
  const IconComponent = (reason.icon && ICON_MAP[reason.icon]) || Heart;

  const displayTitle = reason.title || `Alasan #${reason.number}`;
  const displayText = reason.description || reason.text;

  const handleHeartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onReact(reason.id);

    // Micro-animation feedback
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);

    const newParticle: FloatingParticle = {
      id: Date.now() + Math.random(),
      xOffset: (Math.random() - 0.5) * 40,
    };
    setParticles((prev) => [...prev, newParticle]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 800);
  };

  return (
    <div
      className={`relative w-full max-w-xl mx-auto bg-anniv-card rounded-3xl p-6 sm:p-8 md:p-10 border border-anniv-borderSubtle shadow-warm-lg flex flex-col justify-between select-none transition-all duration-300 ${className}`}
    >
      {/* Top Header Row: Category Badge & Card Counter */}
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border shadow-warm-sm ${badgeConfig.badgeBg} ${badgeConfig.badgeText} ${badgeConfig.badgeBorder}`}
        >
          <span className={`w-5 h-5 rounded-full ${badgeConfig.iconBg} flex items-center justify-center`}>
            <IconComponent className="w-3 h-3" />
          </span>
          <span>{badgeConfig.label}</span>
        </span>

        <span className="text-xs sm:text-sm font-medium text-anniv-truffle px-3 py-1 rounded-full bg-anniv-peach/60 border border-anniv-borderSubtle/50">
          {displayTitle} &bull; {index + 1} of {total}
        </span>
      </div>

      {/* Main Reason Content Body */}
      <div className="relative py-4 sm:py-6 flex flex-col items-center text-center">
        {/* Subtle Decorative Quote Icon */}
        <div className="mb-4 w-12 h-12 rounded-2xl bg-anniv-peach/70 text-anniv-rose flex items-center justify-center shadow-warm-sm">
          <Quote className="w-6 h-6 rotate-180 opacity-80" />
        </div>

        <blockquote className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-anniv-cocoa leading-snug sm:leading-relaxed max-w-md mx-auto">
          &ldquo;{displayText}&rdquo;
        </blockquote>

        <p className="mt-4 text-xs sm:text-sm text-anniv-secondary font-handwriting text-lg text-anniv-rose">
          Selalu bikin jatuh cinta lagi setiap hari
        </p>
      </div>

      {/* Bottom Footer Row: Heart Reaction Button & Micro-animation */}
      <div className="pt-6 sm:pt-8 mt-4 border-t border-anniv-borderSubtle/60 flex items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-xs text-anniv-truffle block">Tingkat Manis</span>
          <span className="text-xs sm:text-sm font-semibold text-anniv-cocoa">
            {reactionCount > 0 ? `${reactionCount} Cinta Terkirim` : 'Beri cinta pertamamu'}
          </span>
        </div>

        {/* Interactive Heart Reaction Button (WCAG 2.5.5 touch target >= 44x44px) */}
        <div className="relative">
          {/* Floating Hearts Particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute -top-6 pointer-events-none text-anniv-rose flex items-center gap-1 font-bold text-xs animate-[bounce_0.8s_ease-out_forwards] transition-all"
              style={{
                left: `calc(50% + ${p.xOffset}px)`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <Heart className="w-4 h-4 fill-anniv-rose" />
              <span>+1</span>
            </span>
          ))}

          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={`Give heart reaction to reason number ${reason.number}`}
            className={`min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-full inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all duration-200 border shadow-warm-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer ${
              reactionCount > 0
                ? 'bg-anniv-rose text-white border-anniv-rose hover:bg-anniv-roseHover'
                : 'bg-anniv-peach text-anniv-rose border-anniv-borderSubtle hover:bg-anniv-blush'
            } ${isPulsing ? 'scale-105' : ''}`}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                reactionCount > 0 ? 'fill-current' : 'fill-none'
              } ${isPulsing ? 'scale-125' : ''}`}
            />
            <span>{reactionCount > 0 ? `${reactionCount}` : 'Kirim Cinta'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReasonCard;
