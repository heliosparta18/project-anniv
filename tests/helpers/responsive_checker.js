/**
 * Responsive layout and touch target invariant validator
 */

export const STANDARD_VIEWPORTS = [
  { name: 'Small Mobile', width: 320, height: 568 },
  { name: 'Standard iPhone SE/Mini', width: 375, height: 667 },
  { name: 'Large Mobile iPhone Plus/Pro Max', width: 414, height: 896 },
  { name: 'Tablet Portrait iPad', width: 768, height: 1024 },
  { name: 'Tablet Landscape / Small Desktop', width: 1024, height: 768 },
  { name: 'Full Desktop', width: 1440, height: 900 }
];

export const MIN_TOUCH_TARGET_SIZE = 44; // WCAG 2.5.5 / Apple Human Interface Guidelines 44x44px

export function validateTouchTargetClass(className) {
  if (!className || typeof className !== 'string') return false;

  // Height check: explicit min-h >= 44px, fixed h >= 44px, h-full, OR adequate vertical padding
  const hasMinH = /min-h-\[(4[4-9]|[5-9][0-9]|\d{3,})px\]|\bh-(1[1-9]|[2-9][0-9])\b|\bh-full\b/.test(className);
  const hasAdequateVerticalPadding = /\b(py|p)-(3|3\.5|[4-9]|\d{2,})\b/.test(className);
  const satisfiesHeight = hasMinH || hasAdequateVerticalPadding;

  // Width check: explicit min-w >= 44px, fixed w >= 44px, w-full, OR adequate horizontal padding
  const hasMinW = /min-w-\[(4[4-9]|[5-9][0-9]|\d{3,})px\]|\bw-(1[1-9]|[2-9][0-9])\b|\bw-full\b/.test(className);
  const hasAdequateHorizontalPadding = /\b(px|p)-(3|3\.5|[4-9]|\d{2,})\b/.test(className);
  const satisfiesWidth = hasMinW || hasAdequateHorizontalPadding;

  return satisfiesHeight && satisfiesWidth;
}

export function validateOverflowProtection(htmlOrCss) {
  if (!htmlOrCss || typeof htmlOrCss !== 'string') return false;
  const hasOverflowClip = /overflow-x-clip/.test(htmlOrCss);
  const hasOverflowHidden = /overflow-x-hidden/.test(htmlOrCss);
  return hasOverflowClip || hasOverflowHidden;
}
