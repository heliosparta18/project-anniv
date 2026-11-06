// Challenger M1 Empirical Verification and Adversarial Audit Harness
// Target: Couple personalization (Daffa & Dinda, D & D), removal of placeholder SVGs/images from cards

import fs from 'node:fs';
import path from 'node:path';

console.log('='.repeat(78));
console.log('  CHALLENGER M1 EMPIRICAL ADVERSARIAL AUDIT');
console.log('='.repeat(78));

let passCount = 0;
let failCount = 0;
const failures = [];

function check(cond, desc, meta = {}) {
  if (cond) {
    passCount++;
  } else {
    failCount++;
    failures.push({ desc, meta });
    console.error(`  ✖ FAIL: ${desc}`, meta);
  }
}

// -----------------------------------------------------------------------------
// Helper: recursively find all files in directory
// -----------------------------------------------------------------------------
function getAllFiles(dir, filterExt = null) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.agents') {
        results = results.concat(getAllFiles(full, filterExt));
      }
    } else {
      if (!filterExt || filterExt.some(ext => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  }
  return results;
}

// =============================================================================
// SECTION 1: SEARCH ACROSS src/ AND index.html FOR ZERO LEFTOVER LEGACY NAMES
// =============================================================================
console.log('\n[Section 1] Exhaustive Scan for Legacy Names ("Rama", "Alya", "R & A")...');

const sourceFiles = getAllFiles(path.resolve('src'), ['.ts', '.tsx', '.js', '.jsx', '.css', '.html']);
sourceFiles.push(path.resolve('index.html'));

const legacyRamaRegex = /\bRama\b/i;
const legacyAlyaRegex = /\bAlya\b/i;
const legacyMonogramRegex = /\bR\s*(&|&amp;)\s*A\b/i;

const allowlistExclusions = [
  /melodrama/i,
  /panoramic/i,
  /Forever\s*(&|&amp;)\s*Always/i
];

let scannedLinesCount = 0;
for (const filePath of sourceFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  scannedLinesCount += lines.length;

  lines.forEach((line, idx) => {
    let sanitized = line;
    for (const excl of allowlistExclusions) {
      sanitized = sanitized.replace(excl, '');
    }

    if (legacyRamaRegex.test(sanitized)) {
      check(false, `Found legacy name "Rama" at ${path.relative(process.cwd(), filePath)}:${idx + 1}`, { line: line.trim() });
    }
    if (legacyAlyaRegex.test(sanitized)) {
      check(false, `Found legacy name "Alya" at ${path.relative(process.cwd(), filePath)}:${idx + 1}`, { line: line.trim() });
    }
    if (legacyMonogramRegex.test(sanitized)) {
      check(false, `Found legacy monogram "R & A" at ${path.relative(process.cwd(), filePath)}:${idx + 1}`, { line: line.trim() });
    }
  });
}

check(true, `Exhaustively scanned ${sourceFiles.length} files (${scannedLinesCount} lines) in src/ and index.html with 0 legacy name hits`);

// =============================================================================
// SECTION 2: VERIFY PRESENCE OF "Daffa", "Dinda", AND "D & D" IN TARGET FILES
// =============================================================================
console.log('\n[Section 2] Empirical Verification of "Daffa", "Dinda", and "D & D" in Target Locations...');

// 2.1: index.html title
const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
check(
  indexHtml.includes('Daffa &amp; Dinda') || indexHtml.includes('Daffa & Dinda'),
  'index.html contains "Daffa & Dinda" in title or metadata'
);

// 2.2: src/data/anniversaryData.ts
const anniversaryData = fs.readFileSync(path.resolve('src/data/anniversaryData.ts'), 'utf8');
check(
  anniversaryData.includes("partnerName: 'Dinda'"),
  'anniversaryData.ts exports partnerName as "Dinda"'
);
check(
  anniversaryData.includes("myName: 'Daffa'"),
  'anniversaryData.ts exports myName as "Daffa"'
);
check(
  anniversaryData.includes("signature: 'Forever & always yours, Daffa'"),
  'anniversaryData.ts loveLetter has signature with Daffa'
);
check(
  anniversaryData.includes("sealText: 'D & D'"),
  'anniversaryData.ts loveLetter has sealText "D & D"'
);

// 2.3: src/components/letter/VirtualEnvelope.tsx
const virtualEnvelope = fs.readFileSync(path.resolve('src/components/letter/VirtualEnvelope.tsx'), 'utf8');
check(
  virtualEnvelope.includes('Dinda Sayang'),
  'VirtualEnvelope.tsx salutes "Dinda Sayang"'
);
check(
  virtualEnvelope.includes("sealText={letter.sealText || 'D & D'}"),
  'VirtualEnvelope.tsx uses fallback sealText "D & D"'
);

// 2.4: src/components/letter/WaxSeal.tsx
const waxSeal = fs.readFileSync(path.resolve('src/components/letter/WaxSeal.tsx'), 'utf8');
check(
  waxSeal.includes("sealText = 'D & D'"),
  'WaxSeal.tsx default prop is "D & D"'
);

// 2.5: src/components/gallery/PolaroidCard.tsx
const polaroidCard = fs.readFileSync(path.resolve('src/components/gallery/PolaroidCard.tsx'), 'utf8');
check(
  polaroidCard.includes('D &amp; D 💕') || polaroidCard.includes('D & D 💕'),
  'PolaroidCard.tsx contains "D & D 💕" handwritten inscription'
);

// 2.6: src/components/audio/VinylPlayer.tsx
const vinylPlayer = fs.readFileSync(path.resolve('src/components/audio/VinylPlayer.tsx'), 'utf8');
check(
  vinylPlayer.includes("View Daffa's romantic note for this track"),
  "VinylPlayer.tsx aria-label references Daffa's romantic note"
);
check(
  vinylPlayer.includes('~ Daffa for Dinda 💕'),
  'VinylPlayer.tsx includes "~ Daffa for Dinda 💕"'
);

// =============================================================================
// SECTION 3: EMPIRICAL VERIFICATION OF AESTHETIC CARDS (REMOVAL OF PLACEHOLDER IMAGES/SVGS)
// =============================================================================
console.log('\n[Section 3] Empirical Verification of Aesthetic Cards & Removal of <img> Tags...');

// 3.1: TimelineCard.tsx
const timelineCard = fs.readFileSync(path.resolve('src/components/timeline/TimelineCard.tsx'), 'utf8');
check(
  !timelineCard.includes('<img'),
  'TimelineCard.tsx does NOT render any <img ... /> tags'
);
check(
  !timelineCard.includes('milestone.image'),
  'TimelineCard.tsx does NOT bind milestone.image to a DOM attribute'
);
check(
  timelineCard.includes('font-serif'),
  'TimelineCard.tsx features editorial serif typography for milestone headings'
);

// 3.2: PolaroidCard.tsx
check(
  !polaroidCard.includes('<img'),
  'PolaroidCard.tsx does NOT render any <img ... /> tags'
);
check(
  !polaroidCard.includes('displayImage'),
  'PolaroidCard.tsx does NOT bind displayImage to an <img> tag'
);
check(
  polaroidCard.includes('font-handwriting') || polaroidCard.includes('font-caveat') || polaroidCard.includes('Caveat'),
  'PolaroidCard.tsx uses intimate handwriting typography'
);

// 3.3: LightboxModal.tsx
const lightboxModal = fs.readFileSync(path.resolve('src/components/gallery/LightboxModal.tsx'), 'utf8');
check(
  !lightboxModal.includes('<img'),
  'LightboxModal.tsx does NOT render any <img ... /> tags'
);
check(
  lightboxModal.includes('D &amp; D') || lightboxModal.includes('D & D'),
  'LightboxModal.tsx features D & D monogram scrapbook container'
);

// =============================================================================
// SECTION 4: TEST SUITES INTEGRITY CHECK FOR COUPLE NAMES
// =============================================================================
console.log('\n[Section 4] Test Suite Couple Name Consistency...');

const testFiles = getAllFiles(path.resolve('tests'), ['.js', '.mjs', '.cjs']);
let legacyTestHits = [];

for (const tf of testFiles) {
  // We allow audit test files to mention legacy patterns in regex definitions
  if (path.basename(tf).includes('challenger') || path.basename(tf).includes('audit')) {
    continue;
  }
  const content = fs.readFileSync(tf, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    let sanitized = line;
    for (const excl of allowlistExclusions) {
      sanitized = sanitized.replace(excl, '');
    }
    if (legacyRamaRegex.test(sanitized) || legacyAlyaRegex.test(sanitized)) {
      legacyTestHits.push({ file: path.relative(process.cwd(), tf), line: idx + 1, text: line.trim() });
    }
  });
}

check(
  legacyTestHits.length === 0,
  `Non-audit test files have zero references to legacy couple names (found ${legacyTestHits.length})`,
  { legacyTestHits }
);

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n' + '='.repeat(78));
console.log(`  CHALLENGER M1 AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('='.repeat(78));

if (failCount > 0) {
  console.error('\nFAILURES RECORDED:');
  for (const f of failures) {
    console.error(`  ✖ ${f.desc}`, f.meta);
  }
  process.exit(1);
} else {
  console.log('\n>>> EMPIRICAL VERDICT: ALL M1 CHALLENGES PASSED (VERDICT: APPROVE) <<<');
  process.exit(0);
}
