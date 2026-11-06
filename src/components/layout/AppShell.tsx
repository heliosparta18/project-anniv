import type { ReactNode } from 'react';
import { AmbientParticles } from '../common/AmbientParticles';

export interface AppShellProps {
  children: ReactNode;
  navbar?: ReactNode;
  footer?: ReactNode;
  audioWidget?: ReactNode;
}

/**
 * AppShell: Top-level layout container providing:
 * - Warm Cream background & Deep Cocoa primary text
 * - Zero horizontal overflow leak via `overflow-x-clip`
 * - Gentle ambient floating particles layer
 * - Sticky romantic navigation slot
 * - Accessible, responsive main viewport container
 * - Floating audio dock slot
 */
export const AppShell = ({
  children,
  navbar,
  footer,
  audioWidget,
}: AppShellProps) => {
  return (
    <div className="min-h-screen w-full bg-anniv-base text-anniv-cocoa font-sans relative flex flex-col overflow-x-clip selection:bg-anniv-blush selection:text-anniv-rose">
      {/* 1. Gentle Ambient Background Floating Particles */}
      <AmbientParticles />

      {/* 2. Romantic Sticky Navbar Slot */}
      {navbar && (
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-anniv-base/90 border-b border-anniv-borderSubtle/60 transition-colors duration-300">
          {navbar}
        </header>
      )}

      {/* 3. Main Content Container - Mobile-First Reflow */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {children}
      </main>

      {/* 4. Romantic Footer Slot */}
      {footer && (
        <footer className="w-full relative z-10 border-t border-anniv-borderSubtle/50 bg-anniv-card/60 mt-auto">
          {footer}
        </footer>
      )}

      {/* 5. Floating Audio Player Widget Dock Slot */}
      {audioWidget && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
          {audioWidget}
        </div>
      )}
    </div>
  );
};

export default AppShell;
