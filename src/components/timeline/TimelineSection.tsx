import { useState, useMemo } from 'react';
import { Clock, Sparkles, Filter } from 'lucide-react';
import type { Milestone } from '../../types/anniversary';
import { milestones as defaultMilestones } from '../../data/anniversaryData';
import { TimelineCard } from './TimelineCard';

import { sortMilestonesChronologically } from './timelineUtils';

export type TimelineCategoryFilter = 'all' | 'firsts' | 'trips' | 'memories' | 'milestones';

export interface FilterOption {
  key: TimelineCategoryFilter;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'Semua Momen' },
  { key: 'firsts', label: 'Pertama Kali' },
  { key: 'trips', label: 'Petualangan' },
  { key: 'memories', label: 'Memori Manis' },
  { key: 'milestones', label: 'Langkah Penting' },
];

export interface TimelineSectionProps {
  milestones?: Milestone[];
  className?: string;
}

export function TimelineSection({
  milestones = defaultMilestones,
  className = '',
}: TimelineSectionProps) {
  const [activeCategory, setActiveCategory] = useState<TimelineCategoryFilter>('all');

  const handleCategorySelect = (category: TimelineCategoryFilter) => {
    setActiveCategory(category);
  };

  const sortedMilestones = useMemo(() => {
    return sortMilestonesChronologically(milestones);
  }, [milestones]);

  const filteredMilestones = useMemo(() => {
    if (activeCategory === 'all') return sortedMilestones;
    return sortedMilestones.filter((m) => m.category === activeCategory);
  }, [sortedMilestones, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: milestones.length };
    for (const m of milestones) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [milestones]);

  return (
    <section
      id="timeline"
      aria-label="Our Story and Milestone Timeline"
      className={`w-full py-16 sm:py-24 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20 overflow-x-clip relative ${className}`}
    >
      {/* Section Header */}
      <div className="w-full max-w-4xl text-center mb-10 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>Chapter 1 &bull; Relationship Journey</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-anniv-cocoa mb-3 tracking-tight">
          Perjalanan Cerita Kita
        </h2>
        <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Dari obrolan canggung pertama di Senopati sampai 365 hari penuh tawa dan petualangan bareng kamu.
        </p>
      </div>

      {/* Category Filter Pills (WCAG 2.5.5 >= 44x44px touch targets) */}
      <div
        role="tablist"
        aria-label="Filter timeline milestones by category"
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 sm:mb-16 px-4 max-w-3xl"
      >
        {FILTER_OPTIONS.map((option) => {
          const isSelected = activeCategory === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 border flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-anniv-rose cursor-pointer ${
                isSelected
                  ? 'bg-anniv-rose text-white border-anniv-rose shadow-warm-sm'
                  : 'bg-anniv-card text-anniv-secondary hover:text-anniv-cocoa hover:bg-anniv-peach border-anniv-borderSubtle'
              }`}
              onClick={() => handleCategorySelect(option.key)}
            >
              {option.key === 'all' && <Filter className="w-3.5 h-3.5" />}
              <span>{option.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-anniv-peach text-anniv-rose'
                }`}
              >
                {categoryCounts[option.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline Spine and Cards Container */}
      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Continuous Vertical Spine Line: Left-aligned on mobile, centered on desktop */}
        <div
          className="absolute top-8 bottom-8 left-6 sm:left-1/2 w-0.5 sm:-translate-x-1/2 bg-gradient-to-b from-anniv-peach via-anniv-dusty to-anniv-peach/40 pointer-events-none"
          aria-hidden="true"
        />

        {/* Empty State vs Milestone Card Rows */}
        {filteredMilestones.length === 0 ? (
          <div className="w-full max-w-md py-12 px-6 text-center bg-anniv-card rounded-2xl border border-anniv-borderSubtle shadow-warm-sm mx-auto">
            <Sparkles className="w-8 h-8 text-anniv-dusty mx-auto mb-3" />
            <p className="font-serif text-lg font-bold text-anniv-cocoa mb-1">
              Belum ada momen di kategori ini
            </p>
            <p className="text-xs text-anniv-secondary">
              Pilih kategori lain untuk melihat perjalanan cerita kita.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10 sm:gap-14 relative w-full pt-4">
            {filteredMilestones.map((milestone, idx) => (
              <TimelineCard
                key={milestone.id}
                milestone={milestone}
                index={idx}
                isEven={idx % 2 === 0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TimelineSection;
