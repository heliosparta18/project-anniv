import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass } from '../helpers/responsive_checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const heroSectionPath = path.resolve(__dirname, '../../src/components/hero/HeroSection.tsx');
const liveCounterPath = path.resolve(__dirname, '../../src/components/hero/LiveCounter.tsx');

test('Feature 5 - Hero Section: Couple Names Display and Landmark Structure', () => {
  assert.ok(fs.existsSync(heroSectionPath), 'HeroSection.tsx must exist in src/components/hero/');
  const code = fs.readFileSync(heroSectionPath, 'utf8');

  // 1. Export check
  assert.ok(
    code.includes('export function HeroSection') || code.includes('export const HeroSection'),
    'HeroSection.tsx must export HeroSection component'
  );

  // 2. Semantic landmark & accessibility
  assert.ok(code.includes('id="hero"'), 'HeroSection must define landmark container with id="hero"');
  assert.ok(code.includes('aria-label='), 'HeroSection root container must have descriptive aria-label');

  // 3. Overflow blowout protection
  assert.ok(
    code.includes('overflow-x-clip'),
    'HeroSection root container must enforce overflow-x-clip to prevent mobile horizontal blowouts'
  );

  // 4. Editorial serif typography for couple names
  assert.ok(
    code.includes('font-serif'),
    'HeroSection must feature editorial serif typography (font-serif) for romantic header styling'
  );

  // 5. Couple names rendering logic (Rama & Alya)
  assert.ok(
    (code.includes('myName') && code.includes('partnerName')) ||
    (code.includes('Rama') && code.includes('Alya')),
    'HeroSection must render both couple names'
  );
  assert.ok(
    code.includes('&amp;') || code.includes('&'),
    'HeroSection must render romantic ampersand joining the couple names'
  );

  // 6. Antislop R-02 Copywriting hygiene: strict em-dash ban
  assert.ok(
    !code.includes('\u2014') && !code.includes('—'),
    'HeroSection.tsx must not contain any em dash (—) character per R-02 antislop rules'
  );
});

test('Feature 5 - Hero Section: Milestone Badge and Tagline', () => {
  assert.ok(fs.existsSync(heroSectionPath), 'HeroSection.tsx must exist');
  assert.ok(fs.existsSync(liveCounterPath), 'LiveCounter.tsx must exist in src/components/hero/');

  const heroCode = fs.readFileSync(heroSectionPath, 'utf8');
  const counterCode = fs.readFileSync(liveCounterPath, 'utf8');

  // 1. Tagline and subtagline rendering
  assert.ok(
    heroCode.includes('tagline'),
    'HeroSection must render the anniversary tagline in the main heading'
  );
  assert.ok(
    heroCode.includes('<h1') && heroCode.includes('font-serif'),
    'Anniversary tagline must be rendered inside an h1 heading with font-serif'
  );
  assert.ok(
    heroCode.includes('subtagline'),
    'HeroSection must render the heartfelt Gen-Z subtagline'
  );

  // 2. Integration of LiveCounter component
  assert.ok(
    heroCode.includes('<LiveCounter') || heroCode.includes('<LiveCounter/>'),
    'HeroSection must compose and render the LiveCounter component'
  );

  // 3. LiveCounter 6-unit Gregorian metrics
  const requiredUnits = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
  for (const unit of requiredUnits) {
    assert.ok(
      counterCode.toLowerCase().includes(unit),
      `LiveCounter.tsx must track and display metric unit: "${unit}"`
    );
  }

  // 4. Responsive grid reflow: mobile 3-column (<640px) to tablet/desktop 6-column (>=640px)
  assert.ok(
    counterCode.includes('grid-cols-3'),
    'LiveCounter must use 3-column grid on mobile (<640px) to prevent card squeezing'
  );
  assert.ok(
    counterCode.includes('sm:grid-cols-6'),
    'LiveCounter must expand to 6-column grid on viewports >= 640px'
  );

  // 5. Aesthetic card styling: soft peach/blush tints, warm cocoa text, pulsing separators
  assert.ok(
    counterCode.includes('bg-anniv-peach') || counterCode.includes('bg-anniv-blush'),
    'LiveCounter cards must feature soft peach or blush tint styling'
  );
  assert.ok(
    counterCode.includes('text-anniv-cocoa'),
    'LiveCounter cards must render values in warm cocoa typography'
  );
  assert.ok(
    counterCode.includes('animate-pulse'),
    'LiveCounter must feature subtle pulsing separator or indicator animation'
  );

  // 6. Tabular numbers to prevent layout shift during live ticking
  assert.ok(
    counterCode.includes('tabular-nums'),
    'LiveCounter numbers must apply tabular-nums to prevent layout shift as seconds tick'
  );

  // 7. Antislop R-02 Copywriting hygiene on LiveCounter
  assert.ok(
    !counterCode.includes('\u2014') && !counterCode.includes('—'),
    'LiveCounter.tsx must not contain any em dash (—) character per R-02 antislop rules'
  );
});

test('Feature 5 - Hero Section: Smooth Scroll CTA Link', () => {
  assert.ok(fs.existsSync(heroSectionPath), 'HeroSection.tsx must exist');
  const code = fs.readFileSync(heroSectionPath, 'utf8');

  // 1. Interactive button tag with semantic type
  assert.ok(
    code.includes('<button') && code.includes('type="button"'),
    'Celebration CTA must be an interactive button element with explicit type="button"'
  );

  // 2. Minimum touch target (>= 44x44px) compliance
  const buttonClassMatch = code.match(/<button[\s\S]*?className="([^"]+)"/);
  assert.ok(buttonClassMatch, 'Celebration button must specify className');
  const buttonClass = buttonClassMatch[1];
  assert.ok(
    validateTouchTargetClass(buttonClass) ||
    (buttonClass.includes('min-h-[48px]') && buttonClass.includes('min-w-[48px]')),
    `Celebration button must satisfy minimum 44x44px touch target (got "${buttonClass}")`
  );

  // 3. Canvas confetti celebration trigger
  assert.ok(
    code.includes('confetti'),
    'Celebration button must invoke canvas confetti on click'
  );
  assert.ok(
    code.includes('#9E4759') || code.includes('anniv-rose'),
    'Confetti celebration must include signature romantic wine/rose palette colors'
  );

  // 4. Smooth scrolling to #timeline target
  assert.ok(
    code.includes('timeline') && (code.includes('scrollIntoView') || code.includes('href="#timeline"')),
    'Celebration action must trigger smooth scrolling to #timeline landmark'
  );
  assert.ok(
    code.includes('smooth'),
    'Scrolling action must explicitly specify smooth scroll behavior'
  );

  // 5. Accessible attributes
  assert.ok(
    code.includes('aria-label='),
    'Celebration button must provide accessible aria-label'
  );
  assert.ok(
    code.includes('focus-visible'),
    'Celebration button must specify visible keyboard focus indicator'
  );
});
