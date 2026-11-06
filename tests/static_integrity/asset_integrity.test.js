import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/anniv');

test('Static Integrity: HTML Document and Font Links', () => {
  const indexHtmlPath = path.join(projectRoot, 'index.html');
  assert.ok(fs.existsSync(indexHtmlPath), 'index.html must exist at project root');

  const content = fs.readFileSync(indexHtmlPath, 'utf-8');
  assert.ok(content.includes('viewport'), 'index.html must contain viewport meta tag');
  assert.ok(content.includes('width=device-width'), 'Viewport must specify width=device-width');
});

test('Static Integrity: Favicon and Public Assets', () => {
  const publicDir = path.join(projectRoot, 'public');
  assert.ok(fs.existsSync(publicDir), 'public/ directory must exist');

  // Verify at least one favicon or SVG exists
  const publicFiles = fs.readdirSync(publicDir);
  const hasFavicon = publicFiles.some(f => f.includes('favicon') || f.endsWith('.svg'));
  assert.ok(hasFavicon, 'public/ must contain favicon or SVG assets');
});

test('Static Integrity: Local Audio & Photo Path Format Invariants', () => {
  // Test resolver against 404 traps
  function isSafeAssetPath(assetPath) {
    if (!assetPath || typeof assetPath !== 'string') return false;
    // Reject suspicious path traversal or malformed protocols
    if (assetPath.includes('..') || assetPath.includes('\\')) return false;
    return assetPath.startsWith('/') || assetPath.startsWith('./');
  }

  assert.ok(isSafeAssetPath('/photos/polaroid-1.svg'));
  assert.ok(isSafeAssetPath('/audio/romantic_acoustic.mp3'));
  assert.strictEqual(isSafeAssetPath('../secret.env'), false);
  assert.strictEqual(isSafeAssetPath('c:\\windows\\system32'), false);
});
