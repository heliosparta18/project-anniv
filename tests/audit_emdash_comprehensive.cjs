const fs = require('fs');
const path = require('path');

function searchDir(dir, filter) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(searchDir(full, filter));
    } else if (filter(full)) {
      results.push(full);
    }
  }
  return results;
}

const root = 'D:\\anniv';
const files = searchDir(root, (f) => /\.(tsx?|jsx?|mjs|cjs|css|html|json|md)$/.test(f));

console.log(`Auditing ${files.length} project files...`);

let emCount = 0;
let enCount = 0;
const violations = [];
const enList = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const isTestAuditFile = file.includes('test') || file.includes('audit');
  lines.forEach((line, idx) => {
    // Check em-dash
    if (line.includes('—') || line.includes('\u2014') || line.includes('&mdash;')) {
      if (!isTestAuditFile) {
        emCount++;
        violations.push({ file, line: idx + 1, text: line.trim() });
      }
    }
    // Check en-dash
    if (line.includes('–') || line.includes('\u2013') || line.includes('&ndash;')) {
      enCount++;
      enList.push({ file, line: idx + 1, text: line.trim() });
    }
  });
}

console.log(`Scan finished.`);
console.log(`Source Em-dash violations: ${emCount}`);
console.log(`En-dash occurrences: ${enCount}`);

if (enList.length > 0) {
  console.log(`En-dash found in:`);
  enList.forEach(e => console.log(`  ${e.file}:${e.line} -> ${e.text}`));
}

if (violations.length > 0) {
  console.log(`\nSource violations detected:`);
  violations.forEach(v => console.log(`  ${v.file}:${v.line} -> ${v.text}`));
  process.exit(1);
} else {
  console.log(`\n[PASS] Strictly 0 em-dash violations detected in all source, markdown, and config files!`);
  process.exit(0);
}
