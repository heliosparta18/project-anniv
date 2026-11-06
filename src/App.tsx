import {
  Heart,
  Sparkles,
  Mail,
  Ticket,
  CheckSquare,
} from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { VinylPlayer } from './components/audio/VinylPlayer';
import { TimelineSection } from './components/timeline/TimelineSection';
import { PolaroidGallery } from './components/gallery/PolaroidGallery';
import {
  coupleProfile,
  loveLetter,
  loveReasons,
  coupons,
  bucketListItems,
} from './data/anniversaryData';

export function App() {
  return (
    <AppShell
      navbar={<Navbar />}
      audioWidget={<VinylPlayer variant="dock" />}
      footer={
        <div className="py-8 text-center text-sm text-anniv-secondary">
          <p className="flex items-center justify-center gap-1.5 font-serif text-base text-anniv-cocoa mb-1">
            <span>Crafted with love for</span>
            <span className="font-semibold text-anniv-rose">{coupleProfile.partnerName}</span>
            <Heart className="w-4 h-4 fill-anniv-rose text-anniv-rose inline-block" />
          </p>
          <p className="text-xs text-anniv-truffle">
            {coupleProfile.myName} &amp; {coupleProfile.partnerName} &bull; 1 Year of Beautiful Memories
          </p>
        </div>
      }
    >
      {/* 1. Hero Section with Live Gregorian Counter */}
      <HeroSection />

      {/* 2. Interactive Relationship Journey Timeline */}
      <TimelineSection />

      {/* 3. Scrapbook Polaroid Flip Gallery & Lightbox Modal */}
      <PolaroidGallery />

      {/* 4. Love Letter Landmark Section (Stage 4) */}
      <section id="letter" className="w-full py-16 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20">
        <div className="w-full max-w-4xl text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
            <Mail className="w-3.5 h-3.5" />
            <span>Coming in Chapter 4 &bull; Virtual Wax Seal Envelope</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-anniv-cocoa mb-3">
            {loveLetter.title || 'A Letter For You'}
          </h2>
          <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto">
            A heartfelt personal letter sealed with love, waiting to be unfolded.
          </p>
        </div>

        {/* Sealed Envelope / Letter Preview Card */}
        <div className="w-full max-w-xl bg-anniv-card rounded-2xl p-6 sm:p-8 border border-anniv-borderSubtle shadow-warm-md text-center relative overflow-hidden">
          <div className="wax-seal-badge mx-auto mb-4 flex items-center justify-center text-white font-serif font-bold text-sm tracking-wider">
            {loveLetter.sealText || 'R & A'}
          </div>
          <p className="font-serif italic text-lg sm:text-xl text-anniv-cocoa mb-3">
            &ldquo;{loveLetter.salutation}&rdquo;
          </p>
          <p className="font-sans text-sm sm:text-base text-anniv-secondary max-w-lg mx-auto leading-relaxed mb-4 line-clamp-3">
            {loveLetter.opening} {loveLetter.paragraphs[0]}
          </p>
          <div className="pt-3 border-t border-anniv-borderSubtle/50 text-xs text-anniv-truffle font-medium">
            Interactive wax seal break &amp; 3D parchment unfolding animation arrives in Chapter 4
          </div>
        </div>
      </section>

      {/* 5. Reasons Landmark Section (Stage 4) */}
      <section id="reasons" className="w-full py-16 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20">
        <div className="w-full max-w-4xl text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
            <Heart className="w-3.5 h-3.5" />
            <span>Coming in Chapter 4 &bull; Reasons Card Deck</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-anniv-cocoa mb-3">
            12 Reasons Why I Love You
          </h2>
          <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto">
            A shuffleable deck celebrating all your little quirks, habits, and sweet gestures.
          </p>
        </div>

        {/* Reason Card Preview */}
        {loveReasons[0] && (
          <div className="w-full max-w-xl bg-anniv-card rounded-2xl p-6 sm:p-8 border border-anniv-borderSubtle shadow-warm-md text-left relative">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-anniv-peach text-anniv-rose font-semibold text-xs uppercase tracking-wider">
                Reason #{loveReasons[0].number} &bull; {loveReasons[0].category}
              </span>
              <span className="text-xs text-anniv-truffle font-medium">
                1 of {loveReasons.length} Reasons
              </span>
            </div>
            <p className="font-serif text-xl sm:text-2xl font-bold text-anniv-cocoa leading-snug mb-4">
              &ldquo;{loveReasons[0].text}&rdquo;
            </p>
            <div className="pt-3 border-t border-anniv-borderSubtle/50 text-xs text-anniv-secondary flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-anniv-rose fill-anniv-rose shrink-0" />
              <span>Interactive card flip deck &amp; heart reaction counter arrives in Chapter 4</span>
            </div>
          </div>
        )}
      </section>

      {/* 6. Vouchers Landmark Section (Stage 4) */}
      <section id="coupons" className="w-full py-16 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20">
        <div className="w-full max-w-4xl text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
            <Ticket className="w-3.5 h-3.5" />
            <span>Coming in Chapter 4 &bull; Love Coupon Book</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-anniv-cocoa mb-3">
            Anniversary Voucher Book
          </h2>
          <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto">
            Perforated love coupons with tear-away borders and redemption stamp animations.
          </p>
        </div>

        {/* Coupon Card Preview */}
        {coupons[0] && (
          <div className="w-full max-w-xl bg-anniv-card rounded-2xl p-6 sm:p-7 border-2 border-dashed border-anniv-rose/30 shadow-warm-sm text-left relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-anniv-rose flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" />
                <span>Romance Voucher Pass</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-anniv-peach text-anniv-rose text-[11px] font-semibold">
                {coupons[0].expires}
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-anniv-cocoa mb-1">
              {coupons[0].title}
            </h3>
            <p className="text-sm text-anniv-secondary leading-relaxed mb-3">
              {coupons[0].description}
            </p>
            <p className="text-xs text-anniv-truffle italic border-t border-anniv-borderSubtle/50 pt-2 mb-2">
              {coupons[0].terms}
            </p>
            <div className="text-xs text-anniv-rose font-medium pt-1">
              8 redeemable passes with localStorage persistence arrives in Chapter 4
            </div>
          </div>
        )}
      </section>

      {/* 7. Bucket List Landmark Section (Stage 4) */}
      <section id="bucket-list" className="w-full py-16 border-t border-anniv-borderSubtle/60 flex flex-col items-center scroll-mt-20">
        <div className="w-full max-w-4xl text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-anniv-peach text-anniv-rose border border-anniv-borderSubtle text-xs uppercase tracking-wider font-semibold mb-3 shadow-warm-sm">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Coming in Chapter 4 &bull; Bucket List</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-anniv-cocoa mb-3">
            Our Bucket List &amp; Future Dreams
          </h2>
          <p className="text-anniv-secondary text-sm sm:text-base max-w-xl mx-auto">
            Our checklist of shared adventures, complete with heart checkboxes and confetti celebrations.
          </p>
        </div>

        {/* Bucket List Preview */}
        <div className="w-full max-w-xl bg-anniv-card rounded-2xl p-6 sm:p-7 border border-anniv-borderSubtle shadow-warm-md text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-anniv-cocoa flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-anniv-rose" />
              <span>Dream Checklist Preview</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-anniv-peach text-anniv-rose">
              4 of {bucketListItems.length} Accomplished
            </span>
          </div>

          {/* Progress Bar Preview */}
          <div className="w-full bg-anniv-peach/50 h-2 rounded-full overflow-hidden mb-4">
            <div className="bg-anniv-rose h-full rounded-full w-1/2" />
          </div>

          {/* Preview Items */}
          <div className="space-y-2 mb-4">
            {bucketListItems[0] && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-anniv-peach/30 border border-anniv-borderSubtle/40">
                <Heart className="w-4 h-4 fill-anniv-rose text-anniv-rose shrink-0" />
                <span className="text-sm text-anniv-cocoa line-through opacity-80">
                  {bucketListItems[0].text}
                </span>
                {bucketListItems[0].targetYear && (
                  <span className="ml-auto text-xs text-anniv-rose font-medium">
                    {bucketListItems[0].targetYear}
                  </span>
                )}
              </div>
            )}
            {bucketListItems[4] && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/60 border border-anniv-borderSubtle/40">
                <Heart className="w-4 h-4 text-anniv-truffle shrink-0" />
                <span className="text-sm text-anniv-cocoa">
                  {bucketListItems[4].text}
                </span>
                <span className="ml-auto text-xs text-anniv-secondary font-medium">
                  Future
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-anniv-secondary flex items-center gap-1.5 pt-2 border-t border-anniv-borderSubtle/50">
            <Sparkles className="w-3.5 h-3.5 text-anniv-rose shrink-0" />
            <span>Interactive checkboxes with celebration confetti triggers arrive in Chapter 4</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default App;
