import { Mail } from 'lucide-react';
import type { LoveLetter } from '../../types/anniversary';
import { loveLetter as defaultLoveLetter } from '../../data/anniversaryData';
import { VirtualEnvelope } from './VirtualEnvelope';

export interface LoveLetterSectionProps {
  letter?: LoveLetter;
  className?: string;
}

export function LoveLetterSection({
  letter = defaultLoveLetter,
  className = '',
}: LoveLetterSectionProps) {
  return (
    <section
      id="letter"
      aria-label="Interactive Love Letter and Virtual Envelope"
      className={`w-full py-16 sm:py-24 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20 overflow-x-clip px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {/* Chapter 4 Header Landmark */}
      <div className="w-full max-w-3xl text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
          <Mail className="w-3.5 h-3.5" />
          <span>Chapter 4 &bull; Surat Cinta &amp; Amplop Virtual</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-anniv-cocoa mb-3 tracking-tight">
          {letter.title || 'A Letter For You'}
        </h2>
        <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Sebuah surat kecil tentang 4 tahun perjalanan hangat bareng kamu. Pecahkan segel lilin merah marunnya untuk membaca isi surat.
        </p>
      </div>

      {/* Virtual Envelope Interactive Experience */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <VirtualEnvelope letter={letter} />
      </div>
    </section>
  );
}

export default LoveLetterSection;
