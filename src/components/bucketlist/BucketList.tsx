import { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { CheckSquare, Heart } from 'lucide-react';
import type { BucketListItem as BucketListItemType } from '../../types/anniversary';
import { bucketListItems as defaultBucketListItems } from '../../data/anniversaryData';
import { BucketListItem } from './BucketListItem';

export interface BucketListProps {
  items?: BucketListItemType[];
  storageKey?: string;
  className?: string;
}

export type BucketListFilterStatus = 'all' | 'completed' | 'pending';

export const BUCKET_LIST_STORAGE_KEY = 'anniv_bucket_list_completed';

export function BucketList({
  items = defaultBucketListItems,
  storageKey = BUCKET_LIST_STORAGE_KEY,
  className = '',
}: BucketListProps) {
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return items.filter((item) => item.completed).map((item) => item.id);
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback to default completed state
    }
    return items.filter((item) => item.completed).map((item) => item.id);
  });

  const [activeFilter, setActiveFilter] = useState<BucketListFilterStatus>('all');

  const triggerCelebration = () => {
    try {
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#9E4759', '#D4A5A5', '#E8D8C8', '#FDF1EB', '#8C2D3A'],
          disableForReducedMotion: true,
        });
      }
    } catch {
      // Graceful fallback for non-browser environments
    }
  };

  const handleToggle = (itemId: string) => {
    const isCurrentlyCompleted = completedIds.includes(itemId);
    const nextCompleted = isCurrentlyCompleted
      ? completedIds.filter((id) => id !== itemId)
      : [...completedIds, itemId];

    setCompletedIds(nextCompleted);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(nextCompleted));
      }
    } catch {
      // Storage error fallback
    }

    if (!isCurrentlyCompleted) {
      triggerCelebration();

      // Grand celebration when 100% completed
      if (nextCompleted.length === items.length) {
        setTimeout(() => {
          try {
            if (typeof window !== 'undefined') {
              confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#9E4759', '#D4A5A5', '#E8D8C8', '#FDF1EB', '#8C2D3A'],
                disableForReducedMotion: true,
              });
            }
          } catch {
            // Ignore
          }
        }, 300);
      }
    }
  };

  const totalCount = items.length;
  const completedCount = completedIds.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const isCompleted = completedIds.includes(item.id);
      if (activeFilter === 'completed' && !isCompleted) return false;
      if (activeFilter === 'pending' && isCompleted) return false;
      return true;
    });
  }, [items, completedIds, activeFilter]);

  const STATUS_FILTERS: { key: BucketListFilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All Dreams', count: totalCount },
    { key: 'completed', label: 'Accomplished', count: completedCount },
    { key: 'pending', label: 'Future Goals', count: totalCount - completedCount },
  ];

  return (
    <section
      id="bucket-list"
      aria-label="Our Bucket List and Future Dreams"
      className={`w-full py-16 sm:py-24 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20 overflow-x-clip ${className}`}
    >
      {/* Section Header */}
      <div className="w-full max-w-4xl text-center mb-10 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Chapter 4 &bull; Bucket List</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-anniv-cocoa mb-3">
          Our Bucket List &amp; Future Dreams
        </h2>
        <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Daftar impian dan petualangan yang ingin kita wujudkan bersama, satu per satu.
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl px-4">
        {/* Dynamic Progress Card */}
        <div className="w-full bg-anniv-card rounded-2xl p-6 sm:p-7 border border-anniv-borderSubtle shadow-warm-md mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-anniv-rose mb-1">
                PROGRESS IMPIAN KITA
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-anniv-cocoa">
                {completedCount} of {totalCount} dreams accomplished
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-anniv-rose">
                {progressPercentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${completedCount} of ${totalCount} dreams accomplished`}
            className="w-full bg-anniv-peach/70 h-3 sm:h-3.5 rounded-full overflow-hidden p-0.5 border border-anniv-borderSubtle/60"
          >
            <div
              className="bg-gradient-to-r from-anniv-rose via-anniv-dusty to-anniv-rose h-full rounded-full transition-all duration-500 ease-out shadow-warm-sm"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {progressPercentage === 100 ? (
            <p className="mt-3 text-xs sm:text-sm font-serif italic text-anniv-rose text-center">
              Semua impian di daftar ini sudah terwujud! Waktunya bikin ratusan petualangan baru bareng kamu 💕
            </p>
          ) : (
            <div className="mt-3 flex items-center justify-between text-xs text-anniv-truffle">
              <span>{totalCount - completedCount} impian lagi menunggu kita</span>
              <span>Terus melangkah bersama</span>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div
          role="tablist"
          aria-label="Filter kategori bucket list"
          className="flex flex-wrap items-center justify-center gap-2 mb-6"
        >
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeFilter === tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-anniv-rose cursor-pointer ${
                activeFilter === tab.key
                  ? 'bg-anniv-rose text-anniv-card shadow-warm-sm'
                  : 'bg-anniv-card text-anniv-secondary border border-anniv-borderSubtle hover:bg-anniv-peach hover:text-anniv-cocoa'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-anniv-peach text-anniv-secondary'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Dream Items List */}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <BucketListItem
              key={item.id}
              item={item}
              isCompleted={completedIds.includes(item.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* Sweet Footer Quote */}
        <div className="mt-8 text-center text-xs text-anniv-truffle flex items-center justify-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-anniv-rose fill-anniv-rose shrink-0" />
          <span>Klik tanda hati untuk menandai impian yang sudah terwujud dan merayakannya bersama.</span>
        </div>
      </div>
    </section>
  );
}

export default BucketList;
