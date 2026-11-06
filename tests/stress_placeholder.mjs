// Standalone Challenger Stress Test for Placeholder Asset Resilience
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Load placeholder generator
// Node 23 supports type stripping with --experimental-strip-types
const placeholderModule = await import('../src/utils/placeholderGenerator.ts');
const {
  getPlaceholderPhoto,
  generateSvgMarkup,
  generateSvgDataUrl,
  DEFAULT_PLACEHOLDERS
} = placeholderModule;

console.log('='.repeat(70));
console.log('  CHALLENGER ASSET RESILIENCE EMPIRICAL STRESS TEST');
console.log('='.repeat(70));

let totalAsserts = 0;
function check(condition, message) {
  assert.ok(condition, message);
  totalAsserts++;
}

// Helper to validate SVG markup
function validateSvgXml(svgString, contextDesc) {
  check(typeof svgString === 'string', `${contextDesc}: Output must be a string`);
  check(svgString.startsWith('<svg') || svgString.trim().startsWith('<svg'), `${contextDesc}: Must start with <svg tag`);
  check(svgString.trim().endsWith('</svg>'), `${contextDesc}: Must end with </svg> closing tag`);
  check(svgString.includes('xmlns="http://www.w3.org/2000/svg"'), `${contextDesc}: Must include SVG XML namespace`);
  check(svgString.includes('viewBox="'), `${contextDesc}: Must include viewBox attribute`);
  check(!svgString.includes('NaN'), `${contextDesc}: SVG must not contain NaN`);
  check(!svgString.includes('undefined'), `${contextDesc}: SVG must not contain undefined`);
  check(!svgString.includes('null'), `${contextDesc}: SVG must not contain null`);
  check(svgString.includes('<linearGradient'), `${contextDesc}: Must contain gradient definitions`);
  check(svgString.includes('</defs>'), `${contextDesc}: Must properly close defs element`);

  // Basic XML tag balance check for key tags
  const tags = ['defs', 'pattern', 'g', 'text'];
  for (const tag of tags) {
    const openCount = (svgString.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const closeCount = (svgString.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    check(openCount === closeCount, `${contextDesc}: Tag <${tag}> count (${openCount}) must match </${tag}> (${closeCount})`);
  }
}

// Helper to validate Data URL
function validateDataUrl(dataUrl, contextDesc) {
  check(dataUrl.startsWith('data:image/svg+xml;utf8,'), `${contextDesc}: Must be svg+xml data URL`);
  const rawSvg = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
  validateSvgXml(rawSvg, `${contextDesc} (Decoded)`);
  return rawSvg;
}

// -----------------------------------------------------------------------------
// Test Suite 1: getPlaceholderPhoto() Standard Keys
// -----------------------------------------------------------------------------
console.log('\n[Suite 1] Testing standard milestone and polaroid keys...');
const standardKeys = [
  'milestone-1', 'milestone-2', 'milestone-3', 'milestone-4', 'milestone-5',
  'polaroid-1', 'polaroid-2', 'polaroid-3', 'polaroid-4', 'polaroid-5', 'polaroid-6'
];

for (const key of standardKeys) {
  const result = getPlaceholderPhoto(key);
  const svg = validateDataUrl(result, `Key: ${key}`);
  const preset = DEFAULT_PLACEHOLDERS[key];
  const expectedTitle = preset.title.replace(/&/g, '&amp;');
  check(svg.includes(expectedTitle), `Key ${key} SVG must contain title "${expectedTitle}"`);
  console.log(`  ✓ ${key} -> valid SVG data URL (${result.length} chars)`);
}

// -----------------------------------------------------------------------------
// Test Suite 2: getPlaceholderPhoto() Simulated Missing / Edge Case URLs
// -----------------------------------------------------------------------------
console.log('\n[Suite 2] Testing simulated missing, malformed, and edge-case URLs...');
const edgeCases = [
  { input: '', desc: 'Empty string' },
  { input: '   ', desc: 'Whitespace only' },
  { input: 'missing-photo.jpg', desc: 'Arbitrary missing JPEG' },
  { input: '/photos/missing_wedding.png', desc: 'Missing PNG under /photos/' },
  { input: 'https://cdn.example.com/assets/polaroid-4.webp?size=large', desc: 'Complex URL containing polaroid-4' },
  { input: '/photos/milestone-2.svg', desc: 'Local path containing milestone-2' },
  { input: 'milestone-999', desc: 'Out of range milestone number (defaults to polaroid-1)' },
  { input: 'polaroid-99', desc: 'Out of range polaroid number (defaults to polaroid-1)' },
  { input: 'completely_random_asset_id_xyz', desc: 'Random unknown string' },
  { input: '<script>alert(1)</script>.png', desc: 'XSS injection attempt in URL' },
  { input: 'foto_kenangan_💕_pantai.jpg', desc: 'Unicode emoji in path' }
];

for (const ec of edgeCases) {
  try {
    const result = getPlaceholderPhoto(ec.input);
    validateDataUrl(result, `Edge Case: ${ec.desc}`);
    console.log(`  ✓ [${ec.desc}] -> gracefully returned valid SVG (${result.length} chars)`);
  } catch (err) {
    assert.fail(`Edge case failed for "${ec.desc}": ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// Test Suite 3: Adversarial XML Injection and Special Character Escaping
// -----------------------------------------------------------------------------
console.log('\n[Suite 3] Testing XML special character escaping...');
const adversarialOptions = {
  width: 600,
  height: 400,
  title: 'Romeo & Juliet <3 "Forever" \'Always\'',
  subtitle: 'Dinner & Wine <tag> test & "quotes"',
  category: 'Candid & Cute > Real',
  theme: 'rose',
  icon: 'heart'
};

const advSvg = generateSvgMarkup(adversarialOptions);
validateSvgXml(advSvg, 'Adversarial XML');

// Verify entities were escaped
check(advSvg.includes('Romeo &amp; Juliet &lt;3 &quot;Forever&quot; &apos;Always&apos;'), 'Title XML entities properly escaped');
check(advSvg.includes('Dinner &amp; Wine &lt;tag&gt; test &amp; &quot;quotes&quot;'), 'Subtitle XML entities properly escaped');
check(advSvg.includes('Candid &amp; Cute &gt; Real'), 'Category XML entities escaped properly');
// Ensure no raw unescaped <tag> or unescaped &
check(!advSvg.includes('<tag>'), 'Raw unescaped <tag> must not be in SVG text');
console.log('  ✓ XML injection and special characters safely escaped without syntax breakdown');

// -----------------------------------------------------------------------------
// Test Suite 4: All Themes and Icons Combinations
// -----------------------------------------------------------------------------
console.log('\n[Suite 4] Testing all palette themes and icon variants...');
const themes = ['sunset', 'coffee', 'rose', 'night', 'cozy', 'non_existent_theme'];
const icons = ['heart', 'sun', 'coffee', 'camera', 'car', 'cake', 'rain', 'unknown_icon'];

for (const theme of themes) {
  for (const icon of icons) {
    const opts = {
      width: 500,
      height: 500,
      title: `Theme ${theme}`,
      subtitle: `Icon ${icon}`,
      theme,
      icon
    };
    const svg = generateSvgMarkup(opts);
    validateSvgXml(svg, `Theme: ${theme}, Icon: ${icon}`);
    
    // Direct test of generateSvgDataUrl
    const dataUrl = generateSvgDataUrl(opts);
    validateDataUrl(dataUrl, `DataUrl Theme: ${theme}, Icon: ${icon}`);
  }
}
console.log(`  ✓ Verified all ${themes.length * icons.length} combinations of themes and icons (including fallbacks)`);

// -----------------------------------------------------------------------------
// Test Suite 5: Static SVG Files On-Disk Verification
// -----------------------------------------------------------------------------
console.log('\n[Suite 5] Verifying 11 static SVG files in D:\\anniv\\public\\photos\\...');
const publicPhotosDir = join(process.cwd(), 'public', 'photos');

for (const key of standardKeys) {
  const filePath = join(publicPhotosDir, `${key}.svg`);
  check(existsSync(filePath), `Static file ${key}.svg must exist in public/photos`);
  const content = readFileSync(filePath, 'utf-8');
  check(content.length > 500, `Static file ${key}.svg must have non-trivial size (>500 bytes, got ${content.length})`);
  validateSvgXml(content, `Static file ${key}.svg`);
  console.log(`  ✓ public/photos/${key}.svg verified on disk (${content.length} bytes)`);
}

console.log('\n' + '='.repeat(70));
console.log(`  CHALLENGER ASSET RESILIENCE AUDIT PASSED: ${totalAsserts} assertions satisfied!`);
console.log('='.repeat(70));
