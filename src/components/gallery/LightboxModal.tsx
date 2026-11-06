import React, { useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, MapPin, Heart } from 'lucide-react';
import type { PolaroidPhoto } from '../../types/anniversary';

export interface LightboxModalProps {
  /** The photo currently being viewed (null if closed) */
  photo?: PolaroidPhoto | null;
  /** Alternate alias for photo */
  activePhoto?: PolaroidPhoto | null;
  /** Full collection of polaroid photos for prev/next cycling */
  photos?: PolaroidPhoto[];
  /** Explicit open state override (defaults to Boolean(photo || activePhoto)) */
  isOpen?: boolean;
  /** Callback fired when the modal is closed */
  onClose: () => void;
  /** Callback fired when navigating to the next photo */
  onNext?: () => void;
  /** Callback fired when navigating to the previous photo */
  onPrev?: () => void;
  /** Callback fired when selecting a specific photo during circular navigation */
  onSelectPhoto?: (photo: PolaroidPhoto) => void;
  /** Optional custom CSS class */
  className?: string;
}

export function LightboxModal({
  photo,
  activePhoto,
  photos = [],
  isOpen,
  onClose,
  onNext,
  onPrev,
  onSelectPhoto,
  className = '',
}: LightboxModalProps) {
  const currentPhoto = photo ?? activePhoto ?? null;
  const isOpenState = isOpen !== undefined ? isOpen : Boolean(currentPhoto);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Current photo index in full collection
  const currentIndex = currentPhoto && photos.length > 0
    ? photos.findIndex((p) => p.id === currentPhoto.id)
    : -1;

  const hasNavigation = photos.length > 1;

  // Circular navigation handlers
  const handlePrev = useCallback(() => {
    if (onPrev) {
      onPrev();
      return;
    }
    if (hasNavigation && onSelectPhoto && currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
      onSelectPhoto(photos[prevIndex]);
    }
  }, [onPrev, hasNavigation, onSelectPhoto, currentIndex, photos]);

  const handleNext = useCallback(() => {
    if (onNext) {
      onNext();
      return;
    }
    if (hasNavigation && onSelectPhoto && currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % photos.length;
      onSelectPhoto(photos[nextIndex]);
    }
  }, [onNext, hasNavigation, onSelectPhoto, currentIndex, photos]);

  // Body scroll lock invariant: lock body scroll when open, restore on close/unmount
  useEffect(() => {
    if (!isOpenState) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpenState]);

  // Focus management, focus trap, and keyboard shortcuts
  useEffect(() => {
    if (!isOpenState) return;

    // Preserve previously active element for focus restoration
    if (document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    // Auto-focus the close button on open
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        return;
      }
      // Focus trap within modal dialog
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpenState, onClose, handlePrev, handleNext]);

  // Touch gesture swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const deltaX = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50; // 50px threshold

    if (deltaX > minSwipeDistance) {
      handleNext(); // swipe left -> next
    } else if (deltaX < -minSwipeDistance) {
      handlePrev(); // swipe right -> prev
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  if (!isOpenState || !currentPhoto) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo details: ${currentPhoto.caption}`}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto ${className}`}
    >
      {/* Dark Translucent Romantic Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-anniv-cocoa/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Lightbox Polaroid Card */}
      <div
        className="relative w-full max-w-xl sm:max-w-2xl bg-anniv-card rounded-2xl p-4 sm:p-6 sm:pb-8 border border-anniv-borderSubtle shadow-warm-elevation z-10 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Organic Washi Tape Ribbon Motif */}
        <div
          className="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Header Bar: Counter Badge & Close Button */}
        <div className="flex items-center justify-between mb-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-anniv-peach text-anniv-rose font-semibold text-xs tracking-wider border border-anniv-borderSubtle shadow-warm-sm">
              {currentIndex !== -1
                ? `${currentIndex + 1} of ${photos.length} Moments`
                : 'Polaroid Memory'}
            </span>
            <span className="text-xs text-anniv-truffle capitalize hidden sm:inline-block">
              &bull; {currentPhoto.category}
            </span>
          </div>

          {/* Close Button (WCAG 2.5.5 >= 44x44px touch target) */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close photo preview"
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-anniv-peach/80 hover:bg-anniv-peach text-anniv-cocoa hover:text-anniv-rose focus-visible:ring-2 focus-visible:ring-anniv-rose shadow-warm-sm transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aesthetic Typography Memory Parchment Container with Floating Nav Buttons */}
        <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-anniv-peach/35 border border-anniv-borderSubtle/80 p-6 sm:p-8 mb-4 min-h-[200px] sm:min-h-[240px] flex flex-col justify-between shadow-warm-sm group">
          {/* Subtle Decorative Parchment Stamp Header */}
          <div className="flex items-center justify-between border-b border-anniv-borderSubtle/50 pb-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-anniv-rose">
              <Heart className="w-3.5 h-3.5 fill-anniv-rose" />
              <span>Memori Scrapbook</span>
            </span>
            <span className="text-xs text-anniv-truffle font-serif italic">
              Chapter &bull; Personal Note
            </span>
          </div>

          {/* Floating Left / Previous Button (>= 44x44px touch target) */}
          {hasNavigation && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-anniv-card/90 hover:bg-anniv-card text-anniv-cocoa hover:text-anniv-rose focus-visible:ring-2 focus-visible:ring-anniv-rose shadow-warm-md transition-all duration-200 cursor-pointer z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Floating Right / Next Button (>= 44x44px touch target) */}
          {hasNavigation && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-anniv-card/90 hover:bg-anniv-card text-anniv-cocoa hover:text-anniv-rose focus-visible:ring-2 focus-visible:ring-anniv-rose shadow-warm-md transition-all duration-200 cursor-pointer z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Expanded Memory Story Body */}
          <div className="px-6 sm:px-12 py-3 text-center select-text">
            <p className="font-serif italic text-xs sm:text-sm text-anniv-rose mb-2">
              &ldquo;Catatan Manis Perjalanan Kita&rdquo;
            </p>
            <p className="font-handwriting text-2xl sm:text-3xl text-anniv-cocoa leading-relaxed">
              &ldquo;{currentPhoto.note || currentPhoto.caption}&rdquo;
            </p>
          </div>

          {/* Bottom Card Footer Details */}
          <div className="pt-3 border-t border-anniv-borderSubtle/50 flex items-center justify-between text-xs text-anniv-truffle">
            <span className="font-medium text-anniv-secondary">
              {currentPhoto.location}
            </span>
            <span className="font-serif italic text-anniv-rose font-bold">
              D &amp; D 💕
            </span>
          </div>
        </div>

        {/* Polaroid Caption */}
        <h3 className="font-handwriting text-2xl sm:text-3xl text-center text-anniv-cocoa font-bold mb-2">
          {currentPhoto.caption}
        </h3>

        {/* Metadata Details: Date & Location */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-anniv-truffle mb-3">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-anniv-rose" />
            <span>{currentPhoto.date}</span>
          </span>
          {currentPhoto.location && (
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-anniv-rose" />
              <span>{currentPhoto.location}</span>
            </span>
          )}
        </div>

        {/* Handwritten Secret Note from Back */}
        {currentPhoto.note && (
          <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-anniv-peach/40 border border-anniv-borderSubtle/60 text-left">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-anniv-rose mb-1">
              <Heart className="w-3.5 h-3.5 fill-anniv-rose text-anniv-rose" />
              <span>Handwritten Secret Note</span>
            </p>
            <p className="font-handwriting text-lg sm:text-xl text-anniv-cocoa leading-relaxed">
              &ldquo;{currentPhoto.note}&rdquo;
            </p>
          </div>
        )}

        {/* Navigation & Keyboard Helper Footer */}
        <div className="mt-4 pt-3 border-t border-anniv-borderSubtle/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-anniv-truffle">
          <span className="text-[11px]">
            Keyboard: ESC to close &bull; Left/Right arrows or swipe to navigate
          </span>
          {hasNavigation && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous photo button"
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-medium text-anniv-secondary hover:text-anniv-cocoa hover:bg-anniv-peach transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next photo button"
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-medium text-anniv-secondary hover:text-anniv-cocoa hover:bg-anniv-peach transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LightboxModal;
