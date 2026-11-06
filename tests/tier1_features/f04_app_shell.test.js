import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appShellPath = path.resolve(__dirname, '../../src/components/layout/AppShell.tsx');
const ambientParticlesPath = path.resolve(__dirname, '../../src/components/common/AmbientParticles.tsx');
const navbarPath = path.resolve(__dirname, '../../src/components/layout/Navbar.tsx');

test('Feature 4 - Responsive App Shell: Source Inspection of AppShell.tsx', () => {
  assert.ok(fs.existsSync(appShellPath), 'AppShell.tsx must exist');
  const code = fs.readFileSync(appShellPath, 'utf8');

  // 1. Horizontal overflow blowout protection
  assert.ok(
    code.includes('overflow-x-clip'),
    'AppShell root container must use overflow-x-clip to prevent mobile horizontal blowouts'
  );

  // 2. Uses Tailwind @theme tokens
  assert.ok(code.includes('bg-anniv-base'), 'AppShell root must apply bg-anniv-base');
  assert.ok(code.includes('text-anniv-cocoa'), 'AppShell root must apply text-anniv-cocoa');
  assert.ok(code.includes('selection:bg-anniv-blush'), 'AppShell must define selection highlight style');

  // 3. Composes AmbientParticles
  assert.ok(code.includes('<AmbientParticles />') || code.includes('<AmbientParticles'), 'AppShell must compose AmbientParticles');

  // 4. Sticky romantic header slot
  assert.ok(code.includes('sticky top-0'), 'AppShell must provide sticky header navigation slot');
  assert.ok(code.includes('backdrop-blur-md'), 'Sticky header must feature aesthetic backdrop blur');
  assert.ok(code.includes('z-40'), 'Sticky header must have high z-index (z-40)');

  // 5. Main layout max-width bounds
  assert.ok(code.includes('max-w-6xl'), 'Main content container must constrain to max-w-6xl');
  assert.ok(code.includes('mx-auto'), 'Main content container must be centered with mx-auto');
  assert.ok(code.includes('px-4 sm:px-6 lg:px-8'), 'Main content container must provide responsive horizontal padding');

  // 6. Floating audio dock slot
  assert.ok(code.includes('fixed bottom-5 right-5'), 'AppShell must support floating audio widget dock slot');

  // 7. Semantic landmark hierarchy
  assert.ok(code.includes('<main'), 'AppShell must render semantic <main> tag');
  assert.ok(code.includes('<footer'), 'AppShell must support semantic <footer> tag');
});

test('Feature 4 - Responsive App Shell: AmbientParticles Floating Layer Safety', () => {
  assert.ok(fs.existsSync(ambientParticlesPath), 'AmbientParticles.tsx must exist');
  const code = fs.readFileSync(ambientParticlesPath, 'utf8');

  // Container click-through safety
  assert.ok(code.includes('pointer-events-none'), 'Particles container must have pointer-events-none so it never blocks user clicks');
  assert.ok(code.includes('fixed inset-0'), 'Particles must span the full viewport');
  assert.ok(code.includes('overflow-hidden'), 'Particles container must have overflow-hidden');
  assert.ok(code.includes('aria-hidden="true"'), 'Particles layer must have aria-hidden="true" for screen reader accessibility');

  // Animation binding
  assert.ok(code.includes('floatAmbientParticle'), 'Particles must bind floatAmbientParticle CSS keyframes');
  assert.ok(code.includes('petal') && code.includes('sparkle'), 'Particles should render both rose petals and champagne sparkle stars');
});

test('Feature 4 - Responsive App Shell: Navbar Responsive & Touch Standards', () => {
  assert.ok(fs.existsSync(navbarPath), 'Navbar.tsx must exist');
  const code = fs.readFileSync(navbarPath, 'utf8');

  // Mobile toggle button touch target >= 44x44px
  assert.ok(
    code.includes('min-w-[44px]') && code.includes('min-h-[44px]'),
    'Navbar mobile toggle button must explicitly satisfy min-w-[44px] min-h-[44px]'
  );

  // Accessible aria attributes
  assert.ok(code.includes('aria-expanded'), 'Mobile menu toggle button must specify aria-expanded');
  assert.ok(code.includes('aria-label'), 'Mobile menu toggle button must specify aria-label');
});
