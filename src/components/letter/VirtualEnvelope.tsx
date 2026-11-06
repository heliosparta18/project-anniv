import { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import type { LoveLetter } from '../../types/anniversary';
import { loveLetter as defaultLoveLetter } from '../../data/anniversaryData';
import { WaxSeal } from './WaxSeal';
import { ParchmentLetter } from './ParchmentLetter';

export interface VirtualEnvelopeProps {
  letter?: LoveLetter;
  className?: string;
  defaultOpen?: boolean;
}

export function VirtualEnvelope({
  letter = defaultLoveLetter,
  className = '',
  defaultOpen = false,
}: VirtualEnvelopeProps) {
  const [envelopeState, setEnvelopeState] = useState<'sealed' | 'unsealing' | 'opened'>(
    defaultOpen ? 'opened' : 'sealed'
  );

  const handleBreakSeal = () => {
    if (envelopeState !== 'sealed') return;
    setEnvelopeState('unsealing');
    // Allow wax crack animation and flap unfolding
    setTimeout(() => {
      setEnvelopeState('opened');
    }, 650);
  };

  const handleReseal = () => {
    setEnvelopeState('sealed');
  };

  const isOpen = envelopeState === 'opened';
  const isUnsealing = envelopeState === 'unsealing';

  return (
    <div className={`w-full max-w-2xl mx-auto flex flex-col items-center select-none ${className}`}>
      {!isOpen ? (
        /* Envelope View (Sealed or Unsealing State) */
        <div className="w-full max-w-lg mx-auto flex flex-col items-center">
          {/* 3D Envelope Container */}
          <div
            className="w-full relative aspect-[16/11] sm:aspect-[16/10] bg-[#F5EDE3] rounded-2xl border border-[#DFD3C4] shadow-warm-elevation overflow-hidden [perspective:1000px]"
            role="region"
            aria-label="Amplop surat cinta tersegel"
          >
            {/* Postal Stamp & Postmark at Top-Right */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end pointer-events-none">
              <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-md border-2 border-dashed border-anniv-rose/40 bg-white/70 p-1 flex flex-col items-center justify-between shadow-sm">
                <Heart className="w-4 h-4 text-anniv-rose fill-anniv-rose mt-1" />
                <span className="font-serif text-[9px] uppercase tracking-wider text-anniv-cocoa font-bold text-center leading-tight">
                  4th Anniv Post<span className="sr-only"> (1st Anniv Post)</span>
                </span>
                <span className="text-[8px] font-mono text-anniv-truffle">10.11.26</span>
              </div>
            </div>

            {/* Addressee handwritten calligraphic label */}
            <div className="absolute top-8 left-6 sm:top-10 sm:left-8 z-10 pointer-events-none">
              <p className="font-serif text-xs uppercase tracking-widest text-anniv-truffle mb-0.5">
                Surat Khusus Untuk:
              </p>
              <p className="font-handwriting text-2xl sm:text-3xl font-bold text-anniv-cocoa">
                Alya Sayang ❤️
              </p>
            </div>

            {/* Envelope Pocket Flaps (Left, Right, Bottom) */}
            <div
              className="absolute inset-0 bg-[#E8DDD0] pointer-events-none"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
              }}
              aria-hidden="true"
            >
              {/* Bottom flap */}
              <div
                className="absolute inset-0 bg-[#E4D7C9]"
                style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 48%)' }}
              />
              {/* Left flap */}
              <div
                className="absolute inset-0 bg-[#E0D2C3]"
                style={{ clipPath: 'polygon(0 0, 0 100%, 48% 50%)' }}
              />
              {/* Right flap */}
              <div
                className="absolute inset-0 bg-[#DDCFC0]"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 52% 50%)' }}
              />
            </div>

            {/* Top Folding Flap (3D Flip Animation) */}
            <div
              className={`absolute top-0 left-0 w-full h-[62%] [transform-origin:top] transition-transform duration-700 ease-in-out z-20 ${
                isUnsealing ? '[transform:rotateX(180deg)]' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
              }}
              aria-hidden="true"
            >
              <div
                className="w-full h-full bg-[#EFE3D5] border-b border-[#D8C9B9]"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  boxShadow: '0 4px 8px rgba(74, 62, 61, 0.08)',
                }}
              />
            </div>

            {/* Wax Seal Centered on the Apex of the Top Flap */}
            <div className="absolute top-[48%] sm:top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <WaxSeal
                sealText={letter.sealText || 'R & A'}
                isBreaking={isUnsealing}
                isBroken={isOpen}
                onBreak={handleBreakSeal}
              />
            </div>
          </div>

          {/* Prompt Instruction & Call to Action (WCAG compliant) */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleBreakSeal}
              aria-label="Pecahkan segel lilin untuk membuka surat cinta"
              className="min-h-[44px] min-w-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-anniv-card hover:bg-anniv-peach text-anniv-cocoa border border-anniv-borderSubtle text-xs sm:text-sm font-semibold shadow-warm-sm transition-all duration-200 hover:scale-105 hover:shadow-warm-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-anniv-rose" />
              <span>Klik Segel Lilin untuk Membuka Amplop</span>
            </button>
            <p className="text-xs text-anniv-truffle mt-2 font-medium">
              Disegel dengan cinta pada {letter.date}
            </p>
          </div>
        </div>
      ) : (
        /* Unfolded Parchment Letter View */
        <div className="w-full">
          <ParchmentLetter letter={letter} onReseal={handleReseal} />
        </div>
      )}
    </div>
  );
}

export default VirtualEnvelope;
