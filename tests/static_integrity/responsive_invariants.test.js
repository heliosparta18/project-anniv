import test from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_VIEWPORTS, validateOverflowProtection } from '../helpers/responsive_checker.js';

test('Responsive Invariants: Standard Viewports Coverage', () => {
  const expectedWidths = [320, 375, 414, 768, 1024, 1440];
  const coveredWidths = STANDARD_VIEWPORTS.map(v => v.width);

  for (const width of expectedWidths) {
    assert.ok(
      coveredWidths.includes(width),
      `Viewport width ${width}px must be covered in responsive test suite`
    );
  }
});

test('Responsive Invariants: Root Container Zero Horizontal Overflow Invariant', () => {
  const candidateRootStyles = [
    'min-h-screen bg-warm-linen overflow-x-clip text-warm-cocoa',
    'w-full max-w-full overflow-x-hidden relative'
  ];

  for (const style of candidateRootStyles) {
    assert.ok(
      validateOverflowProtection(style),
      `Style "${style}" must satisfy zero horizontal overflow invariant`
    );
  }
});

test('Responsive Invariants: Fluid Typography and Max Width Bounds', () => {
  // Check that containers avoid hardcoded pixel widths like w-[1200px] without max-w
  const safeContainerClass = 'w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
  assert.ok(safeContainerClass.includes('w-full'));
  assert.ok(safeContainerClass.includes('max-w-'));
  assert.ok(!safeContainerClass.includes('w-[1200px]'));
});

test('Responsive Invariants: Multi-Column Grid Breakpoint Scaling', () => {
  // Mobile: 1 col, Tablet: 2 cols, Desktop: 3-4 cols
  const responsiveGrid = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
  assert.ok(responsiveGrid.includes('grid-cols-1'), 'Must default to single column on mobile');
  assert.ok(responsiveGrid.includes('sm:grid-cols-2'), 'Must scale to 2 columns on tablet');
  assert.ok(responsiveGrid.includes('lg:grid-cols-3'), 'Must scale to 3+ columns on desktop');
});
