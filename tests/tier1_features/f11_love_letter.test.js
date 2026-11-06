import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTouchTargetClass } from '../helpers/responsive_checker.js';
import { loveLetter } from '../../src/data/anniversaryData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const virtualEnvelopePath = path.resolve(__dirname, '../../src/components/letter/VirtualEnvelope.tsx');
const loveLetterSectionPath = path.resolve(__dirname, '../../src/components/letter/LoveLetterSection.tsx');
const waxSealPath = path.resolve(__dirname, '../../src/components/letter/WaxSeal.tsx');
const parchmentLetterPath = path.resolve(__dirname, '../../src/components/letter/ParchmentLetter.tsx');

const EM_DASH_CHAR = String.fromCharCode(0x2014);
const MDASH_ENTITY = '&' + 'mdash;';

function extractInteractiveElements(source) {
  const elements = [];
  const startRegex = /<(a|button)\s+/g;
  let match;
  while ((match = startRegex.exec(source)) !== null) {
    const tagName = match[1];
    const tagStart = match.index;
    let i = startRegex.lastIndex;
    let braceDepth = 0;
    let inString = null;
    let tagEnd = -1;

    while (i < source.length) {
      const ch = source[i];
      if (inString) {
        if (ch === inString && source[i - 1] !== '\\') inString = null;
      } else if (ch === '"' || ch === "'") {
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
      const classMatch = tagContent.match(/className="([^"]+)"/) || tagContent.match(/className=\{`([^`]+)`\}/);
      const hrefMatch = tagContent.match(/href=(?:"([^"]+)"|{([^}]+)})/);
      const ariaLabelMatch = tagContent.match(/aria-label="([^"]+)"/) || tagContent.match(/aria-label=\{`([^`]+)`\}/);
      elements.push({
        tagName,
        href: hrefMatch ? (hrefMatch[1] || hrefMatch[2]) : null,
        ariaLabel: ariaLabelMatch ? (ariaLabelMatch[1] || ariaLabelMatch[2]) : null,
        className: classMatch ? (classMatch[1] || classMatch[2]) : '',
        snippet: tagContent
      });
      startRegex.lastIndex = tagEnd + 1;
    }
  }
  return elements;
}

test('Feature 11 - Love Letter: Initial Sealed Envelope State', () => {
  // 1. Component exports and file existence
  assert.ok(fs.existsSync(virtualEnvelopePath), 'VirtualEnvelope.tsx must exist in src/components/letter/');
  assert.ok(fs.existsSync(loveLetterSectionPath), 'LoveLetterSection.tsx must exist in src/components/letter/');
  assert.ok(fs.existsSync(waxSealPath), 'WaxSeal.tsx must exist in src/components/letter/');
  assert.ok(fs.existsSync(parchmentLetterPath), 'ParchmentLetter.tsx must exist in src/components/letter/');

  const envelopeCode = fs.readFileSync(virtualEnvelopePath, 'utf8');
  const sectionCode = fs.readFileSync(loveLetterSectionPath, 'utf8');
  const waxCode = fs.readFileSync(waxSealPath, 'utf8');
  const parchmentCode = fs.readFileSync(parchmentLetterPath, 'utf8');

  assert.ok(
    envelopeCode.includes('export function VirtualEnvelope') || envelopeCode.includes('export const VirtualEnvelope'),
    'VirtualEnvelope.tsx must export VirtualEnvelope component'
  );
  assert.ok(
    sectionCode.includes('export function LoveLetterSection') || sectionCode.includes('export const LoveLetterSection'),
    'LoveLetterSection.tsx must export LoveLetterSection component'
  );
  assert.ok(
    waxCode.includes('export function WaxSeal') || waxCode.includes('export const WaxSeal'),
    'WaxSeal.tsx must export WaxSeal component'
  );
  assert.ok(
    parchmentCode.includes('export function ParchmentLetter') || parchmentCode.includes('export const ParchmentLetter'),
    'ParchmentLetter.tsx must export ParchmentLetter component'
  );

  // 2. Section landmark container and accessibility
  assert.ok(sectionCode.includes('id="letter"'), 'LoveLetterSection must define landmark container with id="letter"');
  assert.ok(sectionCode.includes('aria-label='), 'LoveLetterSection must define descriptive aria-label');
  assert.ok(
    sectionCode.includes('overflow-x-clip') || sectionCode.includes('overflow-x-hidden'),
    'LoveLetterSection must enforce overflow-x-clip to prevent horizontal mobile blowouts'
  );

  // 3. Sealed envelope visual structure and default state
  assert.ok(
    envelopeCode.includes('envelopeState') || envelopeCode.includes('isOpen') || envelopeCode.includes('isSealed'),
    'VirtualEnvelope must manage envelope sealed/opened state'
  );
  assert.ok(
    waxCode.includes('sealText') || envelopeCode.includes('sealText'),
    'WaxSeal / VirtualEnvelope must accept and display sealText monogram'
  );

  // 4. Touch target invariants on interactive elements in sealed state
  const waxInteractive = extractInteractiveElements(waxCode);
  assert.ok(waxInteractive.length >= 1, 'WaxSeal must include an interactive trigger button');
  for (const el of waxInteractive) {
    assert.ok(
      el.className.includes('min-h-[44px]') ||
      el.className.includes('min-w-[44px]') ||
      validateTouchTargetClass(el.className),
      `WaxSeal element <${el.tagName}> must satisfy WCAG 2.5.5 >= 44px touch target (found: "${el.className}")`
    );
  }

  // 5. Antislop R-02 Copywriting hygiene: strict 0 em-dash violations
  const letterSources = [
    { name: 'VirtualEnvelope.tsx', code: envelopeCode },
    { name: 'LoveLetterSection.tsx', code: sectionCode },
    { name: 'WaxSeal.tsx', code: waxCode },
    { name: 'ParchmentLetter.tsx', code: parchmentCode }
  ];
  for (const src of letterSources) {
    assert.ok(
      !src.code.includes(EM_DASH_CHAR) && !src.code.includes(MDASH_ENTITY),
      `${src.name} must not contain any em-dash character per R-02 antislop rules`
    );
  }
});

test('Feature 11 - Love Letter: Wax Seal Click Triggers Unsealing Animation', () => {
  const envelopeCode = fs.readFileSync(virtualEnvelopePath, 'utf8');
  const waxCode = fs.readFileSync(waxSealPath, 'utf8');

  // 1. Interactive wax seal button with accessible label
  const waxInteractive = extractInteractiveElements(waxCode);
  const sealButton = waxInteractive.find(el => el.tagName === 'button');
  assert.ok(sealButton, 'WaxSeal must render a button element');
  assert.ok(
    waxCode.includes('aria-label=') && (
      waxCode.toLowerCase().includes('segel') ||
      waxCode.toLowerCase().includes('surat') ||
      waxCode.toLowerCase().includes('seal')
    ),
    'WaxSeal button must provide descriptive aria-label'
  );

  // 2. Unsealing animation state and 3D transforms
  assert.ok(
    envelopeCode.includes('unsealing') || envelopeCode.includes('isBreaking') || envelopeCode.includes('handleBreakSeal'),
    'VirtualEnvelope must provide unsealing transition handling'
  );
  assert.ok(
    envelopeCode.includes('transform-origin') || envelopeCode.includes('origin-top') || envelopeCode.includes('[transform-origin:top]'),
    'VirtualEnvelope must define top flap transform origin'
  );
  assert.ok(
    envelopeCode.includes('rotateX') || envelopeCode.includes('rotate-x-') || envelopeCode.includes('[transform:rotateX(180deg)]'),
    'VirtualEnvelope must apply 3D rotateX flap opening animation'
  );

  // 3. Re-seal option to fold letter back into envelope
  assert.ok(
    envelopeCode.includes('handleReseal') || envelopeCode.includes('onReseal') || envelopeCode.includes('sealed'),
    'VirtualEnvelope must provide re-seal capability'
  );
});

test('Feature 11 - Love Letter: Parchment Unfolding and Heartfelt Typography', () => {
  const parchmentCode = fs.readFileSync(parchmentLetterPath, 'utf8');

  // 1. Parchment paper aesthetic and warm styling
  assert.ok(
    parchmentCode.includes('bg-[#') || parchmentCode.includes('bg-anniv-card') || parchmentCode.includes('bg-white'),
    'ParchmentLetter must apply warm vintage background styling'
  );
  assert.ok(
    parchmentCode.includes('shadow-warm'),
    'ParchmentLetter must apply signature warm cocoa shadow'
  );

  // 2. Heartfelt Indonesian Gen-Z copywriting and complete data schema rendering
  assert.ok(
    parchmentCode.includes('letter.salutation') || parchmentCode.includes('salutation'),
    'ParchmentLetter must render letter.salutation'
  );
  assert.ok(
    parchmentCode.includes('letter.opening') || parchmentCode.includes('opening'),
    'ParchmentLetter must render letter.opening'
  );
  assert.ok(
    parchmentCode.includes('paragraphs.map') || parchmentCode.includes('letter.paragraphs'),
    'ParchmentLetter must iterate over letter.paragraphs'
  );
  assert.ok(
    parchmentCode.includes('letter.closing') || parchmentCode.includes('closing'),
    'ParchmentLetter must render letter.closing'
  );
  assert.ok(
    parchmentCode.includes('letter.signature') || parchmentCode.includes('signature'),
    'ParchmentLetter must render letter.signature'
  );
  assert.ok(
    parchmentCode.includes('letter.date') || parchmentCode.includes('date'),
    'ParchmentLetter must render letter.date'
  );

  // 3. Romantic typography: Cormorant Garamond (font-serif) and Caveat (font-handwriting)
  assert.ok(
    parchmentCode.includes('font-serif'),
    'ParchmentLetter must style headings/salutation in font-serif'
  );
  assert.ok(
    parchmentCode.includes('font-handwriting'),
    'ParchmentLetter must render romantic signature in font-handwriting (Caveat)'
  );

  // 4. Production loveLetter data validation
  assert.strictEqual(typeof loveLetter.salutation, 'string');
  assert.ok(loveLetter.paragraphs.length >= 3, 'Production love letter must contain at least 3 paragraphs');
  assert.ok(loveLetter.signature.includes('Rama'), 'Production signature must contain author Rama');
  assert.strictEqual(loveLetter.sealText, 'R & A', 'Production seal text must be R & A');

  // 5. Re-seal button touch target verification
  const interactive = extractInteractiveElements(parchmentCode);
  assert.ok(interactive.length >= 1, 'ParchmentLetter must provide at least one interactive control (re-seal button)');
  for (const btn of interactive) {
    assert.ok(
      btn.className.includes('min-h-[44px]') ||
      btn.className.includes('min-w-[44px]') ||
      validateTouchTargetClass(btn.className),
      `ParchmentLetter element <${btn.tagName}> must satisfy WCAG 2.5.5 >= 44px touch target (found: "${btn.className}")`
    );
  }
});
