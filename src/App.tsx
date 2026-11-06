import { Heart } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { VinylPlayer } from './components/audio/VinylPlayer';
import { TimelineSection } from './components/timeline/TimelineSection';
import { PolaroidGallery } from './components/gallery/PolaroidGallery';
import { LoveLetterSection } from './components/letter/LoveLetterSection';
import { ReasonsDeck } from './components/reasons/ReasonsDeck';
import { CouponBook } from './components/coupons/CouponBook';
import { BucketList } from './components/bucketlist/BucketList';
import { coupleProfile } from './data/anniversaryData';

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
            {coupleProfile.myName} &amp; {coupleProfile.partnerName} &bull; 4 Years of Beautiful Memories
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

      {/* 4. Love Letter Landmark Section (Feature 11) */}
      <LoveLetterSection />

      {/* 5. Reasons Why I Love You Card Deck (Feature 12) */}
      <ReasonsDeck />

      {/* 6. Relationship Voucher Book (Feature 13) */}
      <CouponBook />

      {/* 7. Our Bucket List & Future Dreams (Feature 14) */}
      <BucketList />
    </AppShell>
  );
}

export default App;
