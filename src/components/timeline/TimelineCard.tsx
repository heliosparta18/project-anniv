import type { Milestone } from '../../types/anniversary';
import { Calendar, MapPin, Heart, Sparkles, Coffee, Car } from 'lucide-react';

export interface CategoryStyle {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: typeof Heart;
}

const CATEGORY_CONFIG: Record<Milestone['category'], CategoryStyle> = {
  firsts: {
    label: 'Pertama Kali',
    bgClass: 'bg-anniv-blush',
    textClass: 'text-anniv-rose',
    borderClass: 'border-anniv-dusty/40',
    icon: Sparkles,
  },
  trips: {
    label: 'Petualangan',
    bgClass: 'bg-anniv-peach',
    textClass: 'text-anniv-rose',
    borderClass: 'border-anniv-champagne',
    icon: Car,
  },
  memories: {
    label: 'Memori Manis',
    bgClass: 'bg-anniv-peach/70',
    textClass: 'text-[#8C2D3A]',
    borderClass: 'border-anniv-borderSubtle',
    icon: Coffee,
  },
  milestones: {
    label: 'Langkah Penting',
    bgClass: 'bg-anniv-rose/10',
    textClass: 'text-anniv-rose',
    borderClass: 'border-anniv-rose/30',
    icon: Heart,
  },
};

export interface TimelineCardProps {
  milestone: Milestone;
  index: number;
  isEven?: boolean;
  className?: string;
  showNode?: boolean;
}

export function TimelineCard({
  milestone,
  index,
  isEven = index % 2 === 0,
  className = '',
  showNode = true,
}: TimelineCardProps) {
  const config = CATEGORY_CONFIG[milestone.category] || CATEGORY_CONFIG.memories;
  const CategoryIcon = config.icon;

  return (
    <div
      className={`relative w-full pl-14 sm:pl-0 flex flex-col sm:flex-row items-center group ${className}`}
      data-testid={`milestone-card-${milestone.id}`}
      data-category={milestone.category}
    >
      {/* Spine Node Marker: Left-aligned on mobile, centered on desktop */}
      {showNode && (
        <div
          className="absolute left-6 sm:left-1/2 -translate-x-1/2 top-6 sm:top-8 z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-anniv-card border-2 border-anniv-rose shadow-warm-sm text-anniv-rose font-bold text-xs sm:text-sm group-hover:scale-110 group-hover:bg-anniv-rose group-hover:text-white transition-all duration-300"
          aria-hidden="true"
        >
          <span className="font-serif">{index + 1}</span>
        </div>
      )}

      {/* Main Card Box: Single column mobile, alternating left/right desktop */}
      <article
        className={`w-full sm:w-[calc(50%-2.5rem)] ${
          isEven ? 'sm:mr-auto' : 'sm:ml-auto'
        } bg-anniv-card rounded-2xl p-5 sm:p-6 border border-anniv-borderSubtle shadow-warm-md hover:shadow-warm-lg transition-all duration-300 relative text-left`}
      >
        {/* Organic Washi Tape Ribbon Motif */}
        <div
          className="washi-tape absolute -top-2.5 left-6 sm:left-8 pointer-events-none"
          aria-hidden="true"
        />

        {/* Header Metadata: Category Badge and Date */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
          >
            <CategoryIcon className="w-3 h-3" />
            <span>{config.label}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-anniv-truffle font-medium">
            <Calendar className="w-3.5 h-3.5 text-anniv-rose shrink-0" />
            <time dateTime={milestone.date}>{milestone.date}</time>
          </span>
        </div>

        {/* Milestone Title in Editorial Serif Typography */}
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-anniv-cocoa mb-2 tracking-tight group-hover:text-anniv-rose transition-colors duration-200">
          {milestone.title}
        </h3>

        {/* Optional Location with Pin Icon */}
        {milestone.location && (
          <p className="flex items-center gap-1.5 text-xs text-anniv-truffle mb-3 font-medium">
            <MapPin className="w-3.5 h-3.5 text-anniv-rose shrink-0" />
            <span>{milestone.location}</span>
          </p>
        )}

        {/* Milestone Description Body */}
        <p className="text-sm sm:text-base text-anniv-secondary leading-relaxed font-sans">
          {milestone.description}
        </p>

        {/* Subtle Card Footer Accent */}
        <div className="mt-4 pt-3 border-t border-anniv-borderSubtle/50 flex items-center justify-between text-xs text-anniv-truffle">
          <span className="font-serif italic text-anniv-rose">
            Chapter #{index + 1}
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <Heart className="w-3 h-3 fill-anniv-rose text-anniv-rose inline-block" />
            <span>Sweet Memory</span>
          </span>
        </div>
      </article>
    </div>
  );
}

export default TimelineCard;
