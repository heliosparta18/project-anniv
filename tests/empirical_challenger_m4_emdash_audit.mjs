// Comprehensive Em-Dash Audit across D:\anniv\src and D:\anniv\tests
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('='.repeat(78));
console.log('  CHALLENGER M4: DEEP RECURSIVE EM-DASH SCAN');
console.log('  Scanning every single file in src/ and tests/');
console.log('='.repeat(78));

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json', '.md']) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extensions));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const srcFiles = getAllFiles(path.join(rootDir, 'src'));
const testFiles = getAllFiles(path.join(rootDir, 'tests'));

console.log(`Discovered ${srcFiles.length} files in src/`);
console.log(`Discovered ${testFiles.length} files in tests/`);

let totalSrcViolations = 0;
let totalTestUnintentionalViolations = 0;
const srcViolations = [];
const testViolations = [];

// 1. Scan src files
for (const file of srcFiles) {
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check literal em-dash
    if (line.includes('—')) {
      totalSrcViolations++;
      srcViolations.push({ file: relPath, line: idx + 1, char: '—', text: line.trim() });
    }
    // Check unicode escape \u2014
    if (line.includes('\u2014')) {
      totalSrcViolations++;
      srcViolations.push({ file: relPath, line: idx + 1, char: '\\u2014', text: line.trim() });
    }
    // Check HTML entity &mdash;
    if (line.includes('&mdash;')) {
      totalSrcViolations++;
      srcViolations.push({ file: relPath, line: idx + 1, char: '&mdash;', text: line.trim() });
    }
  });
}

// 2. Scan test files
for (const file of testFiles) {
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  const isAuditScanner = relPath.includes('emdash') || relPath.includes('audit');
  
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (line.includes('—') && !isAuditScanner) {
      // Check if it's an assertion or test failure description specifically checking for em-dash
      const isAntiRegressionAssertion = 
        line.includes('includes(') ||
        line.includes('must not contain') ||
        line.includes('antislop rules') ||
        line.includes('em dash') ||
        line.includes('em-dash');

      if (!isAntiRegressionAssertion) {
        totalTestUnintentionalViolations++;
        testViolations.push({ file: relPath, line: idx + 1, char: '—', text: line.trim() });
      }
    }
  });
}

console.log(`\nResults:`);
console.log(`  Source violations in src/: ${totalSrcViolations}`);
console.log(`  Unintentional test violations in tests/: ${totalTestUnintentionalViolations}`);

if (srcViolations.length > 0) {
  console.error('\n✖ VIOLATIONS DETECTED IN SRC/:');
  srcViolations.forEach(v => console.error(`  ${v.file}:${v.line} [${v.char}] -> ${v.text}`));
}

if (testViolations.length > 0) {
  console.error('\n✖ UNINTENTIONAL LITERAL EM-DASH IN TESTS/:');
  testViolations.forEach(v => console.error(`  ${v.file}:${v.line} [${v.char}] -> ${v.text}`));
}

if (totalSrcViolations === 0 && totalTestUnintentionalViolations === 0) {
  console.log('\n✔ [PASS] Strictly 0 em-dash violations detected across all source and test files!');
  process.exit(0);
} else {
  console.error('\n✖ [FAIL] Em-dash violations found!');
  process.exit(1);
}
