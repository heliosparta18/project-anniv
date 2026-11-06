import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { setupTestEnvironment } from './helpers/dom_mock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function verifyDevServerRuntime() {
  console.log('--- Starting Runtime Dev Server & Navigation Verification ---');
  setupTestEnvironment();

  // Track console errors and warnings
  const consoleErrors = [];
  const consoleWarns = [];
  const origError = console.error;
  const origWarn = console.warn;

  console.error = (...args) => {
    consoleErrors.push(args.map(a => String(a)).join(' '));
    origError(...args);
  };
  console.warn = (...args) => {
    // Ignore experimental type stripping node warnings
    const msg = args.map(a => String(a)).join(' ');
    if (!msg.includes('ExperimentalWarning')) {
      consoleWarns.push(msg);
    }
    origWarn(...args);
  };

  let server;
  try {
    const TEST_PORT = 5198;
    server = await createServer({
      root: rootDir,
      server: { port: TEST_PORT, strictPort: false },
      ssr: { external: ['react', 'react-dom', 'lucide-react', 'canvas-confetti'] }
    });

    await server.listen();
    const resolvedPort = server.config.server.port || TEST_PORT;
    const baseUrl = `http://localhost:${resolvedPort}`;
    console.log(`[PASS] Dev server started successfully at ${baseUrl}`);

    // 1. HTTP Endpoint checks
    const indexRes = await fetch(`${baseUrl}/`);
    assert.strictEqual(indexRes.status, 200, 'Dev server root must return 200 OK');
    const indexHtml = await indexRes.text();
    assert.ok(indexHtml.includes('<div id="root"></div>'), 'Index HTML must contain #root mount target');
    assert.ok(indexHtml.includes('Daffa &amp; Dinda') || indexHtml.includes('Daffa & Dinda'), 'Index HTML title must contain Daffa & Dinda');
    console.log('[PASS] Dev server index.html served with 200 OK and valid HTML payload');

    const appModuleRes = await fetch(`${baseUrl}/src/App.tsx`);
    assert.strictEqual(appModuleRes.status, 200, 'Dev server must serve transformed /src/App.tsx');
    console.log('[PASS] Dev server transforms and serves /src/App.tsx');

    // 2. Component loading & SSR rendering under Vite
    const { App } = await server.ssrLoadModule('/src/App.tsx');
    const renderedAppHtml = ReactDOMServer.renderToString(React.createElement(App));
    assert.ok(renderedAppHtml.length > 500, 'App must render non-empty HTML tree');
    assert.ok(renderedAppHtml.includes('Daffa'), 'Rendered tree must include Daffa');
    assert.ok(renderedAppHtml.includes('Dinda'), 'Rendered tree must include Dinda');
    console.log('[PASS] Full App component tree rendered with zero exceptions');

    // 3. Navigation Targets & Anchors Validation
    const navTargets = [
      '#hero',
      '#timeline',
      '#gallery',
      '#letter',
      '#reasons',
      '#coupons',
      '#bucket-list'
    ];
    for (const target of navTargets) {
      assert.ok(
        renderedAppHtml.includes(`id="${target.replace('#', '')}"`) ||
        renderedAppHtml.includes(`href="${target}"`),
        `Navigation target ${target} must be integrated in rendered app`
      );
    }
    console.log(`[PASS] All ${navTargets.length} navigation targets verified in DOM tree`);

    // 4. Audio Subsystem & Interactive Hooks Validation
    const { useAudioPlayer: _useAudioPlayer } = await server.ssrLoadModule('/src/hooks/useAudioPlayer.ts');
    const { musicTracks } = await server.ssrLoadModule('/src/data/anniversaryData.ts');
    assert.ok(musicTracks && musicTracks.length >= 4, 'Must have music tracks');
    assert.strictEqual(musicTracks[0].youtubeId, 'o25_Tn8BnFM', 'Primary track must be YouTube o25_Tn8BnFM');

    const { startRomanticChords, stopRomanticChords, isSynthPlaying, setSynthVolume } = await server.ssrLoadModule('/src/utils/audioSynth.ts');

    // Test audio synth interaction
    await startRomanticChords(0.8);
    assert.strictEqual(isSynthPlaying(), true, 'Synth audio must report playing');
    setSynthVolume(0.5);
    stopRomanticChords();
    assert.strictEqual(isSynthPlaying(), false, 'Synth audio must report stopped');
    console.log('[PASS] Audio player and synthesis interactions verified with zero errors');

    // 5. Check Console Errors
    assert.strictEqual(consoleErrors.length, 0, `Expected 0 console errors, but got ${consoleErrors.length}: ${consoleErrors.join(', ')}`);
    console.log('[PASS] Zero runtime console errors detected during full execution');

  } finally {
    console.error = origError;
    console.warn = origWarn;
    if (server) {
      await server.close();
      console.log('[PASS] Dev server stopped cleanly');
    }
  }

  console.log('='.repeat(72));
  console.log('  RUNTIME DEV SERVER & NAVIGATION VERIFICATION: 100% PASSED');
  console.log('='.repeat(72));
}

verifyDevServerRuntime().catch(err => {
  console.error('Runtime Dev Server Verification FAILED:', err);
  process.exit(1);
});
