import { useState, useMemo } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import type { PolaroidPhoto, PolaroidCategory } from '../../types/anniversary';
import { polaroids as defaultPolaroids } from '../../data/anniversaryData';
import { PolaroidCard } from './PolaroidCard';
import { LightboxModal } from './LightboxModal';

export interface PolaroidGalleryProps {
  photos?: PolaroidPhoto[];
  onPhotoClick?: (photo: PolaroidPhoto) => void;
  className?: string;
}

interface CategoryFilterOption {
  id: PolaroidCategory;
  label: string;
}

const CATEGORY_OPTIONS: CategoryFilterOption[] = [
  { id: 'all', label: 'Semua Momen' },
  { id: 'dates', label: 'Kencan & Kafe' },
  { id: 'travel', label: 'Jalan-Jalan' },
  { id: 'candid', label: 'Tawa Spontan' },
  { id: 'favorites', label: 'Favorit Kita' },
];

export function PolaroidGallery({
  photos = defaultPolaroids,
  onPhotoClick,
  className = '',
}: PolaroidGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<PolaroidCategory>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<PolaroidPhoto | null>(null);

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') {
      return photos;
    }
    return photos.filter((p) => p.category === activeCategory);
  }, [photos, activeCategory]);

  const handleCardPhotoClick = (photo: PolaroidPhoto) => {
    setSelectedPhoto(photo);
    if (onPhotoClick) {
      onPhotoClick(photo);
    }
  };

  return (
    <section
      id="gallery"
      aria-label="Polaroid Memory Gallery"
      className={`w-full py-16 sm:py-24 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20 overflow-x-clip ${className}`}
    >
      {/* Header Container */}
      <div className="w-full max-w-4xl text-center mb-10 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
          <Camera className="w-3.5 h-3.5" />
          <span>Chapter 3 &bull; Polaroid Scrapbook</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-anniv-cocoa mb-3 tracking-tight">
          Momen Manis Bareng Kamu
        </h2>
        <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Kumpulan foto polaroid kenangan kita. Klik fotonya buat baca catatan kecil atau liat foto lebih jelas.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter polaroids by category"
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 max-w-3xl mx-auto px-4"
      >
        {CATEGORY_OPTIONS.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = cat.id === 'all'
            ? photos.length
            : photos.filter((p) => p.category === cat.id).length;

          return (
            <button
              key={cat.id}
              role="tab"
              id={`tab-${cat.id}`}
              aria-selected={isActive}
              aria-controls="gallery-grid"
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer ${
                isActive
                  ? 'bg-anniv-rose text-white shadow-warm-md scale-105'
                  : 'bg-anniv-card text-anniv-secondary hover:text-anniv-cocoa hover:bg-anniv-peach border border-anniv-borderSubtle shadow-warm-sm'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-anniv-peach text-anniv-truffle'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Container */}
      <div
        id="gallery-grid"
        role="tabpanel"
        aria-labelledby={`tab-${activeCategory}`}
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredPhotos.map((photo) => (
              <PolaroidCard
                key={photo.id}
                photo={photo}
                onPhotoClick={handleCardPhotoClick}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-anniv-card rounded-2xl border border-anniv-borderSubtle max-w-md mx-auto shadow-warm-sm">
            <Sparkles className="w-8 h-8 text-anniv-rose mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-xl font-bold text-anniv-cocoa mb-1">
              Belum ada foto di kategori ini
            </h3>
            <p className="text-xs text-anniv-secondary mb-4">
              Coba pilih kategori lain untuk melihat kenangan manis kita.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full bg-anniv-rose text-white text-xs font-semibold shadow-warm-sm hover:bg-anniv-roseHover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer"
            >
              Lihat Semua Foto
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <LightboxModal
        photo={selectedPhoto}
        photos={filteredPhotos.length > 0 ? filteredPhotos : photos}
        onClose={() => setSelectedPhoto(null)}
        onSelectPhoto={(p) => setSelectedPhoto(p)}
      />
    </section>
  );
}

export default PolaroidGallery;
