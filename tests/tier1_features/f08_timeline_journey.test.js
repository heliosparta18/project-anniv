import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass } from '../helpers/responsive_checker.js';
import {
  parseMilestoneDate,
  sortMilestonesChronologically,
  INDONESIAN_MONTHS,
} from '../../src/components/timeline/timelineUtils.ts';
import { milestones } from '../../src/data/anniversaryData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const timelineSectionPath = path.resolve(__dirname, '../../src/components/timeline/TimelineSection.tsx');
const timelineCardPath = path.resolve(__dirname, '../../src/components/timeline/TimelineCard.tsx');
const timelineUtilsPath = path.resolve(__dirname, '../../src/components/timeline/timelineUtils.ts');

const EM_DASH_CHAR = String.fromCharCode(0x2014);
const MDASH_ENTITY = '&' + 'mdash;';

function extractButtonElements(source) {
  const elements = [];
  const startRegex = /<button\s+/g;
  let match;
  while ((match = startRegex.exec(source)) !== null) {
    const tagStart = match.index;
    let i = startRegex.lastIndex;
    let braceDepth = 0;
    let inString = null;
    let tagEnd = -1;

    while (i < source.length) {
      const ch = source[i];
      if (inString) {
        if (ch === inString && source[i - 1] !== '\\') inString = null;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
      } else if (ch === '{') {
        braceDepth++;
      } else if (ch === '}') {
        braceDepth--;
      } else if (ch === '>' && braceDepth === 0) {
        tagEnd = i;
        break;
      }
      i++;
    }

    if (tagEnd !== -1) {
      const tagContent = source.slice(tagStart, tagEnd + 1);
      const classMatch = tagContent.match(/className=(?:["']([^"']+)["']|\{`([\s\S]*?)`\})/);
      elements.push({
        tagContent,
        className: classMatch ? (classMatch[1] || classMatch[2]) : ''
      });
      startRegex.lastIndex = tagEnd + 1;
    }
  }
  return elements;
}

test('Feature 8 - Journey Timeline: Chronological Milestone Sorting', () => {
  // 1. Component exports and file existence
  assert.ok(fs.existsSync(timelineSectionPath), 'TimelineSection.tsx must exist in src/components/timeline/');
  assert.ok(fs.existsSync(timelineCardPath), 'TimelineCard.tsx must exist in src/components/timeline/');
  assert.ok(fs.existsSync(timelineUtilsPath), 'timelineUtils.ts must exist in src/components/timeline/');

  const sectionCode = fs.readFileSync(timelineSectionPath, 'utf8');
  const cardCode = fs.readFileSync(timelineCardPath, 'utf8');

  assert.ok(
    sectionCode.includes('export function TimelineSection') || sectionCode.includes('export const TimelineSection'),
    'TimelineSection.tsx must export TimelineSection component'
  );
  assert.ok(
    cardCode.includes('export function TimelineCard') || cardCode.includes('export const TimelineCard'),
    'TimelineCard.tsx must export TimelineCard component'
  );

  // 2. Date parsing functionality for Indonesian month strings
  assert.strictEqual(typeof parseMilestoneDate, 'function', 'parseMilestoneDate must be exported');
  assert.strictEqual(typeof sortMilestonesChronologically, 'function', 'sortMilestonesChronologically must be exported');

  // Verify Indonesian month mapping covers all 12 calendar months
  assert.strictEqual(Object.keys(INDONESIAN_MONTHS).length, 12, 'INDONESIAN_MONTHS must define all 12 calendar months');

  const d1 = parseMilestoneDate('14 Februari 2025');
  const d2 = parseMilestoneDate('28 Maret 2025');
  const d3 = parseMilestoneDate('04 Mei 2025');
  const d4 = parseMilestoneDate('19 Agustus 2025');
  const d5 = parseMilestoneDate('04 Mei 2026');

  assert.ok(d1 < d2, '14 Februari 2025 must precede 28 Maret 2025');
  assert.ok(d2 < d3, '28 Maret 2025 must precede 04 Mei 2025');
  assert.ok(d3 < d4, '04 Mei 2025 must precede 19 Agustus 2025');
  assert.ok(d4 < d5, '19 Agustus 2025 must precede 04 Mei 2026');

  // 3. Chronological sorting invariance on shuffled inputs
  const shuffled = [milestones[4], milestones[0], milestones[3], milestones[1], milestones[2]];
  const sorted = sortMilestonesChronologically(shuffled);
  assert.strictEqual(sorted[0].id, 'milestone-1');
  assert.strictEqual(sorted[1].id, 'milestone-2');
  assert.strictEqual(sorted[2].id, 'milestone-3');
  assert.strictEqual(sorted[3].id, 'milestone-4');
  assert.strictEqual(sorted[4].id, 'milestone-5');

  // 4. Production milestones array is chronologically ordered
  const prodSorted = sortMilestonesChronologically(milestones);
  for (let i = 0; i < milestones.length; i++) {
    assert.strictEqual(milestones[i].id, prodSorted[i].id, `Production milestone at index ${i} must already be chronological`);
  }

  // 5. Antislop R-02 Copywriting hygiene: strict 0 em-dash violations
  assert.ok(
    !sectionCode.includes(EM_DASH_CHAR) && !sectionCode.includes(MDASH_ENTITY),
    'TimelineSection.tsx must not contain any em-dash character per R-02 antislop rules'
  );
  assert.ok(
    !cardCode.includes(EM_DASH_CHAR) && !cardCode.includes(MDASH_ENTITY),
    'TimelineCard.tsx must not contain any em-dash character per R-02 antislop rules'
  );
});

test('Feature 8 - Journey Timeline: Category Badges and Soft Styling', () => {
  const sectionCode = fs.readFileSync(timelineSectionPath, 'utf8');
  const cardCode = fs.readFileSync(timelineCardPath, 'utf8');

  // 1. Category filter buttons in TimelineSection
  const requiredCategories = ['all', 'firsts', 'trips', 'memories', 'milestones'];
  for (const cat of requiredCategories) {
    assert.ok(
      sectionCode.includes(`'${cat}'`) || sectionCode.includes(`"${cat}"`),
      `TimelineSection must support filtering category: "${cat}"`
    );
  }

  // 2. Category badge styling in TimelineCard
  assert.ok(
    cardCode.includes('CATEGORY_CONFIG') || (cardCode.includes('firsts') && cardCode.includes('milestones')),
    'TimelineCard must define category badge configurations'
  );

  // 3. Craft motifs: washi tape ribbon, warm card styling, editorial serif typography
  assert.ok(
    cardCode.includes('washi-tape'),
    'TimelineCard must render organic washi-tape craft motif'
  );
  assert.ok(
    cardCode.includes('bg-anniv-card'),
    'TimelineCard must apply warm ivory/linen background (bg-anniv-card)'
  );
  assert.ok(
    cardCode.includes('font-serif'),
    'TimelineCard must style milestone headings with editorial serif typography (font-serif)'
  );
  assert.ok(
    cardCode.includes('shadow-warm'),
    'TimelineCard must apply signature warm cocoa shadows (shadow-warm-md or shadow-warm-lg)'
  );

  // 4. Aesthetic typography card presentation (R1: clean typography, no placeholder images)
  assert.ok(
    !cardCode.includes('<img'),
    'TimelineCard must remove placeholder img tags per R1 requirement'
  );
  assert.ok(
    cardCode.includes('font-serif'),
    'TimelineCard must style milestone headings with editorial serif typography'
  );
  assert.ok(
    cardCode.includes('font-sans'),
    'TimelineCard must present narrative with clean readable sans typography'
  );

  // 5. Empty state support when category filter matches 0 items
  assert.ok(
    sectionCode.includes('filteredMilestones.length === 0') || sectionCode.includes('length === 0'),
    'TimelineSection must handle and render an empty state when no milestones match filter'
  );
});

test('Feature 8 - Journey Timeline: Mobile Single-Spine Collapse Layout', () => {
  const sectionCode = fs.readFileSync(timelineSectionPath, 'utf8');
  const cardCode = fs.readFileSync(timelineCardPath, 'utf8');

  // 1. Landmark & accessibility attributes
  assert.ok(
    sectionCode.includes('id="timeline"'),
    'TimelineSection must define root landmark id="timeline" matching navbar and CTA anchors'
  );
  assert.ok(
    sectionCode.includes('scroll-mt-20'),
    'TimelineSection must include scroll-mt-20 to prevent sticky navbar overlap during smooth scroll'
  );
  assert.ok(
    sectionCode.includes('overflow-x-clip'),
    'TimelineSection must enforce overflow-x-clip to prevent mobile horizontal blowouts'
  );
  assert.ok(
    sectionCode.includes('aria-label='),
    'TimelineSection must define accessible aria-label on root container'
  );

  // 2. Single-spine mobile (<640px) and alternating desktop (>=640px) spine classes
  // Mobile spine aligned left: left-6 (or left-8)
  assert.ok(
    sectionCode.includes('left-6') || sectionCode.includes('left-8'),
    'Timeline spine line must align to the left side on mobile (<640px)'
  );
  // Desktop spine aligned center: sm:left-1/2
  assert.ok(
    sectionCode.includes('sm:left-1/2'),
    'Timeline spine line must center at sm:left-1/2 on tablet/desktop viewports (>=640px)'
  );

  // 3. Card layout reflow: left padding on mobile, alternating on desktop
  assert.ok(
    cardCode.includes('pl-14') || cardCode.includes('pl-12') || cardCode.includes('pl-16'),
    'TimelineCard must provide left padding on mobile (<640px) to clear the spine line'
  );
  assert.ok(
    cardCode.includes('sm:pl-0'),
    'TimelineCard must reset left padding on desktop (sm:pl-0) to support alternating layout'
  );
  assert.ok(
    cardCode.includes('sm:mr-auto') && cardCode.includes('sm:ml-auto'),
    'TimelineCard must alternate sides on desktop using sm:mr-auto and sm:ml-auto'
  );

  // 4. Spine node positioning: mobile left alignment and desktop center alignment
  assert.ok(
    cardCode.includes('left-6') || cardCode.includes('left-8'),
    'Spine node must align with the left spine on mobile'
  );
  assert.ok(
    cardCode.includes('sm:left-1/2'),
    'Spine node must center at sm:left-1/2 on desktop'
  );

  // 5. Interactive touch target compliance (WCAG 2.5.5 >= 44x44px)
  const buttonElements = extractButtonElements(sectionCode);
  assert.ok(buttonElements.length >= 1, 'TimelineSection must render interactive filter buttons');

  for (const el of buttonElements) {
    const className = el.className;
    assert.ok(
      validateTouchTargetClass(className) ||
      (className.includes('min-h-[44px]') && className.includes('min-w-[44px]')),
      `Interactive button must satisfy >= 44x44px touch target (got: "${className}")`
    );
    assert.ok(
      className.includes('focus-visible'),
      'Interactive button must define visible keyboard focus indicator'
    );
  }
});
