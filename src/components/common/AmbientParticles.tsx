import { useMemo } from 'react';

interface ParticleSpec {
  id: number;
  type: 'petal' | 'sparkle';
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  sway: number;
}

/**
 * AmbientParticles:
 * Renders 10 subtle, floating romantic rose petals and champagne sparkle stars
 * that drift upward in the background. Ultra-lightweight and accessible.
 */
export const AmbientParticles = () => {
  // Fixed deterministic specs to guarantee zero layout shifts and clean SSR/hydration
  const particles: ParticleSpec[] = useMemo(
    () => [
      { id: 1, type: 'petal', left: '6%', size: 18, duration: 16, delay: 0, opacity: 0.32, sway: 26 },
      { id: 2, type: 'sparkle', left: '17%', size: 13, duration: 13, delay: 4, opacity: 0.40, sway: -18 },
      { id: 3, type: 'petal', left: '29%', size: 22, duration: 21, delay: 8, opacity: 0.28, sway: 22 },
      { id: 4, type: 'sparkle', left: '44%', size: 12, duration: 15, delay: 2, opacity: 0.45, sway: -16 },
      { id: 5, type: 'petal', left: '56%', size: 17, duration: 18, delay: 6, opacity: 0.30, sway: 30 },
      { id: 6, type: 'sparkle', left: '69%', size: 14, duration: 14, delay: 10, opacity: 0.38, sway: -20 },
      { id: 7, type: 'petal', left: '80%', size: 20, duration: 19, delay: 3, opacity: 0.26, sway: 24 },
      { id: 8, type: 'sparkle', left: '89%', size: 13, duration: 16, delay: 7, opacity: 0.42, sway: -14 },
      { id: 9, type: 'petal', left: '95%', size: 16, duration: 22, delay: 1, opacity: 0.28, sway: 20 },
      { id: 10, type: 'petal', left: '37%', size: 19, duration: 17, delay: 11, opacity: 0.31, sway: -24 },
    ],
    []
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="ambient-particle absolute"
          style={{
            left: p.left,
            bottom: '-40px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `floatAmbientParticle ${p.duration}s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
            animationDelay: `${p.delay}s`,
            ['--particle-max-opacity' as string]: p.opacity,
            ['--sway' as string]: `${p.sway}px`,
          }}
        >
          {p.type === 'petal' ? (
            /* Delicate Rose Petal SVG */
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-anniv-rose drop-shadow-xs"
            >
              <path
                d="M16 3C10 3 4 8.5 4 16C4 22 9 28 16 29C23 28 28 22 28 16C28 8.5 22 3 16 3Z"
                fill="currentColor"
                fillOpacity="0.85"
              />
              <path
                d="M16 5C13 11 13 21 16 27"
                stroke="#FAF7F2"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeOpacity="0.6"
              />
            </svg>
          ) : (
            /* Romantic 4-Point Sparkle Star SVG */
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-anniv-champagne"
            >
              <path
                d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
                fill="#D4A5A5"
                fillOpacity="0.9"
              />
              <circle cx="12" cy="12" r="1.5" fill="#FFFDF9" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};

export default AmbientParticles;
