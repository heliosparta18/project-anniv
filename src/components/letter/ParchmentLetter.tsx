import { Heart, RotateCcw, Calendar, Feather } from 'lucide-react';
import type { LoveLetter } from '../../types/anniversary';

export interface ParchmentLetterProps {
  letter: LoveLetter;
  onReseal?: () => void;
  className?: string;
}

export function ParchmentLetter({
  letter,
  onReseal,
  className = '',
}: ParchmentLetterProps) {
  return (
    <div
      className={`w-full max-w-2xl mx-auto relative rounded-2xl bg-[#FCFAF5] border border-[#E8DFD3] shadow-warm-elevation p-6 sm:p-10 md:p-12 overflow-hidden select-text transition-all duration-500 animate-in fade-in zoom-in-95 ${className}`}
    >
      {/* Vintage Deckle Edge / Inner Dashed Inset */}
      <div
        className="absolute inset-3 sm:inset-4 border border-dashed border-[#DFD4C3] rounded-xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Decorative Floral & Stamp Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#E8DFD3] pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-anniv-peach text-anniv-rose flex items-center justify-center shadow-warm-sm">
            <Feather className="w-4 h-4" />
          </span>
          <div>
            <p className="font-serif font-bold text-xs uppercase tracking-widest text-anniv-cocoa">
              Surat Cinta Buat Kamu
            </p>
            <p className="text-[11px] text-anniv-truffle font-medium">
              1st Anniversary Edition &bull; Personal Note
            </p>
          </div>
        </div>

        {/* Vintage Postmark Stamp */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-anniv-peach/80 border border-anniv-borderSubtle text-xs text-anniv-secondary font-serif">
          <Calendar className="w-3.5 h-3.5 text-anniv-rose" />
          <span>{letter.date}</span>
        </div>
      </div>

      {/* Letter Body Content */}
      <div className="relative z-10">
        {/* Salutation */}
        <h3 className="font-serif italic text-2xl sm:text-3xl text-anniv-cocoa font-bold mb-3 tracking-tight">
          {letter.salutation}
        </h3>

        {/* Opening Sentence */}
        <p className="font-sans text-base sm:text-lg font-semibold text-anniv-rose mb-5 leading-snug">
          {letter.opening}
        </p>

        {/* Paragraphs */}
        <div className="space-y-4 text-anniv-secondary text-sm sm:text-base leading-relaxed sm:leading-loose font-sans">
          {letter.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? 'first-letter:font-serif first-letter:text-3xl first-letter:font-bold first-letter:text-anniv-rose first-letter:mr-1 first-letter:float-left'
                  : ''
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Signoff & Signature Section */}
        <div className="mt-8 pt-6 border-t border-[#E8DFD3] flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="font-serif italic text-base sm:text-lg text-anniv-cocoa mb-1">
              {letter.closing}
            </p>
            <p className="font-handwriting text-3xl sm:text-4xl font-bold text-anniv-rose tracking-wide mt-2">
              {letter.signature}
            </p>
            <p className="text-xs uppercase tracking-widest text-anniv-truffle mt-1 font-serif">
              {letter.date}
            </p>
          </div>

          {/* Re-seal / Fold Back Button (WCAG 2.5.5 >= 44x44px target) */}
          {onReseal && (
            <button
              type="button"
              onClick={onReseal}
              aria-label="Lipat kembali surat cinta ke dalam amplop"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-anniv-peach hover:bg-anniv-blush text-anniv-rose border border-anniv-borderSubtle text-xs sm:text-sm font-semibold shadow-warm-sm transition-all duration-200 hover:scale-105 hover:shadow-warm-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Lipat &amp; Segel Kembali</span>
            </button>
          )}
        </div>
      </div>

      {/* Decorative Bottom Corner Emblem */}
      <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none select-none text-anniv-rose" aria-hidden="true">
        <Heart className="w-32 h-32 fill-current" />
      </div>
    </div>
  );
}

export default ParchmentLetter;
