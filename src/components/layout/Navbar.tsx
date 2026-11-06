import { useState } from 'react';
import { Heart, Menu, X, Sparkles } from 'lucide-react';
import { coupleProfile } from '../../data/anniversaryData';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Timeline', href: '#timeline' },
  { label: 'Memories', href: '#gallery' },
  { label: 'Love Letter', href: '#letter' },
  { label: 'Reasons', href: '#reasons' },
  { label: 'Vouchers', href: '#coupons' },
  { label: 'Bucket List', href: '#bucket-list' },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
      {/* Brand / Logo */}
      <a
        href="#hero"
        onClick={(e) => handleNavClick(e, '#hero')}
        className="group min-h-[44px] min-w-[44px] py-1.5 flex items-center gap-2.5 text-anniv-cocoa font-serif text-xl sm:text-2xl font-bold tracking-tight hover:text-anniv-rose transition-colors duration-200"
      >
        <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-anniv-peach text-anniv-rose shadow-warm-sm group-hover:scale-105 transition-transform duration-200">
          <Heart className="w-4 h-4 fill-current" />
        </span>
        <span className="flex items-center gap-1.5">
          <span>{coupleProfile.myName}</span>
          <span className="text-anniv-rose font-handwriting text-2xl font-bold">&amp;</span>
          <span>{coupleProfile.partnerName}</span>
        </span>
      </a>

      {/* Desktop Navigation Links */}
      <div className="hidden lg:flex items-center gap-2">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => handleNavClick(e, item.href)}
            className="min-h-[44px] inline-flex items-center px-3.5 py-2.5 text-sm font-medium text-anniv-secondary hover:text-anniv-cocoa hover:bg-anniv-peach/60 rounded-full transition-all duration-200"
          >
            {item.label}
          </a>
        ))}
        <a
          href="#letter"
          onClick={(e) => handleNavClick(e, '#letter')}
          className="ml-2 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold text-anniv-card bg-anniv-rose hover:bg-anniv-roseHover rounded-full shadow-warm-sm transition-all duration-200 hover:shadow-warm-md hover:-translate-y-0.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Open Letter</span>
        </a>
      </div>

      {/* Mobile Menu Toggle (Min 44x44px Touch Target) */}
      <div className="flex lg:hidden items-center">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-anniv-cocoa hover:bg-anniv-peach/80 transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-anniv-card/95 backdrop-blur-lg border-b border-anniv-borderSubtle shadow-warm-lg py-4 px-6 lg:hidden flex flex-col gap-2 z-50">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="min-h-[44px] flex items-center px-4 py-2.5 text-base font-medium text-anniv-cocoa hover:bg-anniv-peach/70 rounded-xl transition-colors"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#letter"
            onClick={(e) => handleNavClick(e, '#letter')}
            className="min-h-[44px] mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-sm uppercase tracking-wider font-semibold text-anniv-card bg-anniv-rose hover:bg-anniv-roseHover rounded-xl shadow-warm-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Love Letter</span>
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
