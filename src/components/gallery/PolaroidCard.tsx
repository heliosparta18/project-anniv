import { useState } from 'react';
import { RotateCw, Maximize2, MapPin, Calendar, Heart, BookOpen } from 'lucide-react';
import type { PolaroidPhoto } from '../../types/anniversary';

export interface PolaroidCardProps {
  photo: PolaroidPhoto;
  onPhotoClick?: (photo: PolaroidPhoto) => void;
  className?: string;
}

export function PolaroidCard({ photo, onPhotoClick, className = '' }: PolaroidCardProps) {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const handleFlip = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsFlipped((prev) => !prev);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPhotoClick) {
      onPhotoClick(photo);
    }
  };

  return (
    <div
      className={`relative w-full max-w-sm mx-auto group/polaroid select-none py-3 ${className}`}
      style={{
        transform: `rotate(${photo.rotation || 0}deg)`,
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Translucent Washi Tape Ribbon at top */}
      <div
        className="washi-tape absolute -top-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        aria-hidden="true"
      />

      {/* 3D Perspective Card Wrapper */}
      <div className="w-full [perspective:1000px]">
        <div
          className={`relative w-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Face: Classic Polaroid Photo with 48px Bottom Chin */}
          <div
            className={`w-full polaroid-frame pb-12 bg-anniv-card [backface-visibility:hidden] rounded-[3px] border border-anniv-borderSubtle/60 shadow-polaroid relative flex flex-col justify-between ${
              isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Aesthetic Typography Memory Frame (Clean Typography Container) */}
            <div className="aspect-square w-full rounded-[2px] bg-gradient-to-b from-[#FAF7F2] to-anniv-peach/30 border border-dashed border-anniv-borderSubtle/80 p-5 flex flex-col justify-between relative group/photo">
              {/* Fullscreen Expand Action Button */}
              <button
                type="button"
                onClick={handleExpand}
                className="min-w-[44px] min-h-[44px] absolute top-2 right-2 rounded-full bg-white/85 hover:bg-white text-anniv-cocoa shadow-warm-sm flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose"
                aria-label={`View fullscreen photo: ${photo.caption}`}
              >
                <Maximize2 className="w-4 h-4 text-anniv-cocoa" />
              </button>

              {/* Memory Chapter & Category Pill */}
              <div className="flex items-center gap-1.5 text-xs text-anniv-truffle">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/85 border border-anniv-borderSubtle/60 text-[11px] font-semibold text-anniv-rose shadow-warm-xs">
                  <Heart className="w-3 h-3 fill-anniv-rose" />
                  <span className="capitalize">{photo.category}</span>
                </span>
              </div>

              {/* Heartfelt Pull-Quote / Note Excerpt in Caveat Font */}
              <div className="my-auto py-2 text-center select-text">
                <p className="font-serif italic text-xs text-anniv-rose mb-1.5">
                  &ldquo;A piece of our story&rdquo;
                </p>
                <p className="font-handwriting text-xl sm:text-2xl text-anniv-cocoa leading-snug line-clamp-3">
                  {photo.note || photo.caption}
                </p>
              </div>

              {/* Bottom Subtle Prompt */}
              <div className="flex items-center justify-center gap-1 text-[11px] text-anniv-truffle/70 font-medium tracking-wide">
                <BookOpen className="w-3 h-3 text-anniv-rose/70" />
                <span>Memori Spesial</span>
              </div>
            </div>

            {/* Bottom 48px Chin: Handwritten Caption and Metadata */}
            <div className="pt-3 px-1 flex flex-col items-center text-center">
              <p className="font-handwriting text-2xl sm:text-[26px] text-anniv-cocoa font-bold line-clamp-1 leading-snug tracking-wide">
                {photo.caption}
              </p>

              <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-anniv-borderSubtle/40 text-xs text-anniv-truffle">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-anniv-rose" />
                  <span className="truncate max-w-[120px]">{photo.location}</span>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-anniv-rose" />
                  <span>{photo.date}</span>
                </span>
              </div>

              {/* Flip to Note Trigger Button */}
              <button
                type="button"
                onClick={handleFlip}
                className="min-h-[44px] min-w-[44px] w-full mt-3 px-4 py-2 rounded-full bg-anniv-peach hover:bg-anniv-blush text-anniv-rose text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose shadow-warm-sm"
                aria-label="Flip card to read handwritten note on back"
              >
                <RotateCw className="w-3.5 h-3.5 text-anniv-rose" />
                <span>Baca Catatan Rahasia</span>
              </button>
            </div>
          </div>

          {/* Back Face: Handwritten Secret Note in Caveat Font */}
          <div
            className={`absolute inset-0 w-full h-full polaroid-frame pb-12 bg-[#FFFDF9] [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[3px] border border-anniv-borderSubtle/60 shadow-polaroid p-4 flex flex-col justify-between ${
              isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {/* Top Note Header */}
            <div>
              <div className="flex items-center justify-between border-b border-anniv-borderSubtle/50 pb-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-anniv-rose">
                  <Heart className="w-3.5 h-3.5 fill-anniv-rose" />
                  <span>Catatan Khusus</span>
                </span>
                <span className="text-[11px] text-anniv-truffle font-medium">
                  {photo.location} &bull; {photo.date}
                </span>
              </div>

              {/* Handwritten Note Body in Caveat */}
              <div className="py-2 px-1 select-text">
                <p className="font-handwriting text-xl sm:text-2xl text-anniv-cocoa leading-relaxed">
                  {photo.note || photo.caption}
                </p>
              </div>
            </div>

            {/* Bottom Signature and Flip Back Button */}
            <div className="pt-3 border-t border-anniv-borderSubtle/50 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-anniv-secondary font-serif italic">
                <span>Forever &amp; Always</span>
                <span className="font-handwriting text-lg text-anniv-rose font-bold">D &amp; D 💕</span>
              </div>

              <button
                type="button"
                onClick={handleFlip}
                className="min-h-[44px] min-w-[44px] w-full px-4 py-2 rounded-full bg-anniv-peach hover:bg-anniv-blush text-anniv-rose text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose shadow-warm-sm"
                aria-label="Flip card back to photo"
              >
                <RotateCw className="w-3.5 h-3.5 text-anniv-rose" />
                <span>Lihat Foto Depan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PolaroidCard;
