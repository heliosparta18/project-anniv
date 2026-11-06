import { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

export interface WaxSealProps {
  sealText?: string;
  isBroken?: boolean;
  isBreaking?: boolean;
  onBreak?: () => void;
  className?: string;
}

export function WaxSeal({
  sealText = 'D & D',
  isBroken = false,
  isBreaking = false,
  onBreak,
  className = '',
}: WaxSealProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isBroken && !isBreaking && onBreak) {
      onBreak();
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Bursting particles when seal breaks */}
      {isBreaking && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
          <span className="absolute -top-3 -left-3 animate-ping text-anniv-rose">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="absolute -top-3 -right-3 animate-ping text-anniv-dusty delay-100">
            <Heart className="w-3.5 h-3.5 fill-current" />
          </span>
          <span className="absolute -bottom-3 -left-2 animate-ping text-anniv-peach delay-150">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="absolute -bottom-3 -right-3 animate-ping text-anniv-rose delay-75">
            <Heart className="w-4 h-4 fill-current" />
          </span>
        </div>
      )}

      {/* Wax Seal Interactive Button (WCAG 2.5.5 >= 44x44px target) */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isBroken || isBreaking}
        aria-label={isBroken ? 'Segel lilin telah terbuka' : 'Pecahkan segel lilin untuk membuka surat cinta'}
        className={`min-h-[44px] min-w-[44px] w-14 h-14 sm:w-16 sm:h-16 rounded-[49%_51%_52%_48%_/_50%_49%_51%_50%] relative flex items-center justify-center transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose focus-visible:ring-offset-2 ${
          isBroken
            ? 'opacity-0 scale-75 pointer-events-none'
            : isBreaking
            ? 'scale-110 rotate-6 shadow-warm-lg'
            : isHovered
            ? 'scale-105 shadow-warm-lg'
            : 'shadow-warm-md'
        }`}
        style={{
          background: 'radial-gradient(circle at 35% 30%, #A83244 0%, #8C2D3A 55%, #6A1A25 100%)',
          boxShadow:
            'inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -3px 6px rgba(0, 0, 0, 0.45), 0 6px 16px rgba(74, 62, 61, 0.28)',
        }}
      >
        {/* Subtle irregular wax drip rim */}
        <div
          className="absolute inset-1 rounded-full border border-white/20 pointer-events-none"
          aria-hidden="true"
        />

        {/* Inner Stamped Circle */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#581520]/70 flex flex-col items-center justify-center bg-black/10 shadow-inner px-1">
          <Heart className="w-2.5 h-2.5 text-anniv-champagne/90 fill-anniv-champagne/80 mb-0.5" />
          <span className="font-serif font-bold text-[11px] sm:text-xs text-anniv-champagne tracking-widest uppercase select-none drop-shadow-sm">
            {sealText}
          </span>
        </div>

        {/* Wax Crack Lines Overlay when breaking */}
        {isBreaking && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none animate-pulse"
            viewBox="0 0 64 64"
            fill="none"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M32 6 L30 24 L35 34 L28 48 L32 58" />
            <path d="M30 24 L20 28" />
            <path d="M35 34 L46 38" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default WaxSeal;
