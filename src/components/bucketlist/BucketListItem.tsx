import { Heart } from 'lucide-react';
import type { BucketListItem as BucketListItemType } from '../../types/anniversary';

export interface BucketListItemProps {
  item: BucketListItemType;
  isCompleted: boolean;
  onToggle: (itemId: string) => void;
  className?: string;
}

export function BucketListItem({
  item,
  isCompleted,
  onToggle,
  className = '',
}: BucketListItemProps) {
  return (
    <div
      className={`group flex items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-anniv-peach/30 border-anniv-borderSubtle/60 shadow-warm-sm'
          : 'bg-anniv-card border-anniv-borderSubtle hover:border-anniv-borderAction/50 shadow-warm-sm hover:shadow-warm-md'
      } ${className}`}
    >
      {/* Heart Checkbox Button */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        onClick={() => onToggle(item.id)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-anniv-peach/60 transition-colors focus-visible:outline-2 focus-visible:outline-anniv-rose cursor-pointer"
        aria-label={`Tandai "${item.text}" sebagai ${isCompleted ? 'belum selesai' : 'selesai'}`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
            isCompleted
              ? 'bg-anniv-rose text-anniv-card shadow-warm-sm'
              : 'border-2 border-anniv-borderAction/40 text-anniv-borderAction hover:border-anniv-rose hover:text-anniv-rose'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              isCompleted ? 'fill-current text-white' : 'text-current'
            }`}
          />
        </div>
      </button>

      {/* Dream Text */}
      <div
        className="flex-1 cursor-pointer select-none"
        onClick={() => onToggle(item.id)}
      >
        <p
          className={`text-sm sm:text-base font-medium leading-relaxed transition-all ${
            isCompleted
              ? 'line-through text-anniv-truffle opacity-75 font-normal'
              : 'text-anniv-cocoa'
          }`}
        >
          {item.text}
        </p>
      </div>

      {/* Target Year Pill Badge */}
      {item.targetYear && (
        <span
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
            isCompleted
              ? 'bg-anniv-peach/80 text-anniv-rose border-anniv-borderSubtle'
              : 'bg-anniv-blush text-anniv-cocoa border-anniv-borderSubtle/60'
          }`}
        >
          {item.targetYear}
        </span>
      )}
    </div>
  );
}

export default BucketListItem;
